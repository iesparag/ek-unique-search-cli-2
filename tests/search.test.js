// tests/search.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { searchLines } from '../lib/search.js';

// Helper to create async iterable from array
function asyncLines(arr) {
  return {
    async *[Symbol.asyncIterator]() {
      for (const line of arr) yield line;
    }
  };
}

test('searchLines: basic fixed string match finds matching lines', async () => {
  const lines = ['foobar', 'baz', 'foo', 'Foobar', 'nothing'];
  const pattern = 'foo';
  const result = [];
  for await (const line of searchLines(asyncLines(lines), pattern, { ignoreCase: false })) {
    result.push(line);
  }
  // Should match 'foobar' and 'foo' only (case-sensitive)
  assert.deepEqual(result, ['foobar', 'foo']);
});

test('searchLines: no matches yields empty', async () => {
  const lines = ['abc', 'def', 'ghi'];
  const pattern = 'zxy';
  const result = [];
  for await (const line of searchLines(asyncLines(lines), pattern)) {
    result.push(line);
  }
  assert.deepEqual(result, []);
});

test('searchLines: ignoreCase true matches regardless of case', async () => {
  const lines = ['This is Pattern', 'pattern found', 'No Match', 'pAtTeRn', 'xxPATTERNzz', 'PATTERN', 'not relevant'];
  const pattern = 'pattern';
  const result = [];
  for await (const line of searchLines(asyncLines(lines), pattern, { ignoreCase: true })) {
    result.push(line);
  }
  // Should match all lines containing 'pattern' in any case
  assert.deepEqual(result, [
    'This is Pattern',
    'pattern found',
    'pAtTeRn',
    'xxPATTERNzz',
    'PATTERN',
  ]);
});

test('searchLines: ignoreCase false is strict', async () => {
  const lines = ['PATTERN', 'pattern', 'Pattern', 'PaTtErN'];
  const pattern = 'pattern';
  const result = [];
  for await (const line of searchLines(asyncLines(lines), pattern, { ignoreCase: false })) {
    result.push(line);
  }
  // Only 'pattern' (all lower-case) matches
  assert.deepEqual(result, ['pattern']);
});

test('searchLines: throws on empty pattern', async () => {
  const lines = ['abc', 'def'];
  let threw = false;
  try {
    for await (const _ of searchLines(asyncLines(lines), '', { ignoreCase: false })) { }
  } catch (err) {
    threw = true;
    assert(err instanceof Error);
  }
  assert(threw);
});

test('searchLines: yields all lines containing the pattern as a substring only', async () => {
  const lines = ['foo', 'foofoo', 'xfooy', 'bar', '', 'fo'];
  const pattern = 'foo';
  const result = [];
  for await (const line of searchLines(asyncLines(lines), pattern)) {
    result.push(line);
  }
  assert.deepEqual(result, ['foo', 'foofoo', 'xfooy']);
});

test('searchLines: does not match empty lines (unless pattern is empty)', async () => {
  const lines = ['', ' ', 'foo', 'bar', '  '];
  const pattern = 'foo';
  const result = [];
  for await (const line of searchLines(asyncLines(lines), pattern)) {
    result.push(line);
  }
  assert.deepEqual(result, ['foo']);
});
