import {encodeString} from './string-util.js';
import {type Options, defaultOptions} from './shared.js';
import {getNestedValues} from './object-util.js';

type Primitive = number | string | boolean;

function getAsPrimitive(value: unknown): Primitive {
  switch (typeof value) {
    case 'string':
      // Length check is handled inside encodeString function
      return encodeString(value);
    case 'bigint':
    case 'boolean':
      return '' + value;
    case 'number':
      if (Number.isFinite(value)) {
        return value < 1e21 ? '' + value : encodeString('' + value);
      }
      break;
  }

  return '';
}

export type StringifyOptions = Partial<Options>;

/**
 * @param {unknown} input Object to stringify
 * @param {StringifyOptions=} options Stringify options
 * @returns {string}
 */
export function stringify(input: unknown, options?: StringifyOptions): string {
  let result = '';

  if (input === null || typeof input !== 'object') {
    return result;
  }

  const optionsObj = options ?? {};
  const {delimiter = defaultOptions.delimiter} = optionsObj;
  const strDelimiter =
    typeof delimiter === 'number' ? String.fromCharCode(delimiter) : delimiter;
  const nestedValues = getNestedValues(input, optionsObj);
  const keyLength = nestedValues.length;

  for (let i = 0; i < keyLength; i++) {
    const [key, value] = nestedValues[i];
    const encodedKey = encodeString(String(key)) + '=';

    if (i) {
      result += strDelimiter;
    }

    result += encodedKey;
    result += getAsPrimitive(value);
  }

  return result;
}
