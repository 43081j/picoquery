import {encodeString} from './string-util.js';
import {type Options, defaultOptions} from './shared.js';
import {getNestedValues, KeyValuePair} from './object-util.js';

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
  const {nested = defaultOptions.nested, delimiter = defaultOptions.delimiter} =
    optionsObj;
  const strDelimiter =
    typeof delimiter === 'number' ? String.fromCharCode(delimiter) : delimiter;
  let nestedValues;
  let keys;
  let keyLength;
  if (nested) {
    nestedValues = getNestedValues(input, optionsObj);
    keyLength = nestedValues.length;
  } else {
    keys = Object.keys(input);
    keyLength = keys.length;
  }
  let valueLength = 0;

  for (let i = 0; i < keyLength; i++) {
    let key;
    let value;
    if (nested) {
      key = (nestedValues as KeyValuePair[])[i][0];
      value = (nestedValues as KeyValuePair[])[i][1];
    } else {
      key = (keys as PropertyKey[])[i];
      value = (input as Record<PropertyKey, unknown>)[key];
    }
    const encodedKey = encodeString(String(key)) + '=';

    if (i) {
      result += strDelimiter;
    }

    if (Array.isArray(value)) {
      valueLength = value.length;
      for (let j = 0; j < valueLength; j++) {
        if (j) {
          result += strDelimiter;
        }

        // Optimization: Dividing into multiple lines improves the performance.
        // Since v8 does not need to care about the '+' character if it was one-liner.
        result += encodedKey;
        result += getAsPrimitive(value[j]);
      }
    } else {
      result += encodedKey;
      result += getAsPrimitive(value);
    }
  }

  return result;
}
