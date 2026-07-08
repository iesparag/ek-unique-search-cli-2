// tests/cli.integration.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const BIN_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../bin/ek-unique-search.js');

function runCLI(args = [], opts = {}) {
  // opts.input: string|array, stdin content
  return new Promise((resolve, reject) => {
    const proc = spawn('node', [BIN_PATH, ...args], {
      stdio: ['pipe', 'pipe', 'pipe'],
      ...opts.spawnOptions,
    });
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', c => { stdout += c; });
    proc.stderr.on('data', c => { stderr += c; });
    proc.on('error', reject);
    proc.on('close', code => {
      resolve({ code, stdout, stderr });
    });
    if (opts.input) {
      const inp = Array.isArray(opts.input) ? opts.input.join('\n') + '\n' : opts.input;
      proc.stdin.write(inp);
      proc.stdin.end();
    } else if (opts.endStdin) {
      proc.stdin.end();
    }
  });
}

// Utility: create temp file, returns filepath
function makeTempFile(lines) {
  const tmpdir = os.tmpdir();
  const fpath = path.join(tmpdir, 'ekut_' + Date.now() + '_' + Math.random().toString(36).slice(2) + '.txt');
  fs.writeFileSync(fpath, lines.join('\n'), 'utf8');
  return fpath;
}

test('cli: prints unique matching lines from a file (basic fixed string)', async () => {
  const contents = [
    'abc', 'foobar', 'FooBar', 'foo', 'foo', 'bar', 'xyz foo', 'barfoo', 'abc', 'foo'
  ];
  const file = makeTempFile(contents);
  try {
    const { code, stdout, stderr } = await runCLI(['foo', file]);
    assert.equal(code, 0);
    const out = stdout.trim().split(/\r?\n/);
    // Unique lines that contain 'foo' (case-sensitive)
    assert.deepEqual(
      out,
      ['foobar', 'foo', 'xyz foo', 'barfoo']
    );
    assert.equal(stderr, '');
  } finally {
    fs.unlinkSync(file);
  }
});

test('cli: prints unique matching lines from stdin only', async () => {
  const input = [ 'A', 'B', 'C', 'AB', 'BC', 'AB', 'A' ];
  const { code, stdout, stderr } = await runCLI(['B'], { input });
  // Expect lines with 'B', unique, case-sensitive: 'B', 'AB', 'BC'
  assert.equal(code, 0);
  assert.deepEqual(
    stdout.trim().split(/\r?\n/),
    ['B', 'AB', 'BC']
  );
  assert.equal(stderr, '');
});

test('cli: prints unique lines, ignore case flag', async () => {
  const input = ['one', 'Two', 'tWo', 'TWO', 'won', 'Two'];
  const { code, stdout, stderr } = await runCLI(['two', '-i'], { input });
  // all variants containing 'two' in any case, unique:
  assert.equal(code, 0);
  assert.deepEqual(
    stdout.trim().split(/\r?\n/),
    ['Two', 'tWo', 'TWO']
  );
  assert.equal(stderr, '');
});

test('cli: regex search with -r flag', async () => {
  const input = ['abc123', 'def456', 'foo', 'bar456', 'abc456', 'xyz890', 'ABC456'];
  const { code, stdout, stderr } = await runCLI(['^abc', '-r'], { input });
  // Only abc123 and abc456 should match. Case-sensitive
  assert.equal(code, 0);
  assert.deepEqual(
    stdout.trim().split(/\r?\n/),
    ['abc123', 'abc456']
  );
  assert.equal(stderr, '');
});

test('cli: regex + ignore case', async () => {
  const input = ['Foo', 'fOO', 'football', 'bar', 'FOO', 'FooBar', 'BaRFoo'];
  const { code, stdout, stderr } = await runCLI(['foo', '-r', '-i'], { input });
  // All containing "foo" in any case
  assert.equal(code, 0);
  assert.deepEqual(
    stdout.trim().split(/\r?\n/),
    ['Foo', 'fOO', 'football', 'FOO', 'FooBar', 'BaRFoo']
  );
  assert.equal(stderr, '');
});

test('cli: exact string search is default (no -r)', async () => {
  const input = ['foo.*', 'barfoo', 'foofoo'];
  // Searching for 'foo.*' only matches line with literally 'foo.*', not others!
  const { code, stdout, stderr } = await runCLI(['foo.*'], { input });
  assert.equal(code, 0);
  assert.deepEqual(stdout.trim().split(/\r?\n/), ['foo.*']);
});

test('cli: unique filter works (duplicates)', async () => {
  const input = ['abc', 'abc', 'abc', 'def', 'abc', 'def', 'DEF'];
  const { code, stdout, stderr } = await runCLI(['abc']);
  // Only first unique occurrence
  assert.equal(code, 0);
  assert.deepEqual(stdout.trim().split(/\r?\n/), ['abc']);
});

test('cli: yields exit code 1 and no output if no match', async () => {
  const input = ['dog', 'cat', 'mouse'];
  const { code, stdout, stderr } = await runCLI(['lion'], { input });
  assert.equal(code, 1); // Grep convention: 1 for no match
  assert.equal(stdout.trim(), '');
  assert.equal(stderr, '');
});

test('cli: prints error & exit code 2 on invalid regexp', async () => {
  const input = ['a', 'b', 'c'];
  const { code, stdout, stderr } = await runCLI(['[abc', '-r'], { input });
  assert.equal(code, 2);
  assert.equal(stdout.trim(), '');
  assert.match(stderr, /Invalid regular expression pattern|Error:/);
});

test('cli: prints error and exit code 2 for missing file', async () => {
  const { code, stdout, stderr } = await runCLI(['pattern', '/__definitely_not_a_file_xw0__']);
  assert.equal(code, 2);
  assert.equal(stdout.trim(), '');
  assert.match(stderr, /File not found or is not readable/);
});

test('cli: shows usage/exit code 1 if pattern is missing', async () => {
  const { code, stdout, stderr } = await runCLI([], { input: ['foo'] });
  assert.equal(code, 1);
  assert.equal(stdout.trim(), '');
  assert.match(stderr, /Usage:|pattern/);
});

test('cli: shows usage/exit code 1 if pattern is empty string', async () => {
  const { code, stdout, stderr } = await runCLI([''], { input: ['foo'] });
  assert.equal(code, 1);
  assert.equal(stdout.trim(), '');
  assert.match(stderr, /pattern/);
});

test('cli: prints error/exit code 2 if no input provided (TTY)', async () => {
  // To simulate this, we use spawn with no stdin (and no file)
  // This will act as if nothing piped and stdin is TTY
  const proc = spawn('node', [BIN_PATH, 'foo'], {
    stdio: ['inherit', 'pipe', 'pipe'] // inherits parent's (TTY) stdin
  });
  let out = '';
  let err = '';
  proc.stdout.on('data', c => out += c);
  proc.stderr.on('data', c => err += c);
  await new Promise((resolve) => proc.on('close', resolve));
  // Can't guarantee exit code portability but should error about no input
  assert.match(err, /No input provided/i);
});
