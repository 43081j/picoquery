import {Bench} from 'tinybench';
import {stringify} from '../lib/main.js';
import {stringify as fastStringify} from 'fast-querystring';
import {stringify as qsStringify} from 'qs';

const suites = [
  {
    name: 'Basic (no nesting)',
    inputs: [{foo: 'x', bar: 'y', baz: 'z'}],
    options: {
      qs: {allowDots: false},
      pico: {nesting: false}
    }
  },
  {
    name: 'Dot-syntax nesting',
    inputs: [
      {
        foo: {
          bar0: 'x',
          bar1: {
            baz0: 'y',
            baz1: 'z'
          }
        }
      }
    ],
    options: {
      qs: {allowDots: true},
      pico: {nesting: true}
    }
  },
  {
    name: 'Index-syntax nesting',
    inputs: [
      {
        foo: {
          bar0: 'x',
          bar1: {
            baz0: 'y',
            baz1: 'z'
          }
        }
      }
    ],
    options: {
      qs: {allowDots: false},
      pico: {nesting: true, nestingSyntax: 'index'}
    }
  },
  {
    name: 'Custom delimiter',
    inputs: [{foo: 'a', bar: 'b', baz: 'c'}],
    options: {
      qs: {delimiter: ';'},
      pico: {nesting: false, delimiter: ';'}
    }
  },
  {
    name: 'Bracket-style arrays',
    inputs: [{foo: ['a', 'b', 'c'], bar: 'y'}],
    options: {
      pico: {arrayRepeat: true, arrayRepeatSyntax: 'bracket'}
    }
  },
  {
    name: 'Repeat-style arrays',
    inputs: [{foo: ['a', 'b', 'c'], bar: 'y'}],
    options: {
      pico: {arrayRepeat: true, arrayRepeatSyntax: 'repeat'}
    }
  }
];

for (const suite of suites) {
  const bench = new Bench();

  bench
    .add('picoquery', () => {
      for (const input of suite.inputs) {
        stringify(input, suite.options?.pico);
      }
    })
    .add('qs', () => {
      for (const input of suite.inputs) {
        qsStringify(input, suite.options?.qs);
      }
    })
    .add('fast-querystring (no nesting)', () => {
      for (const input of suite.inputs) {
        fastStringify(input);
      }
    });

  console.log('Benchmark:', suite.name);

  await bench.warmup();
  await bench.run();

  console.table(bench.table());
}
