import {Bench} from 'tinybench';
import {parse} from '../lib/main.js';

const inputs = [
  'foo=123&bar=456',
  'foo[bar]=123&baz=456',
  'foo=123&bar=456&foo=123',
  'foo[bar][baz]=woof'
];
const bench = new Bench();

bench.add('nanoquery (parse)', () => {
  for (const input of inputs) {
    parse(input);
  }
});

await bench.warmup();
await bench.run();

console.table(bench.table());
