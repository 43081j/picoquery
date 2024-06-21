import {Bench} from 'tinybench';
import {parse} from '../lib/main.js';
import {parse as fastParse} from 'fast-querystring';
import {parse as qsParse} from 'qs';

const suites = [
  {
    name: 'Basic (no nesting)',
    inputs: [
      'foo=bar',
      'foo=123&bar=456',
      'foo.bar=123&baz=456',
      'foo=123&bar=456&foo=123',
      'foo.bar.baz=woof'
    ],
    options: {
      qs: {allowDots: false},
      pico: {nested: false}
    }
  },
  {
    name: 'Dot-syntax nesting',
    inputs: [
      'foo=bar',
      'foo=123&bar=456',
      'foo.bar=123&baz=456',
      'foo.bar.baz=woof'
    ],
    options: {
      qs: {allowDots: true},
      pico: {nested: true}
    }
  },
  {
    name: 'Index-syntax nesting',
    inputs: [
      'foo=bar',
      'foo=bar&bar=baz',
      'foo[bar]=baz',
      'some[deeply][nested][key]=value',
      'foo[foo]=a&bar[bar]=b'
    ],
    options: {
      qs: {allowDots: false},
      pico: {nested: true, nestingSyntax: 'index'}
    }
  },
  {
    name: 'Custom delimiter',
    inputs: [
      'foo=a;bar=b',
      'foo=a',
      'foo=a;bar=b;baz=c'
    ],
    options: {
      qs: {delimiter: ';'},
      pico: {nested: false, delimiter: ';'}
    }
  },
  {
    name: 'Bracket-style arrays',
    inputs: [
      'foo[]=a&foo[]=b',
      'foo=a&bar[]=b&baz=c&bar[]=b',
      'foo=bar'
    ],
    options: {
      pico: {arrayRepeat: true, arrayRepeatSyntax: 'bracket'}
    }
  },
  {
    name: 'Repeat-style arrays',
    inputs: [
      'foo=a&foo=b',
      'foo=a&bar=b&baz=c&bar=b',
      'foo=bar'
    ],
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

setInterval(() => {}, 5000);
