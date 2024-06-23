import {getDeepObject} from './object-util.js';
import {
  type Options,
  type DeserializeKeyFunction,
  type DeserializeValueFunction,
  defaultOptions
} from './shared.js';
import fastDecode from 'fast-decode-uri-component';

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

function computeKeySlice(
  input: string,
  startIndex: number,
  endIndex: number,
  keyHasPlus: boolean,
  shouldDecodeKey: boolean
): string {
  let chunk = input.substring(startIndex, endIndex);

  if (keyHasPlus) {
    chunk = chunk.replace(regexPlus, ' ');
  }

  if (shouldDecodeKey) {
    chunk = fastDecode(chunk) || chunk;
  }

  return chunk;
}

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
    nesting = defaultOptions.nesting,
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
  let value = '';
  let startingIndex = -1;
  let equalityIndex = -1;
  let keySeparatorIndex = -1;
  let currentObj = result;
  let lastKey: PropertyKey | undefined = undefined;
  let currentKey: PropertyKey = '';
  let keyChunk = '';
  let shouldDecodeKey = false;
  let shouldDecodeValue = false;
  let keyHasPlus = false;
  let valueHasPlus = false;
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

      if (keySeparatorIndex !== equalityIndex - 1) {
        keyChunk = computeKeySlice(
          input,
          keySeparatorIndex + 1,
          arrayRepeatBracketIndex > -1
            ? arrayRepeatBracketIndex
            : equalityIndex,
          keyHasPlus,
          shouldDecodeKey
        );

        currentKey = keyDeserializer(keyChunk);
        if (lastKey !== undefined) {
          currentObj = getDeepObject(currentObj, lastKey, currentKey);
        }
      }

      // Add key/value pair only if the range size is greater than 1; a.k.a. contains at least "="
      if (hasBothKeyValuePair || currentKey !== '') {
        if (hasBothKeyValuePair) {
          value = input.slice(equalityIndex + 1, i);

          if (valueHasPlus) {
            value = value.replace(regexPlus, ' ');
          }

          if (shouldDecodeValue) {
            value = fastDecode(value) || value;
          }
        }

        const newValue = valueDeserializer(value, currentKey);
        if (arrayRepeat) {
          const currentValue = currentObj[currentKey];
          if (currentValue === undefined) {
            currentObj[currentKey] = newValue;
          }
          // Optimization: value.pop is faster than Array.isArray(value)
          else if ((currentValue as unknown[]).pop) {
            (currentValue as unknown[]).push(newValue);
          } else {
            currentObj[currentKey] = [currentValue, newValue];
          }
        } else currentObj[currentKey] = newValue;
      }

      // Reset reading key value pairs
      value = '';
      startingIndex = i;
      equalityIndex = i;
      shouldDecodeKey = false;
      shouldDecodeValue = false;
      keyHasPlus = false;
      valueHasPlus = false;
      arrayRepeatBracketIndex = -1;
      keySeparatorIndex = i;
      currentObj = result;
      lastKey = undefined;
      currentKey = '';
    }
    // Check ']'
    else if (c === 93) {
      if (arrayRepeat && arrayRepeatSyntax === 'bracket') {
        const prevIndex = i - 1;
        if (input.charCodeAt(prevIndex) === 91) {
          arrayRepeatBracketIndex = prevIndex;
        }
      }

      if (
        nesting &&
        nestingSyntax === 'index' &&
        equalityIndex <= startingIndex
      ) {
        keyChunk = computeKeySlice(
          input,
          keySeparatorIndex + 1,
          i,
          keyHasPlus,
          shouldDecodeKey
        );

        currentKey = keyDeserializer(keyChunk);
        if (lastKey !== undefined) {
          currentObj = getDeepObject(currentObj, lastKey, currentKey);
        }
        lastKey = currentKey;

        keySeparatorIndex = i;
        keyHasPlus = false;
        shouldDecodeKey = false;
      }
    }
    // Check '.'
    else if (c === 46) {
      if (
        nesting &&
        nestingSyntax === 'dot' &&
        equalityIndex <= startingIndex
      ) {
        keyChunk = computeKeySlice(
          input,
          keySeparatorIndex + 1,
          i,
          keyHasPlus,
          shouldDecodeKey
        );

        currentKey = keyDeserializer(keyChunk);
        if (lastKey !== undefined) {
          currentObj = getDeepObject(currentObj, lastKey, currentKey);
        }
        lastKey = currentKey;

        keySeparatorIndex = i;
        keyHasPlus = false;
        shouldDecodeKey = false;
      }
    }
    // Check '['
    else if (c === 91) {
      if (
        nesting &&
        nestingSyntax === 'index' &&
        equalityIndex <= startingIndex
      ) {
        if (keySeparatorIndex !== i - 1) {
          keyChunk = computeKeySlice(
            input,
            keySeparatorIndex + 1,
            i,
            keyHasPlus,
            shouldDecodeKey
          );

          currentKey = keyDeserializer(keyChunk);
          lastKey = currentKey;

          keyHasPlus = false;
          shouldDecodeKey = false;
        }

        keySeparatorIndex = i;
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
