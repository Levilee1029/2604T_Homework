import OpenAI from "openai";
import { OPENAI_API_KEY } from "../config.js";

const client = new OpenAI({
  apiKey: OPENAI_API_KEY
});

const EMBEDDING_MODEL = "text-embedding-3-small";

/**
 * 將文字轉換成向量。
 *
 * @param {string} text 要轉換成向量的文字
 * @returns {Promise<number[]>} Embedding 向量
 */
export async function createEmbedding(text) {
  if (
    typeof text !== "string" ||
    text.trim() === ""
  ) {
    throw new Error("建立 Embedding 的文字不可為空");
  }

  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text.trim(),
    encoding_format: "float"
  });

  const embedding = response.data?.[0]?.embedding;

  if (!Array.isArray(embedding)) {
    throw new Error("Embedding API 未回傳有效向量");
  }

  return embedding;
}

/**
 * 計算兩個向量的餘弦相似度。
 *
 * @param {number[]} vectorA 第一個向量
 * @param {number[]} vectorB 第二個向量
 * @returns {number} 餘弦相似度
 */
export function cosineSimilarity(
  vectorA,
  vectorB
) {
  if (
    !Array.isArray(vectorA) ||
    !Array.isArray(vectorB)
  ) {
    throw new Error("向量資料格式不正確");
  }

  if (vectorA.length !== vectorB.length) {
    throw new Error("兩個向量的維度不同");
  }

  if (vectorA.length === 0) {
    throw new Error("向量不可為空");
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (
    let index = 0;
    index < vectorA.length;
    index += 1
  ) {
    dotProduct += vectorA[index] * vectorB[index];
    magnitudeA += vectorA[index] ** 2;
    magnitudeB += vectorB[index] ** 2;
  }

  const denominator =
    Math.sqrt(magnitudeA) *
    Math.sqrt(magnitudeB);

  if (denominator === 0) {
    return 0;
  }

  return dotProduct / denominator;
}