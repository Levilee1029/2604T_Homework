import {
  createEmbeddings,
  cosineSimilarity
} from "./embedding.js";

/*
 * 共準備三組測試資料。
 * 每組包含三句話。
 */
const testGroups = [
  {
    name: "第一組：意思相近的句子",
    expectation:
      "三句話都與貓有關，預期兩兩相似度較高。",
    sentences: [
      "我喜歡貓。",
      "貓咪很可愛。",
      "我在家裡養了一隻貓。"
    ]
  },
  {
    name: "第二組：意思不同的句子",
    expectation:
      "三句話分別描述天氣、買菜與電腦故障，預期兩兩相似度較低。",
    sentences: [
      "今天天氣很好。",
      "我要去市場買菜。",
      "我的電腦突然壞了。"
    ]
  },
  {
    name: "第三組：自行設計的購物情境",
    expectation:
      "前兩句都是通勤耳機的購物需求，第三句是旅遊需求，預期前兩句的相似度最高。",
    sentences: [
      "我想購買一副通勤使用的無線耳機。",
      "請推薦適合搭捷運使用的藍牙耳機。",
      "我計畫週末到花蓮欣賞山海風景。"
    ]
  }
];

/*
 * 三句話的兩兩比較組合。
 *
 * 句子 1 與句子 2
 * 句子 1 與句子 3
 * 句子 2 與句子 3
 */
const comparisonPairs = [
  [0, 1],
  [0, 2],
  [1, 2]
];

/**
 * 計算一組句子的兩兩相似度。
 *
 * @param {object} group 測試群組
 * @returns {Promise<object>} 測試結果
 */
async function evaluateGroup(group) {
  console.log(
    `\n========== ${group.name} ==========`
  );

  console.log(`預期：${group.expectation}`);

  group.sentences.forEach((sentence, index) => {
    console.log(
      `句子 ${index + 1}：${sentence}`
    );
  });

  console.log("\n正在建立三句話的向量...");

  /*
   * 一次將這組的三句話送到 Embeddings API。
   */
  const embeddings = await createEmbeddings(
    group.sentences
  );

  console.log(
    `向量建立完成，向量維度：${embeddings[0].length}`
  );

  const comparisons = [];

  console.log("\n兩兩相似度結果：");

  for (const [
    firstIndex,
    secondIndex
  ] of comparisonPairs) {
    const score = cosineSimilarity(
      embeddings[firstIndex],
      embeddings[secondIndex]
    );

    comparisons.push({
      firstIndex,
      secondIndex,
      firstSentence:
        group.sentences[firstIndex],
      secondSentence:
        group.sentences[secondIndex],
      score
    });

    console.log(
      `\n句子 ${firstIndex + 1}：` +
      group.sentences[firstIndex]
    );

    console.log(
      `句子 ${secondIndex + 1}：` +
      group.sentences[secondIndex]
    );

    console.log(
      `相似度：${score.toFixed(6)}`
    );
  }

  const totalScore = comparisons.reduce(
    (sum, comparison) => {
      return sum + comparison.score;
    },
    0
  );

  const averageScore =
    totalScore / comparisons.length;

  console.log(
    `\n本組平均相似度：${averageScore.toFixed(6)}`
  );

  return {
    name: group.name,
    expectation: group.expectation,
    sentences: group.sentences,
    comparisons,
    averageScore
  };
}

/**
 * 分析第一組與第二組的結果。
 *
 * @param {object} firstGroup 第一組結果
 * @param {object} secondGroup 第二組結果
 */
function analyzeFirstAndSecondGroups(
  firstGroup,
  secondGroup
) {
  console.log(
    "\n========== 第一組與第二組分析 =========="
  );

  console.log(
    `第一組平均相似度：${firstGroup.averageScore.toFixed(6)}`
  );

  console.log(
    `第二組平均相似度：${secondGroup.averageScore.toFixed(6)}`
  );

  if (
    firstGroup.averageScore >
    secondGroup.averageScore
  ) {
    console.log(
      "第一組平均相似度高於第二組。"
    );

    console.log(
      "第一組句子都是以貓為主題，第二組句子主題不同，因此結果符合預期。"
    );
  } else {
    console.log(
      "第一組平均相似度沒有高於第二組。"
    );

    console.log(
      "結果與原先預期不同，可能需要重新檢視句子的語意、長度或使用的 Embedding 模型。"
    );
  }
}

/**
 * 分析第三組自行設計的案例。
 *
 * @param {object} thirdGroup 第三組結果
 */
function analyzeThirdGroup(thirdGroup) {
  console.log(
    "\n========== 第三組分析 =========="
  );

  const firstAndSecond =
    thirdGroup.comparisons.find(
      comparison =>
        comparison.firstIndex === 0 &&
        comparison.secondIndex === 1
    );

  const firstAndThird =
    thirdGroup.comparisons.find(
      comparison =>
        comparison.firstIndex === 0 &&
        comparison.secondIndex === 2
    );

  const secondAndThird =
    thirdGroup.comparisons.find(
      comparison =>
        comparison.firstIndex === 1 &&
        comparison.secondIndex === 2
    );

  console.log(
    `耳機句子彼此的相似度：${firstAndSecond.score.toFixed(6)}`
  );

  console.log(
    `第一句與旅遊句子的相似度：${firstAndThird.score.toFixed(6)}`
  );

  console.log(
    `第二句與旅遊句子的相似度：${secondAndThird.score.toFixed(6)}`
  );

  if (
    firstAndSecond.score >
      firstAndThird.score &&
    firstAndSecond.score >
      secondAndThird.score
  ) {
    console.log(
      "前兩句都在描述通勤耳機需求，其相似度最高，第三組結果符合預期。"
    );
  } else {
    console.log(
      "前兩句的相似度不是第三組最高，結果與原先預期不同。"
    );
  }
}

/**
 * 執行全部向量相似度實驗。
 */
async function main() {
  console.log(
    "開始執行 Homework5 向量相似度實驗"
  );

  console.log(
    `測試組數：${testGroups.length}`
  );

  const results = [];

  for (const group of testGroups) {
    const result = await evaluateGroup(group);
    results.push(result);
  }

  console.log(
    "\n========== 實驗摘要 =========="
  );

  for (const result of results) {
    console.log(
      `${result.name}平均相似度：` +
      result.averageScore.toFixed(6)
    );
  }

  analyzeFirstAndSecondGroups(
    results[0],
    results[1]
  );

  analyzeThirdGroup(results[2]);

  console.log(
    "\nHomework5 向量相似度實驗完成"
  );
}

main().catch(error => {
  console.error(
    "向量相似度實驗失敗：",
    error.message
  );

  process.exitCode = 1;
});