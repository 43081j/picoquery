import {type Options} from './shared.js';
import {stringifyObject} from './object-util.js';

export type StringifyOptions = Partial<Options>;

/**
 * @param {unknown} input Object to stringify
 * @param {StringifyOptions=} options Stringify options
 * @returns {string}
 */
export function stringify(input: unknown, options?: StringifyOptions): string {
  if (input === null || typeof input !== 'object') {
    return '';
  }

  const optionsObj = options ?? {};
  return stringifyObject(input as Record<PropertyKey, unknown>, optionsObj);
}
