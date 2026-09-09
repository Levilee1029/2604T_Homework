import { input } from "@inquirer/prompts";
import { client, DEFAULT_MODEL } from "./lib/openai.js";
import { spinner } from "./utils/spinner.js";
import { toOpenAITool } from "./utils/func-tool.js";
import {
  currentTimeTool,
  weatherTool
} from "./tools/index.js";


const toolList = [
  currentTimeTool,
  weatherTool
];


const tools = toolList.map(toOpenAITool);


const TOOLS_BY_NAME = Object.fromEntries(
  toolList.map(tool => [tool.name, tool])
);

const MAX_TOOL_ROUNDS = 8;

const SYSTEM_PROMPT = `
你是一位親切且精確的生活資訊助理，可以協助使用者查詢目前時間
與指定城市的天氣狀況。請使用自然、清楚的繁體中文回答。

當使用者詢問現在時間、目前幾點、今日日期或星期幾時，
你必須呼叫已註冊的時間工具，不可以自行推測目前時間。

當使用者詢問某個城市的天氣、溫度、降雨狀況或是否適合外出時，
你必須呼叫已註冊的天氣工具，不可以自行猜測即時天氣。

如果使用者在同一個問題中同時詢問時間與天氣，
你必須呼叫時間工具及天氣工具。取得兩個工具的執行結果後，
再將目前時間與天氣資訊整合成一段完整的繁體中文回答。

如果工具執行失敗，請誠實說明原因，不可虛構時間、
溫度或天氣資訊。
`;

/*
 * 保存整個程式執行期間的對話歷史。
 */
const history = [
  {
    role: "system",
    content: SYSTEM_PROMPT
  }
];

/*
 * 顯示本次作業實際提供給 AI 的工具。
 */
console.log(
  "本作業已註冊工具：",
  toolList.map(tool => tool.name)
);

/**
 * 處理使用者的一個問題。
 *
 * @param {string} userQuestion 使用者的問題
 * @returns {Promise<string>} AI 最終回答
 */
async function processQuestion(userQuestion) {
  history.push({
    role: "user",
    content: userQuestion
  });

  let totalToolCalls = 0;

  for (
    let round = 1;
    round <= MAX_TOOL_ROUNDS;
    round += 1
  ) {
    const spin = spinner("思考中...").start();

    let response;

    try {
      response = await client.responses.create({
        model: DEFAULT_MODEL,
        input: history,
        tools,
        tool_choice: "auto"
      });
    } finally {
      spin.stop();
    }

    /*
     * 保存模型輸出。
     * 其中可能包含一般訊息或 function_call。
     */
    history.push(...response.output);

    const functionCalls = response.output.filter(
      item => item.type === "function_call"
    );

    /*
     * 沒有工具呼叫時，代表模型已產生最終文字回答。
     */
    if (functionCalls.length === 0) {
      const finalAnswer = response.output_text;

      if (!finalAnswer) {
        throw new Error("AI 沒有產生文字回答");
      }

      console.log(
        `\n本題累計工具呼叫數量：${totalToolCalls}`
      );

      return finalAnswer;
    }

    totalToolCalls += functionCalls.length;

    console.log(
      `\n本輪工具呼叫數量：${functionCalls.length}`
    );

    /*
     * 同一輪可能同時有時間與天氣兩個工具呼叫。
     */
    for (const functionCall of functionCalls) {
      const functionName = functionCall.name;
      const tool = TOOLS_BY_NAME[functionName];

      if (!tool) {
        throw new Error(
          `模型要求了未註冊的工具：${functionName}`
        );
      }

      let rawArguments;

      try {
        rawArguments = JSON.parse(
          functionCall.arguments || "{}"
        );
      } catch {
        throw new Error(
          `${functionName} 的工具參數不是有效的 JSON`
        );
      }

      /*
       * 使用教材工具內的 Zod Schema 驗證參數。
       */
      const parsedArguments =
        tool.parameters.parse(rawArguments);

      console.log("\n===== Function Calling =====");
      console.log(`工具名稱：${functionName}`);
      console.log(
        `工具參數：${JSON.stringify(parsedArguments)}`
      );

      try {
        const result = await tool.fn(
          parsedArguments
        );

        console.log(
          `工具結果：${JSON.stringify(result)}`
        );
        console.log("============================");

        /*
         * 把工具結果加入歷史，下一輪再交給模型。
         */
        history.push({
          type: "function_call_output",
          call_id: functionCall.call_id,
          output: JSON.stringify({
            success: true,
            data: result
          })
        });
      } catch (error) {
        console.log(
          `工具執行錯誤：${error.message}`
        );
        console.log("============================");

        /*
         * 即使工具執行失敗，也把錯誤結果交回模型，
         * 讓模型向使用者說明。
         */
        history.push({
          type: "function_call_output",
          call_id: functionCall.call_id,
          output: JSON.stringify({
            success: false,
            error: error.message
          })
        });
      }
    }
  }

  throw new Error(
    `Tool calling 超過 ${MAX_TOOL_ROUNDS} 輪，已停止執行`
  );
}

console.log("\n天氣與時間助理已啟動");
console.log("輸入 exit 可以結束程式\n");

try {
  while (true) {
    const userQuestion = (
      await input({
        message: "請輸入你的問題："
      })
    ).trim();

    if (userQuestion === "") {
      console.log(
        "問題不可為空，請重新輸入。\n"
      );
      continue;
    }

    if (userQuestion.toLowerCase() === "exit") {
      console.log("再會！");
      break;
    }

    try {
      const finalAnswer = await processQuestion(
        userQuestion
      );

      console.log(
        `\nAI 最終回答：${finalAnswer}\n`
      );
    } catch (error) {
      console.error(
        `\n本題執行失敗：${error.message}\n`
      );
    }
  }
} catch (error) {
  if (error.name === "ExitPromptError") {
    console.log("\n再會！");
  } else {
    console.error(
      "程式執行失敗：",
      error.message
    );

    process.exitCode = 1;
  }
}