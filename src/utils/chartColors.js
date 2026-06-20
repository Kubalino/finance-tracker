// Nord palette cycle for category slices — Frost + Aurora tones.
export const CATEGORY_COLORS = [
  '#88C0D0', '#5E81AC', '#A3BE8C', '#EBCB8B',
  '#BF616A', '#B48EAD', '#81A1C1', '#D08770',
  '#8FBCBB', '#4C566A',
];

export function colorForIndex(i) {
  return CATEGORY_COLORS[i % CATEGORY_COLORS.length];
}

export const TYPE_COLORS = {
  Income: '#A3BE8C',
  Expenses: '#BF616A',
  Savings: '#88C0D0',
};
