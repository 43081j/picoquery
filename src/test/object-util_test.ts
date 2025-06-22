import * as assert from 'node:assert/strict';
import {test} from 'node:test';
import {stringifyObject, getDeepObject} from '../object-util.js';

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
    assert.deepEqual(getDeepObject({foo: {bar: true}}, 'foo', 'baz'), {
      bar: true
    });
  });

  const disallowedNames = ['__proto__', 'constructor', 'prototype'];

  for (const name of disallowedNames) {
    await t.test(`setting disallowed ${name} returns object as-is`, () => {
      assert.deepEqual(getDeepObject({foo: 'bar'}, name, 'foo'), {foo: 'bar'});
    });
  }

  await t.test('can key into existing sub-object', () => {
    assert.deepEqual(getDeepObject({foo: {bar: 'baz'}}, 'foo', ''), {
      bar: 'baz'
    });
  });

  await t.test('replaces null with new object', () => {
    assert.deepEqual(getDeepObject({foo: null}, 'foo', 'bar'), {});
  });

  await t.test('treats decimals as object keys', () => {
    assert.deepEqual(getDeepObject({}, 'foo', '1.5'), {});
  });

  await t.test('mutates original object', () => {
    const obj = {};
    getDeepObject(obj, 'foo', 'bar');
    assert.deepEqual(obj, {foo: {}});
  });

  await t.test('creates new object if forceObject=true', () => {
    const obj = {};
    getDeepObject(obj, 'foo', '0', true);
    assert.deepEqual(obj, {
      foo: {}
    });
  });

  await t.test('creates new array if forceArray=true', () => {
    const obj = {};
    getDeepObject(obj, 'foo', 'bar', undefined, true);
    assert.deepEqual(obj, {
      foo: []
    });
  });

  await t.test('handles non-string/non-number keys', () => {
    const obj = {};
    const key = Symbol();
    getDeepObject(obj, 'foo', key);
    assert.deepEqual(obj, {
      foo: {}
    });
  });
});

test('stringifyObject', async (t) => {
  await t.test('shallow values', () => {
    const obj = {
      a: 'foo',
      b: 'bar'
    };
    assert.equal(stringifyObject(obj, {nestingSyntax: 'dot'}), 'a=foo&b=bar');
  });

  await t.test('deep values', () => {
    const obj = {
      a: {
        b: {
          c: 'foo'
        }
      }
    };
    assert.deepEqual(stringifyObject(obj, {nestingSyntax: 'dot'}), 'a.b.c=foo');
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
    assert.deepEqual(
      stringifyObject(obj, {nestingSyntax: 'dot'}),
      'a=foo&b.b1.b2=foo&c=foo&d.d1=foo'
    );
  });

  await t.test('deep values with multiple keys', () => {
    const obj = {
      a: {
        a1: 'foo',
        a2: 'bar'
      }
    };
    assert.deepEqual(
      stringifyObject(obj, {nestingSyntax: 'dot'}),
      'a.a1=foo&a.a2=bar'
    );
  });

  await t.test('simple array', () => {
    const obj = {
      a: ['foo', 'bar']
    };
    assert.deepEqual(
      stringifyObject(obj, {nestingSyntax: 'dot'}),
      'a.0=foo&a.1=bar'
    );
  });

  await t.test('array of objects', () => {
    const obj = {
      a: [
        {
          b: 'foo'
        }
      ]
    };
    assert.deepEqual(stringifyObject(obj, {nestingSyntax: 'dot'}), 'a.0.b=foo');
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
    assert.deepEqual(
      stringifyObject(obj, {nestingSyntax: 'index'}),
      'a%5Ba1%5D=foo&a%5Ba2%5D%5Ba3%5D=foo'
    );
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
    assert.ok(stringifyObject(obj, {nestingSyntax: 'dot'}));
  });

  await t.test('repeated array values (repeat)', () => {
    const obj = {
      foo: [1, 2]
    };
    assert.deepEqual(
      stringifyObject(obj, {arrayRepeat: true, arrayRepeatSyntax: 'repeat'}),
      'foo=1&foo=2'
    );
  });

  await t.test('repeated array values (bracket)', () => {
    const obj = {
      foo: [1, 2]
    };
    assert.deepEqual(
      stringifyObject(obj, {arrayRepeat: true, arrayRepeatSyntax: 'bracket'}),
      'foo%5B%5D=1&foo%5B%5D=2'
    );
  });

  await t.test('null values result in empty string', () => {
    assert.deepEqual(stringifyObject({foo: null}, {}), 'foo=');
  });

  await t.test('custom shouldSerializeObject function', () => {
    const foo = {
      toString() {
        return 'bar';
      }
    };
    const obj = {
      foo
    };
    const result = stringifyObject(obj, {
      shouldSerializeObject: (val) => {
        return val === foo;
      },
      valueSerializer: (val) => {
        return String(val);
      }
    });
    assert.equal(result, 'foo=bar');
  });
  await t.test('ignore undefined values', () => {
    const obj = {
      a: undefined,
      b: 'bar'
    };
    assert.equal(stringifyObject(obj, {nestingSyntax: 'dot'}), 'b=bar');
  });
});
