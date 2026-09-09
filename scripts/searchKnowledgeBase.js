import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createEmbedding,
  cosineSimilarity
} from "./embedding.js";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFilePath);

const knowledgeBasePath = path.resolve(
  currentDirectory,
  "../data/cityKnowledge.json"
);

/**
 * 載入本機知識庫。
 *
 * @returns {Promise<Array>} 知識庫資料
 */
async function loadKnowledgeBase() {
  try {
    const fileContent = await fs.readFile(
      knowledgeBasePath,
      "utf8"
    );

    const documents = JSON.parse(fileContent);

    if (!Array.isArray(documents)) {
      throw new Error("知識庫內容格式不正確");
    }

    if (documents.length === 0) {
      throw new Error("知識庫目前沒有任何資料");
    }

    return documents;
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(
        "找不到知識庫，請先執行 node scripts/initKnowledgeBase.js"
      );
    }

    throw error;
  }
}

/**
 * 搜尋與查詢文字最接近的知識。
 *
 * @param {string} query 使用者查詢文字
 * @param {number} limit 回傳結果數量
 * @returns {Promise<Array>} 搜尋結果
 */
async function searchKnowledgeBase(
  query,
  limit = 3
) {
  if (
    typeof query !== "string" ||
    query.trim() === ""
  ) {
    throw new Error("搜尋文字不可為空");
  }

  const documents = await loadKnowledgeBase();

  console.log("正在建立查詢向量...");

  const queryEmbedding = await createEmbedding(
    query.trim()
  );

  const searchResults = documents.map(document => {
    if (!Array.isArray(document.embedding)) {
      throw new Error(
        `${document.title} 沒有有效的向量資料`
      );
    }

    const score = cosineSimilarity(
      queryEmbedding,
      document.embedding
    );

    return {
      id: document.id,
      title: document.title,
      category: document.category,
      content: document.content,
      score
    };
  });

  return searchResults
    .sort((first, second) => {
      return second.score - first.score;
    })
    .slice(0, limit);
}

const testQueries = [
  "我想去一個有很多古蹟、老街和傳統小吃的地方。",
  "哪個臺灣城市適合欣賞港口風景和參觀藝術展覽？",
  "我喜歡山海自然景色、戶外健行和步調緩慢的旅行。"
];

/**
 * 執行三組查詢測試。
 */
async function runSearchTests() {
  console.log("開始執行臺灣城市知識庫搜尋測試");
  console.log(`知識庫位置：${knowledgeBasePath}`);

  for (
    let queryIndex = 0;
    queryIndex < testQueries.length;
    queryIndex += 1
  ) {
    const query = testQueries[queryIndex];

    console.log(
      `\n========== 查詢 ${queryIndex + 1} ==========`
    );
    console.log(`問題：${query}`);

    const results = await searchKnowledgeBase(
      query,
      3
    );

    for (
      let resultIndex = 0;
      resultIndex < results.length;
      resultIndex += 1
    ) {
      const result = results[resultIndex];

      console.log(
        `\n第 ${resultIndex + 1} 名：${result.title}`
      );
      console.log(`分類：${result.category}`);
      console.log(
        `相似度：${result.score.toFixed(6)}`
      );
      console.log(`內容：${result.content}`);
    }

    console.log(
      `\n本次最相關結果：${results[0].title}`
    );
  }

  console.log("\n三組搜尋測試全部完成");
}

runSearchTests().catch(error => {
  console.error(
    "搜尋測試失敗：",
    error.message
  );

  process.exitCode = 1;
});