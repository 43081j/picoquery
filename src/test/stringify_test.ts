import * as assert from 'node:assert/strict';
import {test} from 'node:test';
import {stringify} from '../main.js';
import {testCases} from './test-cases.js';

test('stringify', async (t) => {
  for (const testCase of testCases) {
    // Skip cases with custom deserializers since the output and input won't
    // match via stringify
    if (
      testCase.options?.keyDeserializer ||
      testCase.options?.valueDeserializer
    ) {
      continue;
    }

    const optsString = JSON.stringify(testCase.options);
    const outputString = JSON.stringify(testCase.output, null, 2);
    await t.test(
      `stringifies ${outputString} with options: ${optsString}`,
      () => {
        const result = stringify(testCase.output, testCase.options);
        assert.equal(result, testCase.stringifyOutput ?? testCase.input);
      }
    );
  }

  await t.test('boolean values', () => {
    const result = stringify({foo: true});
    assert.equal(result, 'foo=true');
  });

  await t.test('number values', () => {
    const result = stringify({foo: 400});
    assert.equal(result, 'foo=400');
  });

  await t.test('bigint values', () => {
    const result = stringify({foo: BigInt(400)});
    assert.equal(result, 'foo=400');
  });

  await t.test('skips infinite numbers', () => {
    const result = stringify({foo: Infinity});
    assert.equal(result, 'foo=');
  });

  await t.test('non-objects result in empty string', () => {
    assert.equal(stringify(null), '');
  });

  await t.test('custom value serializer', () => {
    const result = stringify(
      {foo: 'bar'},
      {
        valueSerializer: () => 'baz'
      }
    );

    assert.equal(result, 'foo=baz');
  });
});
