// lib/uniqueFilter.js
/**
 * Filters an async iterable of lines, yielding only unique lines (first occurrence),
 * preserving order. Subsequent duplicate lines are skipped.
 * Uses a Set for efficient tracking of seen lines.
 *
 * @param {AsyncIterable<string>} linesIterator - An async iterable of lines (strings)
 * @yields {string} Only the first occurrence of each unique line.
 */
export function uniqueFilter(linesIterator) {
  return {
    async *[Symbol.asyncIterator]() {
      const seen = new Set();
      for await (const line of linesIterator) {
        // Only yield if line hasn't been seen before (strict equality)
        if (!seen.has(line)) {
          seen.add(line);
          yield line;
        }
        // else skip
      }
    }
  };
}

export default uniqueFilter;
