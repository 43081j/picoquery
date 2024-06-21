import {
  type Options,
  type DeserializeKeyFunction,
  type DeserializeValueFunction,
  defaultOptions
} from './shared.js';
import fastDecode from 'fast-decode-uri-component';
import {dset} from 'dset';
import {getDeepValue} from './object-util.js';
import {splitByIndexPattern} from './string-util.js';

export type ParsedQuery = Record<PropertyKey, unknown>;
export type ParseOptions = Partial<Options>;

export const numberKeyDeserializer: DeserializeKeyFunction = (key) => {
  const asNumber = Number(key);
  if (!Number.isNaN(asNumber)) {
    return asNumber;
  }
  return key;
};

export const numberValueDeserializer: DeserializeValueFunction = (value) => {
  const asNumber = Number(value);
  if (!Number.isNaN(asNumber)) {
    return asNumber;
  }
  return value;
};

const regexPlus = /\+/g;
const Empty = function () {} as unknown as {new (): ParsedQuery};
Empty.prototype = Object.create(null);

/**
 * Parses a query string into an object
 * @param {string} input
 * @param {ParseOptions=} options
 */
export function parse(input: string, options?: ParseOptions): ParsedQuery {
  const {
    valueDeserializer = defaultOptions.valueDeserializer,
    keyDeserializer = defaultOptions.keyDeserializer,
    arrayRepeatSyntax = defaultOptions.arrayRepeatSyntax,
    nested = defaultOptions.nested,
    arrayRepeat = defaultOptions.arrayRepeat,
    nestingSyntax = defaultOptions.nestingSyntax,
    delimiter = defaultOptions.delimiter
  } = options ?? {};
  const charDelimiter =
    typeof delimiter === 'string' ? delimiter.charCodeAt(0) : delimiter;

  // Optimization: Use new Empty() instead of Object.create(null) for performance
  // v8 has a better optimization for initializing functions compared to Object
  const result = new Empty();

  if (typeof input !== 'string') {
    return result;
  }

  const inputLength = input.length;
  let key = '';
  let value = '';
  let startingIndex = -1;
  let equalityIndex = -1;
  let shouldDecodeKey = false;
  let shouldDecodeValue = false;
  let keyHasPlus = false;
  let valueHasPlus = false;
  let keyHasDot = false;
  let hasBothKeyValuePair = false;
  let c = 0;
  let arrayRepeatBracketIndex = -1;

  // Have a boundary of input.length + 1 to access last pair inside the loop.
  for (let i = 0; i < inputLength + 1; i++) {
    c = i !== inputLength ? input.charCodeAt(i) : charDelimiter;

    // Handle '&' and end of line to pass the current values to result
    if (c === charDelimiter) {
      hasBothKeyValuePair = equalityIndex > startingIndex;

      // Optimization: Reuse equality index to store the end of key
      if (!hasBothKeyValuePair) {
        equalityIndex = i;
      }

      key = input.slice(
        startingIndex + 1,
        arrayRepeatBracketIndex > -1 ? arrayRepeatBracketIndex : equalityIndex
      );

      // Add key/value pair only if the range size is greater than 1; a.k.a. contains at least "="
      if (hasBothKeyValuePair || key.length > 0) {
        // Optimization: Replace '+' with space
        if (keyHasPlus) {
          key = key.replace(regexPlus, ' ');
        }

        // Optimization: Do not decode if it's not necessary.
        if (shouldDecodeKey) {
          key = fastDecode(key) || key;
        }

        if (hasBothKeyValuePair) {
          value = input.slice(equalityIndex + 1, i);

          if (valueHasPlus) {
            value = value.replace(regexPlus, ' ');
          }

          if (shouldDecodeValue) {
            value = fastDecode(value) || value;
          }
        }

        const newValue = valueDeserializer(value, key);
        const newKey = keyDeserializer(key);
        let dlvKey;

        if (typeof newKey === 'string' && nested) {
          if (nestingSyntax === 'index') {
            dlvKey = splitByIndexPattern(newKey);
          } else {
            dlvKey = keyHasDot ? newKey.split('.') : [newKey];
          }
        }

        const currentValue =
          nested && dlvKey ? getDeepValue(result, dlvKey) : result[newKey];

        if (currentValue === undefined || !arrayRepeat) {
          if (nested && dlvKey) {
            dset(result, dlvKey, newValue);
          } else {
            result[newKey] = newValue;
          }
        } else if (arrayRepeat) {
          // Optimization: value.pop is faster than Array.isArray(value)
          if ((currentValue as unknown[]).pop) {
            (currentValue as unknown[]).push(newValue);
          } else {
            if (nested && dlvKey) {
              dset(result, dlvKey, [currentValue, newValue]);
            } else {
              result[newKey] = [currentValue, newValue];
            }
          }
        }
      }

      // Reset reading key value pairs
      value = '';
      startingIndex = i;
      equalityIndex = i;
      shouldDecodeKey = false;
      shouldDecodeValue = false;
      keyHasPlus = false;
      keyHasDot = false;
      valueHasPlus = false;
      arrayRepeatBracketIndex = -1;
    } else if (c === 93) {
      if (arrayRepeat && arrayRepeatSyntax === 'bracket') {
        const prevIndex = i - 1;
        if (input.charCodeAt(prevIndex) === 91) {
          arrayRepeatBracketIndex = prevIndex;
        }
      }
    }
    // Check '.'
    else if (c === 46) {
      if (equalityIndex <= startingIndex) {
        keyHasDot = true;
      }
    }
    // Check '='
    else if (c === 61) {
      if (equalityIndex <= startingIndex) {
        equalityIndex = i;
      }
      // If '=' character occurs again, we should decode the input.
      else {
        shouldDecodeValue = true;
      }
    }
    // Check '+', and remember to replace it with empty space.
    else if (c === 43) {
      if (equalityIndex > startingIndex) {
        valueHasPlus = true;
      } else {
        keyHasPlus = true;
      }
    }
    // Check '%' character for encoding
    else if (c === 37) {
      if (equalityIndex > startingIndex) {
        shouldDecodeValue = true;
      } else {
        shouldDecodeKey = true;
      }
    }
  }

  return result;
}
