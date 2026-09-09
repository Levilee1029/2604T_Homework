import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createEmbedding } from "./embedding.js";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFilePath);

const outputPath = path.resolve(
  currentDirectory,
  "../data/cityKnowledge.json"
);

const cityKnowledge = [
  {
    id: "city-001",
    title: "臺北市",
    category: "北部城市",
    content:
      "臺北市是臺灣重要的都市觀光目的地，著名景點包括臺北101、國立故宮博物院、龍山寺與西門町。臺北的大眾運輸便利，捷運可連接主要商圈、文化景點及夜市，適合喜歡城市觀光、歷史文物、購物與美食的旅客。"
  },
  {
    id: "city-002",
    title: "臺中市",
    category: "中部城市",
    content:
      "臺中市位於臺灣中部，旅遊特色結合城市建築、文化藝術與海線自然景觀。代表景點包括國家歌劇院、國立自然科學博物館、高美濕地與逢甲夜市。臺中也以太陽餅、珍珠奶茶及多元商圈聞名，適合安排城市與海線綜合行程。"
  },
  {
    id: "city-003",
    title: "臺南市",
    category: "南部城市",
    content:
      "臺南市具有豐富的歷史文化與古蹟資源，代表景點包括安平古堡、赤崁樓、臺南孔廟與安平老街。臺南也以牛肉湯、蝦捲、碗粿及各式傳統小吃受到旅客喜愛，適合對臺灣歷史、廟宇建築、老街及地方美食有興趣的人。"
  },
  {
    id: "city-004",
    title: "高雄市",
    category: "南部城市",
    content:
      "高雄市是臺灣南部的重要港都，旅遊特色包括海港景觀、文化藝術與水岸休閒。代表景點包括駁二藝術特區、旗津、愛河與蓮池潭。旅客可以欣賞港口風景、參觀藝術展覽、品嘗海鮮，或沿著水岸騎自行車。"
  },
  {
    id: "city-005",
    title: "花蓮縣",
    category: "東部地區",
    content:
      "花蓮縣位於臺灣東部，東臨太平洋，西側接近中央山脈，以山海自然景觀及較慢的旅遊步調為主要特色。代表景點包括太魯閣、七星潭與花東縱谷，適合喜歡自然風景、海岸景觀、戶外健行及慢旅行的旅客。"
  }
];

async function initializeKnowledgeBase() {
  console.log("開始建立臺灣城市迷你知識庫...\n");

  const documents = [];

  for (const city of cityKnowledge) {
    console.log(`正在建立 Embedding：${city.title}`);

    /*
     * 將標題、分類及內容一起轉成向量，
     * 有助於搜尋時理解城市名稱與旅遊特色。
     */
    const embeddingText = [
      `城市：${city.title}`,
      `分類：${city.category}`,
      `介紹：${city.content}`
    ].join("\n");

    const embedding = await createEmbedding(
      embeddingText
    );

    documents.push({
      ...city,
      embedding
    });

    console.log(`完成：${city.title}`);
    console.log(`向量維度：${embedding.length}\n`);
  }

  await fs.mkdir(path.dirname(outputPath), {
    recursive: true
  });

  await fs.writeFile(
    outputPath,
    JSON.stringify(documents, null, 2),
    "utf8"
  );

  console.log("知識庫初始化完成");
  console.log(`資料筆數：${documents.length}`);
  console.log(`儲存位置：${outputPath}`);
}

initializeKnowledgeBase().catch(error => {
  console.error(
    "建立知識庫失敗：",
    error.message
  );

  process.exitCode = 1;
});