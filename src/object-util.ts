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
  nextKey: PropertyKey
): KeyableObject {
  if (isPrototypeKey(key)) return obj;

  const currObj = obj[key] as KeyableObject;
  if (typeof currObj === 'object' && currObj !== null) {
    return currObj;
  }
  // Check if the key is not a number, if it is a number, an array must be used
  else if (
    typeof nextKey === 'string' &&
    ((nextKey as unknown as number) * 0 !== 0 || nextKey.indexOf('.') > -1)
  ) {
    return (obj[key] = {});
  }
  return (obj[key] = []) as unknown as KeyableObject;
}

const MAX_DEPTH = 20;
const strBracketPair = '[]';
const strBracketLeft = '[';
const strBracketRight = ']';
const strDot = '.';

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

export function stringifyObject(
  obj: Record<PropertyKey, unknown>,
  options: Partial<Options>,
  depth: number = 0,
  parentKey?: string,
  useArrayRepeatKey?: boolean
): string {
  const {
    nestingSyntax = defaultOptions.nestingSyntax,
    arrayRepeat = defaultOptions.arrayRepeat,
    arrayRepeatSyntax = defaultOptions.arrayRepeatSyntax,
    nesting = defaultOptions.nesting,
    delimiter = defaultOptions.delimiter
  } = options;
  const strDelimiter =
    typeof delimiter === 'number' ? String.fromCharCode(delimiter) : delimiter;

  if (depth > MAX_DEPTH) {
    return '';
  }

  let result = '';
  let firstKey = true;
  let probableArray = false;

  for (const key in obj) {
    const value = obj[key];
    let path;
    if (parentKey) {
      path = parentKey;
      if (useArrayRepeatKey) {
        if (arrayRepeatSyntax === 'bracket') {
          path += strBracketPair;
        }
      } else if (nestingSyntax === 'dot') {
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

    if (!firstKey) {
      result += strDelimiter;
    }

    if (typeof value === 'object' && value !== null) {
      probableArray = (value as unknown[]).pop !== undefined;

      if (nesting || (arrayRepeat && probableArray)) {
        result += stringifyObject(
          value as Record<PropertyKey, unknown>,
          options,
          depth + 1,
          path,
          arrayRepeat && probableArray
        );
      }
    } else {
      result += encodeString(path);
      result += '=';
      result += getAsPrimitive(value);
    }

    if (firstKey) {
      firstKey = false;
    }
  }

  return result;
}
