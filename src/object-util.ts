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

const MAX_DEPTH = 20;
const strBracketPair = '[]';

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
    arrayRepeatSyntax = defaultOptions.arrayRepeatSyntax
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
        path += '.';
        path += key;
      } else {
        path += '[';
        path += key;
        path += ']';
      }
    } else {
      path = key;
    }

    if (typeof value === 'object' && value !== null) {
      walkNestedValues(
        value as Record<PropertyKey, unknown>,
        options,
        out,
        depth + 1,
        path,
        arrayRepeat && Array.isArray(value)
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
