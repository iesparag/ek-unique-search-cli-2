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

// --- REGEX SEARCH TESTS ---

test('searchLines: regex flag, basic matching', async () => {
  const lines = ['abc', 'def', 'abc123', '123abc', 'xyz', 'defghi'];
  const pattern = '^abc';
  const options = { regex: true };
  const result = [];
  for await (const line of searchLines(asyncLines(lines), pattern, options)) {
    result.push(line);
  }
  // Should match 'abc' and 'abc123' only
  assert.deepEqual(result, ['abc', 'abc123']);
});

test('searchLines: regex, ignoreCase', async () => {
  const lines = ['bar', 'Foo', 'fOO', 'foO', 'food', 'football', 'FOOBAR', 'baz'];
  const pattern = 'foo'; // Should match any case version
  const result = [];
  for await (const line of searchLines(asyncLines(lines), pattern, { regex: true, ignoreCase: true })) {
    result.push(line);
  }
  // Expect to match 'Foo', 'fOO', 'foO', 'food', 'football', 'FOOBAR'
  assert.deepEqual(result, ['Foo', 'fOO', 'foO', 'food', 'football', 'FOOBAR']);
});

test('searchLines: regex, ignoreCase false', async () => {
  const lines = ['Foo', 'foo', 'FOO', 'FOObar', 'food', 'Football', 'fOo'];
  const pattern = 'FOO';
  const result = [];
  for await (const line of searchLines(asyncLines(lines), pattern, { regex: true, ignoreCase: false })) {
    result.push(line);
  }
  // Only 'FOO' and 'FOObar' should match (exact case)
  assert.deepEqual(result, ['FOO', 'FOObar']);
});

test('searchLines: regex pattern (match digits at end)', async () => {
  const lines = ['a1', 'b22', 'cc333', 'ddd', '4444ee', 'test123', 'nope'];
  const pattern = '\d+$';
  const result = [];
  for await (const line of searchLines(asyncLines(lines), pattern, { regex: true })) {
    result.push(line);
  }
  // Should match: 'a1', 'b22', 'cc333', 'test123'
  assert.deepEqual(result, ['a1', 'b22', 'cc333', 'test123']);
});

test('searchLines: throws with invalid regex pattern', async () => {
  const lines = ['a', 'b', 'c'];
  let threw = false;
  try {
    // Invalid regex (unclosed bracket)
    for await (const _ of searchLines(asyncLines(lines), '[abc', { regex: true })) { }
  } catch (err) {
    threw = true;
    assert(err instanceof Error);
    assert(
      err.message.includes('Invalid regular expression pattern'),
      'Error message should include invalid regex'
    );
  }
  assert(threw, 'Should throw on invalid regex');
});

test('searchLines: regex works on empty line and pattern', async () => {
  const lines = ['', 'foo', ' '];
  const pattern = '^$'; // Match empty line
  const result = [];
  for await (const line of searchLines(asyncLines(lines), pattern, { regex: true })) {
    result.push(line);
  }
  assert.deepEqual(result, ['']);
});

test('searchLines: regex, pattern that never matches yields empty', async () => {
  const lines = ['abc', 'def', '123'];
  const pattern = '^XYZ$';
  const result = [];
  for await (const line of searchLines(asyncLines(lines), pattern, { regex: true })) {
    result.push(line);
  }
  assert.deepEqual(result, []);
});
