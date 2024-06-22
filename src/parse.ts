import {
  type Options,
  type DeserializeKeyFunction,
  type DeserializeValueFunction,
  defaultOptions
} from './shared.js';
import fastDecode from 'fast-decode-uri-component';
import {getDeepValue, setDeepValue} from './object-util.js';

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
  let keyPath: PropertyKey[] = [];
  let lastKeyPathPart: PropertyKey = '';
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

        lastKeyPathPart = keyDeserializer(keyChunk);
        keyPath.push(lastKeyPathPart);
      }

      // Add key/value pair only if the range size is greater than 1; a.k.a. contains at least "="
      if (hasBothKeyValuePair || keyPath.length > 0) {
        if (hasBothKeyValuePair) {
          value = input.slice(equalityIndex + 1, i);

          if (valueHasPlus) {
            value = value.replace(regexPlus, ' ');
          }

          if (shouldDecodeValue) {
            value = fastDecode(value) || value;
          }
        }

        const newValue = valueDeserializer(value, lastKeyPathPart);
        const hasNestedKey = nesting && keyPath.length > 1;
        let currentValue;

        if (hasNestedKey) {
          currentValue = getDeepValue(result, keyPath);
        } else {
          currentValue = result[lastKeyPathPart];
        }

        if (currentValue === undefined || !arrayRepeat) {
          if (hasNestedKey) {
            setDeepValue(result, keyPath, newValue);
          } else {
            result[lastKeyPathPart] = newValue;
          }
        } else if (arrayRepeat) {
          // Optimization: value.pop is faster than Array.isArray(value)
          if ((currentValue as unknown[]).pop) {
            (currentValue as unknown[]).push(newValue);
          } else {
            if (hasNestedKey) {
              setDeepValue(result, keyPath, [currentValue, newValue]);
            } else {
              result[lastKeyPathPart] = [currentValue, newValue];
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
      arrayRepeatBracketIndex = -1;
      keySeparatorIndex = i;
      keyPath = [];
      lastKeyPathPart = '';
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

        lastKeyPathPart = keyDeserializer(keyChunk);
        keyPath.push(lastKeyPathPart);

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

        lastKeyPathPart = keyDeserializer(keyChunk);
        keyPath.push(lastKeyPathPart);

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

          lastKeyPathPart = keyDeserializer(keyChunk);
          keyPath.push(lastKeyPathPart);
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
