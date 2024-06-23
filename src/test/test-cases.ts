import {
  type ParseOptions,
  numberKeyDeserializer,
  numberValueDeserializer
} from '../parse.js';

export type TestCase = {
  input: string;
  output: unknown;
  // Sometimes stringify output isn't exactly the same as input, since
  // ordering may change.
  stringifyOutput?: string;
  options?: ParseOptions;
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

export const testCases: TestCase[] = [
  // Defaults
  {
    input: 'foo=x&bar=y',
    output: {foo: 'x', bar: 'y'}
  },
  {
    input: 'foo=x&foo=y',
    stringifyOutput: 'foo=y',
    output: {foo: 'y'}
  },
  {
    input: 'foo.bar=x',
    output: {foo: {bar: 'x'}}
  },
  {
    input: 'foo[bar]=x',
    stringifyOutput: 'foo%5Bbar%5D=x',
    output: {'foo[bar]': 'x'}
  },
  {
    input: 'foo[]=x',
    stringifyOutput: 'foo%5B%5D=x',
    output: {'foo[]': 'x'}
  },
  {
    input: 'foo[0]=x',
    stringifyOutput: 'foo%5B0%5D=x',
    output: {'foo[0]': 'x'}
  },
  {
    input: 'foo=x;bar=y',
    stringifyOutput: 'foo=x%3Bbar%3Dy',
    output: {foo: 'x;bar=y'}
  },
  {
    input: 'foo&bar',
    stringifyOutput: 'foo=&bar=',
    output: {foo: '', bar: ''}
  },
  {
    input: '=x',
    stringifyOutput: '=x',
    output: {'': 'x'}
  },

  // Encoded keys and values
  {
    input: 'foo+bar=baz',
    stringifyOutput: 'foo%20bar=baz',
    output: {'foo bar': 'baz'}
  },
  {
    input: 'foo%20bar=baz',
    output: {'foo bar': 'baz'}
  },
  {
    input: 'foo=bar+baz',
    stringifyOutput: 'foo=bar%20baz',
    output: {foo: 'bar baz'}
  },
  {
    input: 'foo=bar%20baz',
    output: {foo: 'bar baz'}
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
    stringifyOutput: 'foo%5B%5D=x&foo%5B%5D=y',
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
    input: 'foo=x&foo=y&foo=z',
    output: {foo: ['x', 'y', 'z']},
    options: {arrayRepeat: true, arrayRepeatSyntax: 'repeat'}
  },
  {
    input: 'foo=x&foo=y&foo=z',
    output: {foo: ['x', 'y', 'z']},
    options: {nesting: false, arrayRepeat: true, arrayRepeatSyntax: 'repeat'}
  },
  {
    input: 'foo.bar=x&foo.bar=y',
    output: {foo: {bar: ['x', 'y']}},
    options: {arrayRepeat: true, arrayRepeatSyntax: 'repeat'}
  },

  // Nesting syntax: index
  {
    input: 'foo[0]=x&foo[1]=y',
    stringifyOutput: 'foo%5B0%5D=x&foo%5B1%5D=y',
    output: {foo: ['x', 'y']},
    options: {nesting: true, nestingSyntax: 'index'}
  },
  {
    input: 'foo[0]=x&foo[1]=y',
    stringifyOutput: 'foo%5B0%5D=x&foo%5B1%5D=y',
    output: {'foo[0]': 'x', 'foo[1]': 'y'},
    options: {nesting: true, nestingSyntax: 'dot'}
  },
  {
    input: 'foo[bar]=x&foo[baz]=y',
    stringifyOutput: 'foo%5Bbar%5D=x&foo%5Bbaz%5D=y',
    output: {foo: {bar: 'x', baz: 'y'}},
    options: {nesting: true, nestingSyntax: 'index'}
  },
  {
    input: 'foo[bar]=x&foo[baz]=y',
    stringifyOutput: 'foo%5Bbar%5D=x&foo%5Bbaz%5D=y',
    output: {'foo[bar]': 'x', 'foo[baz]': 'y'},
    options: {nesting: true, nestingSyntax: 'dot'}
  },
  {
    input: 'foo[bar][baz]=dwa',
    stringifyOutput: 'foo%5Bbar%5D%5Bbaz%5D=dwa',
    output: {foo: {bar: {baz: 'dwa'}}},
    options: {nesting: true, nestingSyntax: 'index'}
  },
  {
    input: 'foo[bar=trzy',
    stringifyOutput: 'foo%5Bbar%5D=trzy',
    output: {foo: {bar: 'trzy'}},
    options: {nesting: true, nestingSyntax: 'index'}
  },

  // Nesting syntax: dot
  {
    input: 'foo.0=x&foo.1=y',
    output: {foo: ['x', 'y']},
    options: {nesting: true, nestingSyntax: 'dot'}
  },
  {
    input: 'foo.0=x&foo.1=y',
    output: {'foo.0': 'x', 'foo.1': 'y'},
    options: {nesting: true, nestingSyntax: 'index'}
  },
  {
    input: 'foo.bar=x&foo.baz=y',
    output: {foo: {bar: 'x', baz: 'y'}},
    options: {nesting: true, nestingSyntax: 'dot'}
  },
  {
    input: 'foo.bar=x&foo.baz=y',
    output: {'foo.bar': 'x', 'foo.baz': 'y'},
    options: {nesting: true, nestingSyntax: 'index'}
  },

  // Sparse array with nestinh
  {
    input: 'foo[0]=x&foo[2]=y',
    stringifyOutput: 'foo%5B0%5D=x&foo%5B2%5D=y',
    output: {foo: createSparseArray(['x', undefined, 'y'])},
    options: {nesting: true, nestingSyntax: 'index'}
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
    stringifyOutput: 'foo%5Bbar%5D=x',
    output: {'foo[bar]': 'x'},
    options: {nesting: false}
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
