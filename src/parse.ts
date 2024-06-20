import {
  type ParseOptions,
  type DeserializeKeyFunction,
  type DeserializeValueFunction
} from './shared.js';
import fastDecode from 'fast-decode-uri-component';
import {dset} from 'dset';
import dlv from 'dlv';

export type ParsedQuery = Record<PropertyKey, unknown>;
export type UserParseOptions = Partial<ParseOptions>;
type DlvKey = string | (string | number)[];

export const numberKeyDeserializer: DeserializeKeyFunction = (key) => {
  const asNumber = Number(key);
  if (!Number.isNaN(asNumber)) {
    return asNumber;
  }
  return key;
};

export const numberValueDeserializer: DeserializeValueFunction = (
  _key,
  value
) => {
  const asNumber = Number(value);
  if (!Number.isNaN(asNumber)) {
    return asNumber;
  }
  return value;
};

const defaultOptions: ParseOptions = {
  nested: true,
  nestingSyntax: 'dot',
  arrayRepeat: false,
  arrayRepeatSyntax: 'repeat',
  delimiter: 38
};

function splitByIndexPattern(input: string): string[] {
  const result: string[] = [];
  let buffer = '';

  for (let i = 0; i < input.length; i++) {
    const chr = input[i];
    const nextChr = input[i + 1];
    if (chr === '[' || chr === ']') {
      result.push(buffer);
      buffer = '';
      if (nextChr === '[') {
        i++;
      }
    } else {
      buffer += chr;
    }
  }

  if (buffer) {
    result.push(buffer);
  }

  return result;
}

const regexPlus = /\+/g;
const Empty = function () {} as unknown as {new (): ParsedQuery};
Empty.prototype = Object.create(null);

/**
 * Parses a query string into an object
 * @param {string} input
 * @param {ParseOptions=} options
 */
export function parse(input: string, options?: UserParseOptions): ParsedQuery {
  const parseOptions: ParseOptions = {...defaultOptions, ...options};
  const charDelimiter =
    typeof parseOptions.delimiter === 'string'
      ? parseOptions.delimiter.charCodeAt(0)
      : parseOptions.delimiter;
  const {
    valueDeserializer,
    keyDeserializer,
    arrayRepeatSyntax,
    nested,
    arrayRepeat,
    nestingSyntax
  } = parseOptions;

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
  let hasBothKeyValuePair = false;
  let c = 0;

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

      key = input.slice(startingIndex + 1, equalityIndex);

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

        if (
          arrayRepeat &&
          arrayRepeatSyntax === 'bracket' &&
          key.endsWith('[]')
        ) {
          key = key.slice(0, -2);
        }

        const newValue = valueDeserializer
          ? valueDeserializer(key, value)
          : value;
        const newKey = keyDeserializer ? keyDeserializer(key) : key;
        let dlvKey = (typeof newKey === 'string' ? newKey : [newKey]) as DlvKey;

        if (typeof dlvKey === 'string' && nested) {
          if (nestingSyntax === 'index') {
            dlvKey = splitByIndexPattern(dlvKey);
          } else {
            dlvKey = dlvKey.split('.');
          }
        }

        const shouldDoNesting =
          nested && (dlvKey as string[]).pop !== undefined;
        const currentValue = shouldDoNesting
          ? dlv(result, dlvKey)
          : result[newKey];

        if (currentValue === undefined || !arrayRepeat) {
          if (shouldDoNesting) {
            dset(result, dlvKey, newValue);
          } else {
            result[newKey] = newValue;
          }
        } else if (arrayRepeat) {
          // Optimization: value.pop is faster than Array.isArray(value)
          if ((currentValue as unknown[]).pop) {
            (currentValue as unknown[]).push(newValue);
          } else {
            if (shouldDoNesting) {
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
      valueHasPlus = false;
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
