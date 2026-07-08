// lib/search.js
/**
 * Filters lines by fixed string pattern, optionally ignoring case.
 *
 * @param {AsyncIterable<string>} linesIterator - Async iterable of input lines.
 * @param {string} pattern - Fixed string pattern to search for (no regex support yet).
 * @param {object} [options] - Options.
 * @param {boolean} [options.ignoreCase=false] - If true, search is case-insensitive.
 * @returns {AsyncIterable<string>} Async iterable of lines that match the pattern.
 */
export async function* searchLines(linesIterator, pattern, options = {}) {
  if (typeof pattern !== 'string' || pattern.length === 0) {
    throw new Error('Pattern must be a non-empty string.');
  }
  const ignoreCase = !!options.ignoreCase;
  // Precompute compare pattern
  const searchPattern = ignoreCase ? pattern.toLocaleLowerCase() : pattern;

  for await (const line of linesIterator) {
    if (typeof line !== 'string') continue;
    const haystack = ignoreCase ? line.toLocaleLowerCase() : line;
    if (searchPattern.length === 0) continue; // Defensive, though above we throw if empty pattern
    if (haystack.includes(searchPattern)) {
      yield line;
    }
  }
}

export default searchLines;
