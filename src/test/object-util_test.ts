import * as assert from 'node:assert/strict';
import {test} from 'node:test';
import {getDeepValue} from '../object-util.js';

test('getDeepValue', async (t) => {
  await t.test('retrieves by single key', () => {
    const obj = {foo: 123};
    assert.equal(getDeepValue(obj, ['foo']), 123);
  });

  await t.test('retrieves by deep key', () => {
    const obj = {
      a: {
        b: {
          c: {
            d: 303
          }
        }
      }
    };
    assert.equal(getDeepValue(obj, ['a', 'b', 'c', 'd']), 303);
  });

  await t.test('undefined if part of key not found', () => {
    const obj = {
      a: {
        b: {}
      }
    };
    assert.equal(getDeepValue(obj, ['a', 'b', 'c', 'd']), undefined);
  });

  await t.test('works with non-string keys', () => {
    const key = Symbol();
    const obj = {
      [key]: 808
    };
    assert.equal(getDeepValue(obj, [key]), 808);
  });

  await t.test('returns root object if no keys', () => {
    const obj = {};
    assert.equal(getDeepValue(obj, []), obj);
  });

  await t.test('indexes into non-object values', () => {
    const obj = {
      prop: 'foo'
    };
    assert.equal(getDeepValue(obj, ['prop', 'length']), 3);
  });
});
