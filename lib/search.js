// lib/search.js
/**
 * Filters lines by pattern, supporting fixed string or regular expression.
 *
 * @param {AsyncIterable<string>} linesIterator - Async iterable of input lines.
 * @param {string} pattern - Fixed string pattern or regex pattern.
 * @param {object} [options] - Options.
 * @param {boolean} [options.regex=false] - If true, treat pattern as a regexp.
 * @param {boolean} [options.ignoreCase=false] - If true, ignore case distinctions.
 * @returns {AsyncIterable<string>} Async iterable of lines matching the pattern.
 * @throws {Error} If invalid regex pattern or pattern is empty.
 */
export function searchLines(linesIterator, pattern, options = {}) {
  const { regex = false, ignoreCase = false } = options;
  if (typeof pattern !== 'string' || pattern.length === 0) {
    throw new Error('Pattern must be a non-empty string.');
  }

  return {
    async *[Symbol.asyncIterator]() {
      if (regex) {
        let re;
        try {
          // Always use 'u' flag for correctness with unicode (and for \d, etc in latest node)
          const flags = (ignoreCase ? 'i' : '') + 'u';
          re = new RegExp(pattern, flags);
        } catch (err) {
          throw new Error(`Invalid regular expression pattern: ${pattern}\n${err.message}`);
        }
        for await (const line of linesIterator) {
          if (typeof line !== 'string') continue;
          if (re.test(line)) {
            yield line;
          }
        }
      } else {
        // Fixed string search
        const searchPattern = ignoreCase ? pattern.toLocaleLowerCase() : pattern;
        for await (const line of linesIterator) {
          if (typeof line !== 'string') continue;
          const haystack = ignoreCase ? line.toLocaleLowerCase() : line;
          if (haystack.indexOf(searchPattern) !== -1) {
            yield line;
          }
        }
      }
    }
  };
}

export default searchLines;
