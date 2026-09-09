import fs from "node:fs";

const knowledgeBasePath =
  "data/cityKnowledge.json";

if (!fs.existsSync(knowledgeBasePath)) {
  console.error(
    `找不到知識庫檔案：${knowledgeBasePath}`
  );

  process.exit(1);
}

const fileContent = fs.readFileSync(
  knowledgeBasePath,
  "utf8"
);

const data = JSON.parse(fileContent);

console.log("資料筆數：", data.length);

console.log(
  data.map(item => ({
    id: item.id,
    title: item.title,
    category: item.category,
    vectorSize: Array.isArray(item.embedding)
      ? item.embedding.length
      : 0
  }))
);