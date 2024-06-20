import {Bench} from 'tinybench';
import {parse} from '../lib/main.js';
import {parse as fastParse} from 'fast-querystring';

const inputs = [
  'foo=123&bar=456',
  'foo[bar]=123&baz=456',
  'foo=123&bar=456&foo=123',
  'foo[bar][baz]=woof'
];
const bench = new Bench();

bench
  .add('nanoquery (parse)', () => {
    for (const input of inputs) {
      parse(input);
    }
  })
  .add('fast-querystring (no nesting)', () => {
    for (const input of inputs) {
      fastParse(input);
    }
  });

await bench.warmup();
await bench.run();

console.table(bench.table());
