import {type Options, defaultOptions} from './shared.js';

export function getDeepValue(obj: unknown, keys: PropertyKey[]): unknown {
  const keysLength = keys.length;
  for (let i = 0; i < keysLength; i++) {
    obj = (obj as Record<PropertyKey, unknown>)[keys[i]];
    if (!obj) {
      return obj;
    }
  }
  return obj;
}

type KeyableObject = Record<PropertyKey, unknown>;

export function setDeepValue(
  obj: unknown,
  keys: PropertyKey[],
  val: unknown
): void {
  const len = keys.length;
  const lastKey = len - 1;
  let k;
  let curr = obj as KeyableObject;
  let currVal;
  let nextKey;

  for (let i = 0; i < len; i++) {
    k = keys[i];

    if (k === '__proto__' || k === 'constructor' || k === 'prototype') {
      break;
    }

    if (i === lastKey) {
      curr[k] = val;
    } else {
      currVal = curr[k];
      if (typeof currVal === 'object' && currVal !== null) {
        curr = currVal as KeyableObject;
      } else {
        nextKey = keys[i + 1];
        if (
          typeof nextKey === 'string' &&
          ((nextKey as unknown as number) * 0 !== 0 ||
            nextKey.indexOf('.') > -1)
        ) {
          curr = curr[k] = {};
        } else {
          curr = curr[k] = [] as unknown as KeyableObject;
        }
      }
    }
  }
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
