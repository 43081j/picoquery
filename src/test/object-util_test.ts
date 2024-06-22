import * as assert from 'node:assert/strict';
import {test} from 'node:test';
import {getDeepValue, getNestedValues, setDeepValue} from '../object-util.js';

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

const disallowedKeys = ['__proto__', 'constructor', 'prototype'];

test('setDeepValue', async (t) => {
  for (const key of disallowedKeys) {
    await t.test(`cannot set ${key}`, () => {
      const obj = {};
      setDeepValue(obj, [key], 123);
      assert.deepEqual(obj, {});
    });

    await t.test('cannot set proto deeply', () => {
      const obj = {foo: {}};
      setDeepValue(obj, ['foo', key], 123);
      assert.deepEqual(obj, {foo: {}});
    });
  }

  await t.test('sets top level key', () => {
    const obj: Record<PropertyKey, unknown> = {};
    setDeepValue(obj, ['foo'], 303);
    assert.deepEqual(obj, {foo: 303});
  });

  await t.test('sets deep key', () => {
    const obj: Record<PropertyKey, unknown> = {foo: {}};
    setDeepValue(obj, ['foo', 'bar'], 303);
    assert.deepEqual(obj, {foo: {bar: 303}});
  });

  await t.test('replaces null object value with object', () => {
    const obj: Record<PropertyKey, unknown> = {foo: null};
    setDeepValue(obj, ['foo', 'bar'], 303);
    assert.deepEqual(obj, {
      foo: {
        bar: 303
      }
    });
  });

  await t.test('replaces null array value with array', () => {
    const obj: Record<PropertyKey, unknown> = {foo: null};
    setDeepValue(obj, ['foo', 0], 303);
    assert.deepEqual(obj, {
      foo: [303]
    });
  });

  await t.test('creates new objects for object values', () => {
    const obj: Record<PropertyKey, unknown> = {};
    setDeepValue(obj, ['foo', 'bar'], 303);
    assert.deepEqual(obj, {
      foo: {
        bar: 303
      }
    });
  });

  await t.test('creates new arrays for array values', () => {
    const obj: Record<PropertyKey, unknown> = {};
    setDeepValue(obj, ['foo', 0], 303);
    assert.deepEqual(obj, {
      foo: [303]
    });
  });

  await t.test('creates new arrays with string indices', () => {
    const obj: Record<PropertyKey, unknown> = {};
    setDeepValue(obj, ['foo', '0'], 303);
    assert.deepEqual(obj, {
      foo: [303]
    });
  });

  await t.test('treats decimal strings as regular keys', () => {
    const obj: Record<PropertyKey, unknown> = {};
    setDeepValue(obj, ['foo', '10.0'], 303);
    assert.deepEqual(obj, {
      foo: {
        '10.0': 303
      }
    });
  });
});

test('getNestedValues', async (t) => {
  await t.test('shallow values', () => {
    const obj = {
      a: 'foo',
      b: 'bar'
    };
    assert.deepEqual(getNestedValues(obj, {nestingSyntax: 'dot'}), [
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
    assert.deepEqual(getNestedValues(obj, {nestingSyntax: 'dot'}), [
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
    assert.deepEqual(getNestedValues(obj, {nestingSyntax: 'dot'}), [
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
    assert.deepEqual(getNestedValues(obj, {nestingSyntax: 'dot'}), [
      ['a.a1', 'foo'],
      ['a.a2', 'bar']
    ]);
  });

  await t.test('simple array', () => {
    const obj = {
      a: ['foo', 'bar']
    };
    assert.deepEqual(getNestedValues(obj, {nestingSyntax: 'dot'}), [
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
    assert.deepEqual(getNestedValues(obj, {nestingSyntax: 'dot'}), [
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
    assert.deepEqual(getNestedValues(obj, {nestingSyntax: 'index'}), [
      ['a[a1]', 'foo'],
      ['a[a2][a3]', 'foo']
    ]);
  });

  await t.test('handles circular references', () => {
    const obj = {
      foo: {
        foo1: 'bar',
        foo2: undefined
      } as {foo1: string; foo2: unknown}
    };
    obj.foo.foo2 = obj;

    // as long as it doesn't hang forever, we're good
    assert.ok(getNestedValues(obj, {nestingSyntax: 'dot'}));
  });

  await t.test('repeated array values (repeat)', () => {
    const obj = {
      foo: [1, 2]
    };
    assert.deepEqual(
      getNestedValues(obj, {arrayRepeat: true, arrayRepeatSyntax: 'repeat'}),
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
      getNestedValues(obj, {arrayRepeat: true, arrayRepeatSyntax: 'bracket'}),
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
