# Homework3：建立迷你知識庫

## 作業主題

本作業以「臺灣城市介紹」為主題，建立臺北市、臺中市、
臺南市、高雄市及花蓮縣共 5 筆城市知識。

## 實作內容

1. 準備 5 筆臺灣城市介紹資料。
2. 使用 Embeddings API 將每筆城市內容轉換成向量。
3. 將文字、分類及向量儲存於本機 JSON 知識庫。
4. 將查詢文字轉換成向量。
5. 使用餘弦相似度比較查詢與各筆城市知識。
6. 依照相似度由高到低排列搜尋結果。

## 知識庫內容

1. 臺北市：城市觀光、大眾運輸、購物及文化景點
2. 臺中市：文化藝術、海線景觀及商圈
3. 臺南市：歷史古蹟、老街及傳統小吃
4. 高雄市：港灣景觀、藝術展覽及水岸休閒
5. 花蓮縣：山海自然景觀、戶外健行及慢旅行

## 程式檔案

- `scripts/embedding.js`：建立文字向量及計算餘弦相似度
- `scripts/initKnowledgeBase.js`：初始化 5 筆城市知識
- `scripts/checkKnowledgeBase.js`：檢查知識庫資料及向量維度
- `scripts/searchKnowledgeBase.js`：執行 3 組語意搜尋測試
- `data/cityKnowledge.json`：初始化後產生的向量資料
- `search-results.txt`：實際搜尋測試紀錄

## 安裝方式

```bash
npm install