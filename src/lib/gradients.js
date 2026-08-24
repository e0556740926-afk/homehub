export const RECIPE_GRADIENTS = [
  "linear-gradient(135deg,#E2603C,#993C1D)",
  "linear-gradient(135deg,#5C7A63,#27500A)",
  "linear-gradient(135deg,#378ADD,#0C447C)",
  "linear-gradient(135deg,#D4537E,#72243E)",
];

export function gradientForName(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return RECIPE_GRADIENTS[Math.abs(hash) % RECIPE_GRADIENTS.length];
}
