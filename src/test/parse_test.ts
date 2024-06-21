import * as assert from 'node:assert/strict';
import {test} from 'node:test';
import {parse} from '../main.js';
import {testCases} from './test-cases.js';

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

  await t.test('returns empty object for non-string input', () => {
    const result = parse(808 as unknown as string);
    assert.deepEqual({...result}, {});
  });
});
