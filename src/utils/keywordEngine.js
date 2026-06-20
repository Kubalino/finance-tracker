/**
 * Matches a transaction description against the keyword DB.
 * Case-insensitive partial match; the longest matching keyword wins (most specific).
 */
export function matchKeyword(description, keywords) {
  const lower = description.toLowerCase();
  let best = null;

  for (const kw of keywords) {
    if (lower.includes(kw.keyword.toLowerCase())) {
      if (!best || kw.keyword.length > best.keyword.length) {
        best = kw;
      }
    }
  }

  return best ? { type: best.type, category: best.category } : null;
}
