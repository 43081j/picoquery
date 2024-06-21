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
