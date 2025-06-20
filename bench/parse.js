import {Bench} from 'tinybench';
import {parse} from '../lib/main.js';
import {parse as fastParse} from 'fast-querystring';
import {parse as qsParse} from 'qs';

const suites = [
  {
    name: 'Basic (no nesting)',
    inputs: ['foo=a&bar=b&baz=c'],
    options: {
      qs: {allowDots: false},
      pico: {nesting: false}
    }
  },
  {
    name: 'Dot-syntax nesting',
    inputs: ['foo.bar.x=303&foo.bar.y=808'],
    options: {
      qs: {allowDots: true},
      pico: {nesting: true}
    }
  },
  {
    name: 'Index-syntax nesting',
    inputs: ['foo[bar][x]=303&foo[bar][y]=808'],
    options: {
      qs: {allowDots: false},
      pico: {nesting: true, nestingSyntax: 'index'}
    }
  },
  {
    name: 'JS nesting',
    inputs: ['foo.bar.x=303&foo[bar][y]=808'],
    options: {
      pico: {nesting: true, nestingSyntax: 'js'}
    }
  },
  {
    name: 'Custom delimiter',
    inputs: ['foo=a;bar=b;baz=c'],
    options: {
      qs: {delimiter: ';'},
      pico: {nesting: false, delimiter: ';'}
    }
  },
  {
    name: 'Bracket-style arrays',
    inputs: ['foo[]=a&foo[]=b&foo[]=c'],
    options: {
      pico: {arrayRepeat: true, arrayRepeatSyntax: 'bracket'}
    }
  },
  {
    name: 'Repeat-style arrays',
    inputs: ['foo=a&foo=b&foo=c'],
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
        parse(input, suite.options?.pico);
      }
    })
    .add('qs', () => {
      for (const input of suite.inputs) {
        qsParse(input, suite.options?.qs);
      }
    })
    .add('fast-querystring (no nesting)', () => {
      for (const input of suite.inputs) {
        fastParse(input);
      }
    });

  console.log('Benchmark:', suite.name);

  await bench.warmup();
  await bench.run();

  console.table(bench.table());
}
