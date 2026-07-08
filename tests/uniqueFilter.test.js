// tests/uniqueFilter.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { uniqueFilter } from '../lib/uniqueFilter.js';

// Helper to make async iterable from an array
function asyncLines(arr) {
  return {
    async *[Symbol.asyncIterator]() {
      for (const item of arr) yield item;
    }
  };
}

test('uniqueFilter yields only first occurrences (consecutive duplicates)', async () => {
  const lines = ['a', 'a', 'b', 'b', 'b', 'c', 'c', 'a', 'd'];
  const expected = ['a', 'b', 'c', 'd'];
  const result = [];
  for await (const line of uniqueFilter(asyncLines(lines))) {
    result.push(line);
  }
  assert.deepEqual(result, expected);
});

test('uniqueFilter yields all unique lines in order (scattered dups)', async () => {
  const lines = ['foo', 'bar', 'baz', 'foo', 'qux', 'baz', 'bar', 'quux'];
  const expected = ['foo', 'bar', 'baz', 'qux', 'quux'];
  const result = [];
  for await (const line of uniqueFilter(asyncLines(lines))) {
    result.push(line);
  }
  assert.deepEqual(result, expected);
});

test('uniqueFilter passes through when all lines unique', async () => {
  const lines = ['one', 'two', 'three', 'four'];
  const expected = [...lines];
  const result = [];
  for await (const line of uniqueFilter(asyncLines(lines))) {
    result.push(line);
  }
  assert.deepEqual(result, expected);
});

test('uniqueFilter: empty input yields empty output', async () => {
  const lines = [];
  const result = [];
  for await (const line of uniqueFilter(asyncLines(lines))) {
    result.push(line);
  }
  assert.deepEqual(result, []);
});

test('uniqueFilter differentiates empty string and non-empty', async () => {
  const lines = ['', '', ' ', '', '  ', ' ', '', 'foo'];
  const expected = ['', ' ', '  ', 'foo'];
  const result = [];
  for await (const line of uniqueFilter(asyncLines(lines))) {
    result.push(line);
  }
  assert.deepEqual(result, expected);
});

test('uniqueFilter treats lines with different whitespace as unique (no trimming)', async () => {
  const lines = ['test', 'test ', ' test', 'test', 'test '];
  const expected = ['test', 'test ', ' test'];
  const result = [];
  for await (const line of uniqueFilter(asyncLines(lines))) {
    result.push(line);
  }
  assert.deepEqual(result, expected);
});

test('uniqueFilter works with large numbers of duplicates efficiently', async () => {
  const uniques = Array.from({ length: 500 }, (_, i) => `line${i}`);
  // Repeat all of them twice
  const lines = [...uniques, ...uniques];
  const result = [];
  for await (const line of uniqueFilter(asyncLines(lines))) {
    result.push(line);
  }
  assert.deepEqual(result, uniques);
});
