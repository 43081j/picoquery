import * as assert from 'node:assert/strict';
import { test } from 'node:test';
import { getNestedValues, getDeepObject } from '../object-util.js';

test('getDeepObject', async (t) => {
  await t.test('object if string key', () => {
    assert.deepEqual(getDeepObject({}, 'foo', 'bar'), {});
  });

  await t.test('array if key parseable as number', () => {
    assert.deepEqual(getDeepObject({}, 'foo', '1'), []);
  });

  await t.test('array if key is number', () => {
    assert.deepEqual(getDeepObject({}, 'foo', 5), []);
  });

  await t.test('existing object if value last key already exists', () => {
    assert.deepEqual(getDeepObject({ foo: { bar: true } }, 'foo', 'baz'), {
      bar: true
    });
  });

  const disallowedNames = ['__proto__', 'constructor', 'prototype'];

  for (const name of disallowedNames) {
    await t.test(`setting disallowed ${name} returns object as-is`, () => {
      assert.deepEqual(getDeepObject({ foo: 'bar' }, name, 'foo'), { foo: 'bar' });
    });
  }

  await t.test('can key into existing sub-object', () => {
    assert.deepEqual(getDeepObject({ foo: { bar: 'baz' } }, 'foo', ''), {
      bar: 'baz'
    });
  });

  await t.test('replaces null with new object', () => {
    assert.deepEqual(getDeepObject({ foo: null }, 'foo', 'bar'), {});
  });

  await t.test('treats decimals as object keys', () => {
    assert.deepEqual(getDeepObject({}, 'foo', '1.5'), {});
  });

  await t.test('mutates original object', () => {
    const obj = {};
    getDeepObject(obj, 'foo', 'bar');
    assert.deepEqual(obj, { foo: {} });
  })
});

test('getNestedValues', async (t) => {
  await t.test('shallow values', () => {
    const obj = {
      a: 'foo',
      b: 'bar'
    };
    assert.deepEqual(getNestedValues(obj, { nestingSyntax: 'dot' }), [
      ['a', 'foo'],
      ['b', 'bar']
    ]);
  });

  await t.test('deep values', () => {
    const obj = {
      a: {
        b: {
          c: 'foo'
        }
      }
    };
    assert.deepEqual(getNestedValues(obj, { nestingSyntax: 'dot' }), [
      ['a.b.c', 'foo']
    ]);
  });

  await t.test('mixed deep and shallow values', () => {
    const obj = {
      a: 'foo',
      b: {
        b1: {
          b2: 'foo'
        }
      },
      c: 'foo',
      d: {
        d1: 'foo'
      }
    };
    assert.deepEqual(getNestedValues(obj, { nestingSyntax: 'dot' }), [
      ['a', 'foo'],
      ['b.b1.b2', 'foo'],
      ['c', 'foo'],
      ['d.d1', 'foo']
    ]);
  });

  await t.test('deep values with multiple keys', () => {
    const obj = {
      a: {
        a1: 'foo',
        a2: 'bar'
      }
    };
    assert.deepEqual(getNestedValues(obj, { nestingSyntax: 'dot' }), [
      ['a.a1', 'foo'],
      ['a.a2', 'bar']
    ]);
  });

  await t.test('simple array', () => {
    const obj = {
      a: ['foo', 'bar']
    };
    assert.deepEqual(getNestedValues(obj, { nestingSyntax: 'dot' }), [
      ['a.0', 'foo'],
      ['a.1', 'bar']
    ]);
  });

  await t.test('array of objects', () => {
    const obj = {
      a: [
        {
          b: 'foo'
        }
      ]
    };
    assert.deepEqual(getNestedValues(obj, { nestingSyntax: 'dot' }), [
      ['a.0.b', 'foo']
    ]);
  });

  await t.test('simple index syntax', () => {
    const obj = {
      a: {
        a1: 'foo',
        a2: {
          a3: 'foo'
        }
      }
    };
    assert.deepEqual(getNestedValues(obj, { nestingSyntax: 'index' }), [
      ['a[a1]', 'foo'],
      ['a[a2][a3]', 'foo']
    ]);
  });

  await t.test('handles circular references', () => {
    const obj = {
      foo: {
        foo1: 'bar',
        foo2: undefined
      } as { foo1: string; foo2: unknown }
    };
    obj.foo.foo2 = obj;

    // as long as it doesn't hang forever, we're good
    assert.ok(getNestedValues(obj, { nestingSyntax: 'dot' }));
  });

  await t.test('repeated array values (repeat)', () => {
    const obj = {
      foo: [1, 2]
    };
    assert.deepEqual(
      getNestedValues(obj, { arrayRepeat: true, arrayRepeatSyntax: 'repeat' }),
      [
        ['foo', 1],
        ['foo', 2]
      ]
    );
  });

  await t.test('repeated array values (bracket)', () => {
    const obj = {
      foo: [1, 2]
    };
    assert.deepEqual(
      getNestedValues(obj, { arrayRepeat: true, arrayRepeatSyntax: 'bracket' }),
      [
        ['foo[]', 1],
        ['foo[]', 2]
      ]
    );
  });

  await t.test('null values result in empty set', () => {
    assert.deepEqual(getNestedValues(null as unknown as object, {}), []);
  });
});
