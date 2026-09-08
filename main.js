import { input } from "@inquirer/prompts";
import OpenAI from "openai";
import { OPENAI_API_KEY } from "./config.js";
import { initMessage, addMessage, getMessages } from "./db/messages.js";
import { calculatorTool, calculate } from "./src/tools/calculator.js";

const client = new OpenAI({ apiKey: OPENAI_API_KEY });

await initMessage(
  `你是一位幽默又實用的冷笑話機器人，同時也是熟悉商品挑選、
價格比較、優惠判斷及購物需求分析的 Shopping 達人。
請使用輕鬆、親切的繁體中文回答，每次回覆可自然加入一則與商品
或購物相關的冷笑話。

凡是使用者提出加法、減法、乘法、除法、括號運算、商品折扣、總價、
平均分攤或剩餘預算等需要數字計算的問題，你必須使用 calculate 工具，
不可以自行心算或直接猜測答案。取得工具結果後，再使用繁體中文說明
計算方式與結果。

你需要記住使用者提到的預算、用途、偏好與限制，並依照前面的對話
提供合適建議。若無法確認商品資訊，請誠實說明，不可虛構價格、
品牌或優惠內容。`
);

try {
  while (true) {
    const userQuestion = (
      await input({ message: "請輸入你的問題：" })
    ).trim();

    if (userQuestion === "") continue;
    if (userQuestion.toLowerCase() === "exit") {
      console.log("再會~");
      break;
    }

    await addMessage(userQuestion);

        // 第一次 API 呼叫：讓 AI 判斷是否需要使用計算機
    let response = await client.responses.create({
      model: "gpt-5.6-luna",
      input: getMessages(),
      tools: [calculatorTool],
      tool_choice: "auto"
    });


    // 找出 AI 回傳的 Function Calling
    const functionCalls = response.output.filter(
      item => item.type === "function_call"
    );

    console.log(
      `本次工具呼叫數量：${functionCalls.length}`
    );

    if (functionCalls.length > 0) {
      const toolOutputs = [];

      for (const functionCall of functionCalls) {
        console.log("\n===== Function Calling =====");
        console.log(`工具名稱：${functionCall.name}`);

        try {
          const args = JSON.parse(functionCall.arguments);

          console.log(
            `工具參數：${JSON.stringify(args)}`
          );

          if (functionCall.name !== "calculate") {
            throw new Error(
              `找不到工具：${functionCall.name}`
            );
          }

          const result = calculate(args.expression);

          console.log(`計算結果：${result}`);

          toolOutputs.push({
            type: "function_call_output",
            call_id: functionCall.call_id,
            output: JSON.stringify({
              success: true,
              expression: args.expression,
              result
            })
          });
        } catch (error) {
          console.log(`工具執行錯誤：${error.message}`);

          toolOutputs.push({
            type: "function_call_output",
            call_id: functionCall.call_id,
            output: JSON.stringify({
              success: false,
              error: error.message
            })
          });
        }

        console.log("============================");
      }

      // 第二次 API 呼叫：將計算結果交回 AI
      response = await client.responses.create({
        model: "gpt-5.6-luna",
        previous_response_id: response.id,
        input: toolOutputs,
        tools: [calculatorTool]
      });
    }

    const content = response.output_text;

    if (content) {
      console.log(`AI 最終回答：${content}`);
      await addMessage(content, "assistant");
    } else {
      console.log("AI 沒有產生文字回答。");
    }
  }
} catch (err) {
  if (err.name === "ExitPromptError") {
    console.log("\n再會~");
  } else {
    throw err;
  }
}
