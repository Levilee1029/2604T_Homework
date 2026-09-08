export const calculatorTool = {
  type: "function",
  name: "calculate",
  description:
    "進行數學計算。當使用者要求加法、減法、乘法、除法、括號、價格、折扣或預算計算時使用此工具。",
  parameters: {
    type: "object",
    properties: {
      expression: {
        type: "string",
        description: "要計算的數學運算式，例如 10 + 5 * 2"
      }
    },
    required: ["expression"],
    additionalProperties: false
  },
  strict: true
};

export function calculate(expression) {
  if (
    typeof expression !== "string" ||
    expression.trim() === ""
  ) {
    throw new Error("expression 不可為空");
  }

  const normalizedExpression = expression
    .replaceAll("×", "*")
    .replaceAll("÷", "/")
    .replaceAll(",", "")
    .trim();

  const allowedPattern = /^[0-9+\-*/().\s]+$/;

  if (!allowedPattern.test(normalizedExpression)) {
    throw new Error(
      "運算式包含不支援的字元，目前僅支援數字、括號及四則運算"
    );
  }

  const result = Function(
    `"use strict"; return (${normalizedExpression});`
  )();

  if (
    typeof result !== "number" ||
    !Number.isFinite(result)
  ) {
    throw new Error("無法取得有效的計算結果");
  }

  return result;
}