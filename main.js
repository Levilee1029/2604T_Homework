import { input } from "@inquirer/prompts";
import OpenAI from "openai";
import { OPENAI_API_KEY } from "./config.js";
import { initMessage, addMessage, getMessages } from "./db/messages.js";

const client = new OpenAI({ apiKey: OPENAI_API_KEY });

await initMessage(
  "你是一位幽默又實用的冷笑話機器人，同時也是熟悉商品挑選、價格比較、優惠判斷及購物需求分析的 Shopping 達人。請使用輕鬆、親切的繁體中文回答，每次回覆可自然加入一則與商品或購物相關的冷笑話。你需要記住使用者提到的預算、用途、偏好與限制，並依照前面的對話提供合適建議。若無法確認商品資訊，請誠實說明，不可虛構價格、品牌或優惠內容。"
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

    const response = await client.responses.create({
      model: "gpt-5.6-luna",
      input: getMessages(),
    });

    const content = response.output_text;
    console.log(content);

    await addMessage(content, "assistant");
  }
} catch (err) {
  if (err.name === "ExitPromptError") {
    console.log("\n再會~");
  } else {
    throw err;
  }
}
