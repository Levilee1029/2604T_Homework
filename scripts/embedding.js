import { client } from "../lib/openai.js";

const EMBEDDING_MODEL = "text-embedding-3-small";

/**
 * 檢查輸入文字是否有效。
 *
 * @param {string} text 要檢查的文字
 * @returns {string} 去除前後空白後的文字
 */
function validateText(text) {
  if (typeof text !== "string") {
    throw new TypeError("輸入內容必須是字串");
  }

  const normalizedText = text.trim();

  if (normalizedText === "") {
    throw new Error("建立 Embedding 的文字不可為空");
  }

  return normalizedText;
}

/**
 * 將單一文字轉換成 Embedding 向量。
 *
 * @param {string} text 要轉換成向量的文字
 * @returns {Promise<number[]>} Embedding 向量
 */
export async function createEmbedding(text) {
  const normalizedText = validateText(text);

  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: normalizedText
  });

  const embedding = response.data?.[0]?.embedding;

  if (!Array.isArray(embedding)) {
    throw new Error("Embedding API 未回傳有效向量");
  }

  if (embedding.length === 0) {
    throw new Error("Embedding API 回傳空向量");
  }

  return embedding;
}

/**
 * 一次將多筆文字轉換成 Embedding 向量。
 *
 * @param {string[]} texts 要轉換成向量的文字陣列
 * @returns {Promise<number[][]>} Embedding 向量陣列
 */
export async function createEmbeddings(texts) {
  if (!Array.isArray(texts)) {
    throw new TypeError("輸入內容必須是字串陣列");
  }

  if (texts.length === 0) {
    throw new Error("文字陣列不可為空");
  }

  const normalizedTexts = texts.map(validateText);

  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: normalizedTexts
  });

  const sortedData = [...response.data].sort(
    (first, second) => first.index - second.index
  );

  const embeddings = sortedData.map(
    item => item.embedding
  );

  if (embeddings.length !== normalizedTexts.length) {
    throw new Error(
      "Embedding API 回傳的向量數量與輸入文字數量不同"
    );
  }

  if (
    embeddings.some(
      embedding =>
        !Array.isArray(embedding) ||
        embedding.length === 0
    )
  ) {
    throw new Error(
      "Embedding API 回傳無效或空白的向量"
    );
  }

  const vectorDimension = embeddings[0].length;

  if (
    embeddings.some(
      embedding =>
        embedding.length !== vectorDimension
    )
  ) {
    throw new Error(
      "Embedding API 回傳的向量維度不一致"
    );
  }

  return embeddings;
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
    throw new TypeError(
      "餘弦相似度的輸入必須是兩個向量陣列"
    );
  }

  if (
    vectorA.length === 0 ||
    vectorB.length === 0
  ) {
    throw new Error("向量不可為空");
  }

  if (vectorA.length !== vectorB.length) {
    throw new Error(
      `兩個向量的維度不同：${vectorA.length} 與 ${vectorB.length}`
    );
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (
    let index = 0;
    index < vectorA.length;
    index += 1
  ) {
    const valueA = vectorA[index];
    const valueB = vectorB[index];

    if (
      typeof valueA !== "number" ||
      typeof valueB !== "number" ||
      !Number.isFinite(valueA) ||
      !Number.isFinite(valueB)
    ) {
      throw new Error(
        `向量索引 ${index} 包含非數字或無效數值`
      );
    }

    dotProduct += valueA * valueB;
    magnitudeA += valueA ** 2;
    magnitudeB += valueB ** 2;
  }

  const denominator =
    Math.sqrt(magnitudeA) *
    Math.sqrt(magnitudeB);

  if (denominator === 0) {
    throw new Error(
      "向量長度為零，無法計算餘弦相似度"
    );
  }

  return dotProduct / denominator;
}