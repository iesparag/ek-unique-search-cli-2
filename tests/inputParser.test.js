// tests/inputParser.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { PassThrough } from 'stream';
import { fileURLToPath } from 'url';
import parseInput from '../lib/inputParser.js';

// Utility to create a temporary file with lines
async function withTempFile(lines, cb) {
  const tmpPath = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    `__inputParserTest_${Date.now()}_${Math.random().toString(36).slice(2)}.txt`
  );
  // Always join with \n and if last item is '', ends with newline
  await fs.promises.writeFile(tmpPath, lines.join('\n'), 'utf8');
  try {
    await cb(tmpPath);
  } finally {
    await fs.promises.unlink(tmpPath);
  }
}

test('parseInput yields lines from file', async () => {
  const lines = ['foo', 'bar', 'baz'];
  await withTempFile(lines, async (filepath) => {
    const result = [];
    for await (const line of parseInput(filepath)) {
      result.push(line);
    }
    assert.deepEqual(result, lines);
  });
});

test('parseInput yields lines from file ending with newline', async () => {
  const lines = ['a', 'b', 'c'];
  await withTempFile([...lines, ''], async (filepath) => {
    // Now file ends in blank line (trailing newline)
    const result = [];
    for await (const line of parseInput(filepath)) {
      result.push(line);
    }
    assert.deepEqual(result, [...lines, '']);
  });
});

test('parseInput throws error for nonexistent file', async () => {
  const fakePath = 'nonexistent_file_x18x2z.txt';
  let threw = false;
  try {
    for await (const _ of parseInput(fakePath)) {
      // force iteration
    }
  } catch (err) {
    threw = true;
    assert(err instanceof Error);
    assert(
      err.message.startsWith('File not found or is not readable'),
      'Error message for missing file should be descriptive'
    );
  }
  assert(threw, 'parseInput should throw for missing file');
});

// Mocking stdin: Use PassThrough and patch process.stdin
function patchStdin(lines) {
  const stream = new PassThrough();
  for (const line of lines) {
    stream.write(line + '\n');
  }
  stream.end();
  const orig = process.stdin;
  Object.defineProperty(process, 'stdin', { value: stream, configurable: true, writable: true });
  return () => {
    Object.defineProperty(process, 'stdin', { value: orig, configurable: true, writable: true });
  };
}

test('parseInput yields lines from stdin', async () => {
  const lines = ['hello', 'world', 'stdin test'];
  const restoreStdin = patchStdin(lines);
  try {
    const result = [];
    for await (const line of parseInput()) {
      result.push(line);
    }
    assert.deepEqual(result, lines);
  } finally {
    restoreStdin();
  }
});

test('parseInput yields lines from stdin with trailing newline', async () => {
  const lines = ['stdin1', '', 'stdin2'];
  const restoreStdin = patchStdin(lines);
  try {
    const result = [];
    for await (const line of parseInput(undefined)) {
      result.push(line);
    }
    assert.deepEqual(result, lines);
  } finally {
    restoreStdin();
  }
});

test('parseInput throws error if no file and no piped input (TTY)', async (t) => {
  // Simulate process.stdin.isTTY being true -- make descriptor configurable for test
  const origTTY = Object.getOwnPropertyDescriptor(process.stdin, 'isTTY');
  // If not present, fall back to direct assign
  let hasOrig = !!origTTY;
  if (hasOrig) {
    Object.defineProperty(process.stdin, 'isTTY', { value: true, configurable: true });
  } else {
    process.stdin.isTTY = true;
  }
  let threw = false;
  try {
    for await (const _ of parseInput()) { }
  } catch (err) {
    threw = true;
    assert(err instanceof Error);
    assert(
      err.message.includes('No input provided'),
      'Should report error for no input option'
    );
  } finally {
    if (hasOrig) {
      Object.defineProperty(process.stdin, 'isTTY', origTTY);
    } else {
      delete process.stdin.isTTY;
    }
  }
  assert(threw, 'Should throw if no file and stdin is TTY');
});
