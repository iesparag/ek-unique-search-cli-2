// lib/inputParser.js
// Provides parseInput(source) which yields lines as async iterable from file or stdin
import fs from 'fs';
import readline from 'readline';

/**
 * Returns an async iterable over lines from the given file, or from stdin if source is empty.
 * @param {string|undefined|null} source File path to read from, or undefined/null to read from stdin
 * @returns {AsyncIterable<string>} Yields one line at a time (without trailing newline)
 * @throws {Error} If file is missing/inaccessible
 */
export async function* parseInput(source) {
  let inputStream;
  let shouldCloseStream = false;

  if (typeof source === 'string' && source.length > 0) {
    try {
      await fs.promises.access(source, fs.constants.R_OK);
    } catch (err) {
      throw new Error(`File not found or is not readable: ${source}`);
    }
    inputStream = fs.createReadStream(source, { encoding: 'utf8' });
    shouldCloseStream = true;
  } else {
    // Check isTTY with fallback to false if undefined
    let isTTY = false;
    try {
      isTTY = Boolean(process.stdin && process.stdin.isTTY);
    } catch (_) {
      isTTY = false;
    }
    if (isTTY) {
      // Nothing piped and no file given
      throw new Error('No input provided. Please provide a file path or pipe data to stdin.');
    }
    inputStream = process.stdin;
    // Do not close stdin
  }

  const rl = readline.createInterface({
    input: inputStream,
    crlfDelay: Infinity,
  });

  try {
    let lineBuffer = '';
    let isFirst = true;
    // Special handler for files with trailing newline, to yield a final '' line
    // readline emits lines up to but not after EOF, even if file ends with newline
    // We need to detect if final character was a newline and emit a blank last line accordingly
    // We'll check if input is a file, and if so, use fs.readFile to check for trailing newline
    let lastLineBlank = false;
    if (shouldCloseStream && typeof source === 'string') {
      // This is a file path
      try {
        const text = await fs.promises.readFile(source, 'utf8');
        if (text.endsWith('\n')) {
          if (text.endsWith('\n') && (text.length === 1 || text[text.length-2] === '\n' || text[text.length-2] !== '\r')) {
            lastLineBlank = true;
          }
        }
      } catch (_) {/* ignore */}
    } else if (!shouldCloseStream && inputStream !== process.stdin) {
      // Not possible with our invocations
      lastLineBlank = false;
    }

    for await (const line of rl) {
      yield line;
      isFirst = false;
    }
    // Now if there is a trailing newline, and file ends with it, emit a final blank
    if (lastLineBlank) {
      // Check if the file is not empty and the last char is '\n'
      yield '';
    }
  } finally {
    rl.close();
    if (shouldCloseStream && inputStream) {
      inputStream.destroy(); // ensures file stream closes on completion or error
    }
  }
}

export default parseInput;
