import {type Options, defaultOptions} from './shared.js';
import {encodeString} from './string-util.js';

type KeyableObject = Record<PropertyKey, unknown>;

function isPrototypeKey(value: unknown) {
  return (
    value === '__proto__' || value === 'constructor' || value === 'prototype'
  );
}

export function getDeepObject(
  obj: KeyableObject,
  key: PropertyKey,
  nextKey: PropertyKey,
  forceObject?: boolean,
  forceArray?: boolean
): KeyableObject {
  if (isPrototypeKey(key)) return obj;

  const currObj = obj[key] as KeyableObject;
  if (typeof currObj === 'object' && currObj !== null) {
    return currObj;
  }
  // Check if the key is not a number, if it is a number, an array must be used
  if (
    !forceObject &&
    (forceArray ||
      typeof nextKey === 'number' ||
      (typeof nextKey === 'string' &&
        (nextKey as unknown as number) * 0 === 0 &&
        nextKey.indexOf('.') === -1))
  ) {
    return (obj[key] = []) as unknown as KeyableObject;
  }
  return (obj[key] = {});
}

const MAX_DEPTH = 20;
const strBracketPair = '[]';
const strBracketLeft = '[';
const strBracketRight = ']';
const strDot = '.';

export function stringifyObject(
  obj: Record<PropertyKey, unknown>,
  options: Partial<Options>,
  depth: number = 0,
  parentKey?: string,
  isProbableArray?: boolean
): string {
  const {
    nestingSyntax = defaultOptions.nestingSyntax,
    arrayRepeat = defaultOptions.arrayRepeat,
    arrayRepeatSyntax = defaultOptions.arrayRepeatSyntax,
    nesting = defaultOptions.nesting,
    delimiter = defaultOptions.delimiter,
    valueSerializer = defaultOptions.valueSerializer,
    shouldSerializeObject = defaultOptions.shouldSerializeObject
  } = options;
  const strDelimiter =
    typeof delimiter === 'number' ? String.fromCharCode(delimiter) : delimiter;
  const useArrayRepeatKey = isProbableArray === true && arrayRepeat;
  const shouldUseDot =
    nestingSyntax === 'dot' || (nestingSyntax === 'js' && !isProbableArray);

  if (depth > MAX_DEPTH) {
    return '';
  }

  let result = '';
  let firstKey = true;
  let valueIsProbableArray = false;

  for (const key in obj) {
    const value = obj[key];
    if (value === undefined) {
      continue;
    }
    let path;
    if (parentKey) {
      path = parentKey;
      if (useArrayRepeatKey) {
        if (arrayRepeatSyntax === 'bracket') {
          path += strBracketPair;
        }
      } else if (shouldUseDot) {
        path += strDot;
        path += key;
      } else {
        path += strBracketLeft;
        path += key;
        path += strBracketRight;
      }
    } else {
      path = key;
    }

    if (
      typeof value === 'object' &&
      value !== null &&
      !shouldSerializeObject(value)
    ) {
      valueIsProbableArray = (value as unknown[]).pop !== undefined;

      if (nesting || (arrayRepeat && valueIsProbableArray)) {
        const subResult = stringifyObject(
          value as Record<PropertyKey, unknown>,
          options,
          depth + 1,
          path,
          valueIsProbableArray
        );
        if (subResult !== '') {
          if (!firstKey) {
            result += strDelimiter;
          } else {
            firstKey = false;
          }
          result += subResult;
        }
      }
    } else {
      if (!firstKey) {
        result += strDelimiter;
      } else {
        firstKey = false;
      }
      result += encodeString(path);
      result += '=';
      result += valueSerializer(value, key);
    }
  }

  return result;
}
