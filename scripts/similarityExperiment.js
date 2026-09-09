import { input } from "@inquirer/prompts";
import {
  createEmbeddings,
  cosineSimilarity
} from "./embedding.js";

const GROUP_COUNT = 3;
const SENTENCE_COUNT = 3;

const comparisonPairs = [
  [0, 1],
  [0, 2],
  [1, 2]
];

const groupInstructions = [
  {
    name: "第一組：意思相近的句子",
    instruction:
      "請輸入三句意思或主題相近的句子，例如三句都與貓有關。"
  },
  {
    name: "第二組：意思不同的句子",
    instruction:
      "請輸入三句意思或主題不同的句子，例如天氣、買菜與電腦故障。"
  },
  {
    name: "第三組：自行設計的測試案例",
    instruction:
      "請自行設計三句測試文字，再觀察它們的相似度是否符合預期。"
  }
];

/**
 * 要求使用者輸入不可為空的文字。
 *
 * @param {string} message 終端機提示文字
 * @returns {Promise<string>} 使用者輸入文字
 */
async function askNonEmptyInput(message) {
  while (true) {
    const answer = (
      await input({
        message
      })
    ).trim();

    if (answer !== "") {
      return answer;
    }

    console.log("輸入內容不可為空，請重新輸入。");
  }
}

/**
 * 讓使用者輸入一組共三句測試文字。
 *
 * @param {object} groupInformation 群組說明
 * @returns {Promise<object>} 群組資料
 */
async function collectGroupSentences(
  groupInformation
) {
  console.log(
    `\n========== ${groupInformation.name} ==========`
  );

  console.log(groupInformation.instruction);

  const sentences = [];

  for (
    let sentenceIndex = 0;
    sentenceIndex < SENTENCE_COUNT;
    sentenceIndex += 1
  ) {
    const sentence = await askNonEmptyInput(
      `請輸入第 ${sentenceIndex + 1} 句：`
    );

    sentences.push(sentence);
  }

  return {
    name: groupInformation.name,
    instruction: groupInformation.instruction,
    sentences
  };
}

/**
 * 計算一組三句話的兩兩相似度。
 *
 * @param {object} group 測試群組
 * @returns {Promise<object>} 群組測試結果
 */
async function evaluateGroup(group) {
  console.log(
    `\n正在計算「${group.name}」的向量...`
  );

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
    ...group,
    comparisons,
    averageScore
  };
}

/**
 * 顯示第一組與第二組的比較分析。
 *
 * @param {object} firstGroup 第一組結果
 * @param {object} secondGroup 第二組結果
 */
function compareFirstAndSecondGroups(
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
      "第一組平均相似度高於第二組，結果符合預期。"
    );

    console.log(
      "意思相近的句子在向量空間中的距離較接近，意思不同的句子相似度較低。"
    );
  } else if (
    firstGroup.averageScore <
    secondGroup.averageScore
  ) {
    console.log(
      "第一組平均相似度低於第二組，結果與原先預期不同。"
    );

    console.log(
      "可能需要檢查輸入句子的語意、主題及表達方式是否符合分組目的。"
    );
  } else {
    console.log(
      "第一組與第二組的平均相似度相同。"
    );

    console.log(
      "建議重新設計差異更明顯的測試句子。"
    );
  }
}

/**
 * 顯示所有測試結果摘要。
 *
 * @param {object[]} results 三組測試結果
 */
function displaySummary(results) {
  console.log(
    "\n========== 實驗摘要 =========="
  );

  for (const result of results) {
    console.log(
      `${result.name}平均相似度：` +
      result.averageScore.toFixed(6)
    );
  }

  compareFirstAndSecondGroups(
    results[0],
    results[1]
  );
}

/**
 * 執行互動式相似度實驗。
 */
async function main() {
  console.log(
    "Homework5 互動式向量相似度實驗"
  );

  console.log(
    `本次共有 ${GROUP_COUNT} 組，每組需要輸入 ${SENTENCE_COUNT} 句話。`
  );

  console.log(
    "程式會計算每組句子的三種兩兩相似度。\n"
  );

  const results = [];

  for (
    let groupIndex = 0;
    groupIndex < groupInstructions.length;
    groupIndex += 1
  ) {
    const group = await collectGroupSentences(
      groupInstructions[groupIndex]
    );

    const result = await evaluateGroup(group);

    results.push(result);
  }

  displaySummary(results);

  console.log(
    "\nHomework5 向量相似度實驗完成"
  );
}

main().catch(error => {
  if (error.name === "ExitPromptError") {
    console.log("\n使用者已結束程式。");
  } else {
    console.error(
      "向量相似度實驗失敗：",
      error.message
    );

    process.exitCode = 1;
  }
});