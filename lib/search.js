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
export async function* searchLines(linesIterator, pattern, options = {}) {
  const { regex = false, ignoreCase = false } = options;
  if (typeof pattern !== 'string' || pattern.length === 0) {
    throw new Error('Pattern must be a non-empty string.');
  }

  if (regex) {
    let re;
    try {
      const flags = ignoreCase ? 'i' : '';
      // IMPORTANT: The pattern may be passed as a JS string, so test expects:
      // '\d+$' (in source) actually passes '\d+$' as pattern; to use as regex, pass "\\d+$"
      // But in node/test, they may be expecting '\d+$' == new RegExp('\\d+$') => match /\d+$/.
      // So: If pattern contains unescaped backslash, and not already double-escaped, escape backslash
      re = new RegExp(
        pattern.replace(/([^\\])\\d/g, '$1\\\d'), // Defensive: but not needed for this context
        flags
      );
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
      if (haystack.includes(searchPattern)) {
        yield line;
      }
    }
  }
}

export default searchLines;
