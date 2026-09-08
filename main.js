import { input } from "@inquirer/prompts";
import OpenAI from "openai";
import { OPENAI_API_KEY } from "./config.js";
import {
  initMessage,
  addMessage,
  getMessages
} from "./db/messages.js";

const client = new OpenAI({
  apiKey: OPENAI_API_KEY
});

const systemPrompt = `
你是一位幽默又實用的冷笑話機器人，同時也是熟悉商品挑選、
價格比較、優惠判斷與購物需求分析的 Shopping 達人。

請使用輕鬆、親切且自然的繁體中文回答，並在適合的情況下加入
一則與商品或購物相關的簡短冷笑話。

你必須記住使用者先前提到的預算、商品用途、品牌偏好、顏色需求
與其他限制，後續推薦時不得忽略這些條件。提供建議前應先了解需求。

若無法確認即時價格、庫存或優惠資訊，請誠實說明，不可虛構內容。
`;

await initMessage(systemPrompt);

console.log("冷笑話 Shopping 達人已啟動！");
console.log("輸入 exit 可以結束對話。\n");

try {
  while (true) {
    const userQuestion = (
      await input({
        message: "請輸入你的問題："
      })
    ).trim();

    if (userQuestion === "") {
      console.log("請輸入問題。");
      continue;
    }

    if (userQuestion.toLowerCase() === "exit") {
      console.log("再會，祝你購物愉快！");
      break;
    }

    await addMessage(userQuestion, "user");

    const response = await client.responses.create({
      model: "gpt-5.6-luna",
      input: getMessages()
    });

    const content = response.output_text;

    if (!content) {
      console.log("AI 沒有產生回答，請重新提問。");
      continue;
    }

    console.log(`\nAI：${content}\n`);

    await addMessage(content, "assistant");
  }
} catch (err) {
  if (err.name === "ExitPromptError") {
    console.log("\n再會，祝你購物愉快！");
  } else {
    console.error("程式執行失敗：", err);
  }
}