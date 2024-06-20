import * as assert from 'node:assert/strict';
import {test} from 'node:test';
import {splitByIndexPattern} from '../string-util.js';

test('splitByIndexPattern', async (t) => {
  await t.test('string without index', () => {
    assert.deepEqual(splitByIndexPattern('foo'), ['foo']);
  });

  await t.test('string with one index', () => {
    assert.deepEqual(splitByIndexPattern('foo[bar]'), ['foo', 'bar']);
  });

  await t.test('string with many indices', () => {
    assert.deepEqual(splitByIndexPattern('foo[a][b][c]'), [
      'foo',
      'a',
      'b',
      'c'
    ]);
  });

  await t.test('ignores nonsensical square brackets', () => {
    assert.deepEqual(splitByIndexPattern('foo[bar'), ['foo[bar']);
  });
});
