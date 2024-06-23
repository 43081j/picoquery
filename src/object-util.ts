import {type Options, defaultOptions} from './shared.js';

type KeyableObject = Record<PropertyKey, unknown>;

function isPrototypeKey(value: unknown) {
  return (
    value === '__proto__' || value === 'constructor' || value === 'prototype'
  );
}

export function getDeepObject(
  obj: KeyableObject,
  lastKey: PropertyKey,
  key: PropertyKey
): KeyableObject {
  const currObj = obj[lastKey] as KeyableObject;
  if (typeof currObj === 'object' && currObj !== null) {
    if (isPrototypeKey(lastKey)) return obj;
    return currObj;
  }
  // Check if the key is not a number, if it is a number, an array must be used
  else if (
    typeof key === 'string' &&
    ((key as unknown as number) * 0 !== 0 || key.indexOf('.') > -1)
  ) {
    if (isPrototypeKey(lastKey)) return obj;
    return (obj[lastKey] = {});
  }
  return (obj[lastKey] = []) as unknown as KeyableObject;
}

const MAX_DEPTH = 20;
const strBracketPair = '[]';
const strBracketLeft = '[';
const strBracketRight = ']';
const strDot = '.';

export type KeyValuePair = [PropertyKey, unknown];

function walkNestedValues(
  obj: Record<PropertyKey, unknown>,
  options: Partial<Options>,
  out: KeyValuePair[],
  depth: number = 0,
  parentKey?: string,
  useArrayRepeatKey?: boolean
): void {
  const {
    nestingSyntax = defaultOptions.nestingSyntax,
    arrayRepeat = defaultOptions.arrayRepeat,
    arrayRepeatSyntax = defaultOptions.arrayRepeatSyntax,
    nesting = defaultOptions.nesting
  } = options;

  if (depth > MAX_DEPTH) {
    return;
  }

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

    const probableArray = (value as unknown[]).pop !== undefined;

    if (
      typeof value === 'object' &&
      value !== null &&
      (nesting || (arrayRepeat && probableArray))
    ) {
      walkNestedValues(
        value as Record<PropertyKey, unknown>,
        options,
        out,
        depth + 1,
        path,
        arrayRepeat && probableArray
      );
    } else {
      out.push([path, value]);
    }
  }
}

export function getNestedValues(
  obj: object,
  options: Partial<Options>
): KeyValuePair[] {
  const result: KeyValuePair[] = [];

  if (obj === null) {
    return result;
  }

  walkNestedValues(obj as Record<PropertyKey, unknown>, options, result);

  return result;
}
