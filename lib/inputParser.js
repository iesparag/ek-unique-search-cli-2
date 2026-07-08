// lib/inputParser.js
// Provides parseInput(source) which yields lines as async iterable from file or stdin
import fs from 'fs';
import readline from 'readline';

/**
 * Returns an async iterable over lines from the given file, or from stdin if source is empty.
 * @param {string|undefined|null} source File path to read from, or undefined/null to read from stdin
 * @returns {AsyncIterable<string>} Yields one line at a time (without trailing newline)
 * @throws {Error} If file is missing/inaccessible or input is unavailable
 */
export function parseInput(source) {
  return {
    async *[Symbol.asyncIterator]() {
      let inputStream;
      let shouldCloseStream = false;
      let fileTrailedWithNewline = false;
      let fileWasEmpty = false;

      if (typeof source === 'string' && source.length > 0) {
        // Validate file can be read
        try {
          await fs.promises.access(source, fs.constants.R_OK);
        } catch (err) {
          throw new Error(`File not found or is not readable: ${source}`);
        }
        // Check for trailing newline (also handles empty file edge case)
        try {
          const text = await fs.promises.readFile(source, 'utf8');
          fileTrailedWithNewline = text.endsWith('\n');
          fileWasEmpty = text.length === 0;
        } catch (_) {
          /* ignore for now, error handled above */
        }
        inputStream = fs.createReadStream(source, { encoding: 'utf8' });
        shouldCloseStream = true;
      } else {
        // Check isTTY for stdin availability
        let isTTY = false;
        try {
          isTTY = Boolean(process.stdin && process.stdin.isTTY);
        } catch (_) {
          isTTY = false;
        }
        if (isTTY) {
          throw new Error('No input provided. Please provide a file path or pipe data to stdin.');
        }
        inputStream = process.stdin;
        // Do not close stdin after use
      }

      const rl = readline.createInterface({
        input: inputStream,
        crlfDelay: Infinity,
      });

      let sawLines = false;
      try {
        for await (const line of rl) {
          yield line;
          sawLines = true;
        }
        // For file input only: handle trailing newline as explicit empty line
        // (readline does NOT emit an empty last line for an ending newline)
        if (shouldCloseStream && fileTrailedWithNewline && (!fileWasEmpty)) {
          // Only yield final blank if the file is not empty and ends with a newline
          yield '';
        }
      } finally {
        rl.close();
        if (shouldCloseStream && inputStream) {
          inputStream.destroy();
        }
      }
    }
  };
}

export default parseInput;
