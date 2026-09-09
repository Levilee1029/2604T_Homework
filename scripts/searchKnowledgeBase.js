import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { input } from "@inquirer/prompts";
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

    for (const document of documents) {
      if (!Array.isArray(document.embedding)) {
        throw new Error(
          `${document.title} 沒有有效的向量資料`
        );
      }
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
 * 搜尋與提問最接近的知識。
 *
 * @param {Array} documents 知識庫資料
 * @param {string} query 使用者輸入的問題
 * @param {number} limit 回傳結果數量
 * @returns {Promise<Array>} 搜尋結果
 */
async function searchKnowledgeBase(
  documents,
  query,
  limit = 3
) {
  if (
    typeof query !== "string" ||
    query.trim() === ""
  ) {
    throw new Error("搜尋問題不可為空");
  }

  const queryEmbedding = await createEmbedding(
    query.trim()
  );

  return documents
    .map(document => ({
      id: document.id,
      title: document.title,
      category: document.category,
      content: document.content,
      score: cosineSimilarity(
        queryEmbedding,
        document.embedding
      )
    }))
    .sort((first, second) => {
      return second.score - first.score;
    })
    .slice(0, limit);
}

/**
 * 顯示搜尋結果。
 *
 * @param {Array} results 搜尋結果
 */
function displayResults(results) {
  console.log("\n========== 搜尋結果 ==========");

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
    `\n最相關結果：${results[0].title}`
  );
  console.log("==============================\n");
}

/**
 * 啟動互動式搜尋。
 */
async function startInteractiveSearch() {
  const documents = await loadKnowledgeBase();

  console.log("臺灣城市迷你知識庫已啟動");
  console.log(`已載入 ${documents.length} 筆知識`);
  console.log("請使用自然語言輸入旅遊需求");
  console.log("輸入 exit 可以結束程式\n");

  while (true) {
    const userQuestion = (
      await input({
        message: "請輸入你的問題："
      })
    ).trim();

    if (userQuestion === "") {
      console.log("問題不可為空，請重新輸入。\n");
      continue;
    }

    if (userQuestion.toLowerCase() === "exit") {
      console.log("搜尋程式已結束。");
      break;
    }

    try {
      console.log("\n正在建立查詢向量並搜尋...");

      const results = await searchKnowledgeBase(
        documents,
        userQuestion,
        3
      );

      displayResults(results);
    } catch (error) {
      console.error(
        `搜尋失敗：${error.message}\n`
      );
    }
  }
}

startInteractiveSearch().catch(error => {
  if (error.name === "ExitPromptError") {
    console.log("\n搜尋程式已結束。");
  } else {
    console.error(
      "程式啟動失敗：",
      error.message
    );

    process.exitCode = 1;
  }
});