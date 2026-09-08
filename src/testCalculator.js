import { calculate } from "./tools/calculator.js";

const testExpressions = [
  "10 + 5 * 2",
  "(10 + 5) * 2",
  "100 / 4",
  "20 - 8 + 3",
  "1,200 * 0.8"
];

for (const expression of testExpressions) {
  try {
    const result = calculate(expression);
    console.log(`${expression} = ${result}`);
  } catch (error) {
    console.error(
      `${expression} 計算失敗：${error.message}`
    );
  }
}