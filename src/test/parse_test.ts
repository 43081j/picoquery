import * as assert from 'node:assert/strict';
import {test} from 'node:test';
import {parse, type UserParseOptions} from '../parse.js';

type TestCase = {
  input: string;
  output: unknown;
  options?: UserParseOptions;
};

const testCases: TestCase[] = [
  // Defaults
  {
    input: 'foo=1&bar=2',
    output: {foo: 1, bar: 2}
  },
  {
    input: 'foo=1&foo=2',
    output: {foo: [1, 2]}
  },
  {
    input: 'foo[bar]=123',
    output: {foo: {bar: 123}}
  },
  {
    input: 'foo[]=1',
    output: {'foo[]': 1}
  },
  {
    input: 'foo[0]=1',
    output: {'foo[0]': 1}
  },
  {
    input: 'foo=1;bar=2',
    output: {foo: '1;bar=2'}
  },
  {
    input: '303=foo',
    output: {303: 'foo'}
  },

  // Array syntax: bracket
  {
    input: 'foo[]=1&foo[]=2',
    output: {foo: [1, 2]},
    options: {arraySyntax: 'bracket'}
  },
  // Array syntax: repeat (DEFAULT)
  {
    input: 'foo=1&foo=2',
    output: {foo: [1, 2]},
    options: {arraySyntax: 'repeat'}
  },
  // Array syntax: index
  {
    input: 'foo[0]=1&foo[1]=2',
    output: {foo: [1, 2]},
    options: {arraySyntax: 'index'}
  },
  {
    input: 'foo[0]=1&foo[2]=2',
    output: {foo: [1, 2]},
    options: {arraySyntax: 'index'}
  },
  // Array syntax: index-sparse
  {
    input: 'foo[0]=1&foo[2]=2',
    output: {foo: [1, undefined, 2]},
    options: {arraySyntax: 'index-sparse'}
  },

  // Delimiter: ;
  {
    input: 'foo=1;bar=2',
    output: {foo: 1, bar: 2},
    options: {delimiter: ';'}
  },

  // Nested: false
  {
    input: 'foo[bar]=123',
    output: {'foo[bar]': 123},
    options: {nested: false}
  },

  // With a key deserializer
  {
    input: 'three=foo&four=bar',
    output: {3: 'foo', four: 'bar'},
    options: {
      keyDeserializer: (key) => {
        if (key === 'three') {
          return 3;
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
      valueDeserializer: (_key, value) => {
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
