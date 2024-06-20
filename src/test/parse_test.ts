import * as assert from 'node:assert/strict';
import {test} from 'node:test';
import {
  parse,
  type UserParseOptions,
  numberKeyDeserializer,
  numberValueDeserializer
} from '../parse.js';

type TestCase = {
  input: string;
  output: unknown;
  options?: UserParseOptions;
};

const createSparseArray = <T>(arr: T[]): T[] => {
  const newArr = Array(arr.length);
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];
    if (item === undefined) {
      continue;
    }
    newArr[i] = item;
  }
  return newArr;
};

const testCases: TestCase[] = [
  // Defaults
  {
    input: 'foo=x&bar=y',
    output: {foo: 'x', bar: 'y'}
  },
  {
    input: 'foo=x&foo=y',
    output: {foo: 'y'}
  },
  {
    input: 'foo.bar=x',
    output: {foo: {bar: 'x'}}
  },
  {
    input: 'foo[bar]=x',
    output: {'foo[bar]': 'x'}
  },
  {
    input: 'foo[]=x',
    output: {'foo[]': 'x'}
  },
  {
    input: 'foo[0]=x',
    output: {'foo[0]': 'x'}
  },
  {
    input: 'foo=x;bar=y',
    output: {foo: 'x;bar=y'}
  },

  // Number deserializers
  {
    input: '303=foo',
    output: {'303': 'foo'}
  },
  {
    input: '303=foo',
    output: {303: 'foo'},
    options: {keyDeserializer: numberKeyDeserializer}
  },
  {
    input: 'foo=303',
    output: {foo: 303},
    options: {valueDeserializer: numberValueDeserializer}
  },
  {
    input: 'foo.0=1&foo.1=2',
    output: {foo: [1, 2]},
    options: {valueDeserializer: numberValueDeserializer}
  },
  {
    input: 'foo=bar',
    output: {foo: 'bar'},
    options: {keyDeserializer: numberKeyDeserializer}
  },
  {
    input: 'foo=bar',
    output: {foo: 'bar'},
    options: {valueDeserializer: numberValueDeserializer}
  },

  // Array syntax: bracket
  {
    input: 'foo[]=x&foo[]=y',
    output: {foo: ['x', 'y']},
    options: {arrayRepeat: true, arrayRepeatSyntax: 'bracket'}
  },
  // Array syntax: repeat
  {
    input: 'foo=x&foo=y',
    output: {foo: ['x', 'y']},
    options: {arrayRepeat: true, arrayRepeatSyntax: 'repeat'}
  },
  {
    input: 'foo.bar=x&foo.bar=y',
    output: {foo: {bar: ['x', 'y']}},
    options: {arrayRepeat: true, arrayRepeatSyntax: 'repeat'}
  },

  // Nesting syntax: index
  {
    input: 'foo[0]=x&foo[1]=y',
    output: {foo: ['x', 'y']},
    options: {nested: true, nestingSyntax: 'index'}
  },
  {
    input: 'foo[0]=x&foo[1]=y',
    output: {'foo[0]': 'x', 'foo[1]': 'y'},
    options: {nested: true, nestingSyntax: 'dot'}
  },
  {
    input: 'foo[bar]=x&foo[baz]=y',
    output: {foo: {bar: 'x', baz: 'y'}},
    options: {nested: true, nestingSyntax: 'index'}
  },
  {
    input: 'foo[bar]=x&foo[baz]=y',
    output: {'foo[bar]': 'x', 'foo[baz]': 'y'},
    options: {nested: true, nestingSyntax: 'dot'}
  },
  {
    input: 'foo[bar][baz]=dwa',
    output: {foo: {bar: {baz: 'dwa'}}},
    options: {nested: true, nestingSyntax: 'index'}
  },

  // Nesting syntax: dot
  {
    input: 'foo.0=x&foo.1=y',
    output: {foo: ['x', 'y']},
    options: {nested: true, nestingSyntax: 'dot'}
  },
  {
    input: 'foo.0=x&foo.1=y',
    output: {'foo.0': 'x', 'foo.1': 'y'},
    options: {nested: true, nestingSyntax: 'index'}
  },
  {
    input: 'foo.bar=x&foo.baz=y',
    output: {foo: {bar: 'x', baz: 'y'}},
    options: {nested: true, nestingSyntax: 'dot'}
  },
  {
    input: 'foo.bar=x&foo.baz=y',
    output: {'foo.bar': 'x', 'foo.baz': 'y'},
    options: {nested: true, nestingSyntax: 'index'}
  },

  // Sparse array with nestinh
  {
    input: 'foo[0]=x&foo[2]=y',
    output: {foo: createSparseArray(['x', undefined, 'y'])},
    options: {nested: true, nestingSyntax: 'index'}
  },

  // Delimiter: ;
  {
    input: 'foo=x;bar=y',
    output: {foo: 'x', bar: 'y'},
    options: {delimiter: ';'}
  },

  // Nested: false
  {
    input: 'foo[bar]=x',
    output: {'foo[bar]': 'x'},
    options: {nested: false}
  },

  // With a key deserializer
  {
    input: 'three=foo&four=bar',
    output: {trzy: 'foo', four: 'bar'},
    options: {
      keyDeserializer: (key) => {
        if (key === 'three') {
          return 'trzy';
        }
        return key;
      }
    }
  },

  // With a value deserializer
  {
    input: 'foo=three&bar=four',
    output: {foo: 3, bar: 'four'},
    options: {
      valueDeserializer: (value) => {
        if (value === 'three') {
          return 3;
        }
        return value;
      }
    }
  }
];

test('parse', async (t) => {
  for (const testCase of testCases) {
    const optsString = JSON.stringify(testCase.options);
    await t.test(
      `parses "${testCase.input}" with options: ${optsString}`,
      () => {
        const result = parse(testCase.input, testCase.options);
        assert.deepEqual({...result}, testCase.output);
      }
    );
  }
});
