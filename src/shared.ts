import {encodeString} from './string-util.js';

export type ArrayRepeatSyntax =
  // `foo[]=a&foo[]=b`
  | 'bracket'
  // `foo=a&foo=b`
  | 'repeat';

export type NestingSyntax =
  // `foo.bar`
  | 'dot'
  // `foo[bar]`
  | 'index'
  // `foo.bar[0]`
  | 'js';

export type DeserializeValueFunction = (
  value: string,
  key: PropertyKey
) => unknown;

export type SerializeValueFunction = (
  value: unknown,
  key: PropertyKey
) => string;

export type ShouldSerializeObjectFunction = (value: unknown) => boolean;

export type DeserializeKeyFunction = (key: string) => PropertyKey;

export const defaultValueSerializer: SerializeValueFunction = (
  value: unknown
): string => {
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

  if (value instanceof Date) {
    return encodeString(value.toISOString());
  }

  return '';
};

export const defaultShouldSerializeObject: ShouldSerializeObjectFunction = (
  val
) => {
  return val instanceof Date;
};

export interface Options {
  // Enable parsing nested objects and arrays
  // default: true
  nesting: boolean;

  // Nesting syntax
  // default: "dot"
  nestingSyntax: NestingSyntax;

  // Whether repeated keys should result in arrays
  // e.g. `foo=1&foo=2` would become `foo: [1, 2]`
  // default: false
  arrayRepeat: boolean;

  // Array syntax
  // default: "repeat"
  arrayRepeatSyntax: ArrayRepeatSyntax;

  // Delimiter to split kv pairs by
  // default: "&"
  delimiter: string | number;

  // Custom deserializers
  valueDeserializer: DeserializeValueFunction;
  keyDeserializer: DeserializeKeyFunction;
  valueSerializer: SerializeValueFunction;
  shouldSerializeObject: ShouldSerializeObjectFunction;
}

const identityFunc = <T>(v: T): T => v;

export const defaultOptions: Options = {
  nesting: true,
  nestingSyntax: 'dot',
  arrayRepeat: false,
  arrayRepeatSyntax: 'repeat',
  delimiter: 38,
  valueDeserializer: identityFunc,
  valueSerializer: defaultValueSerializer,
  keyDeserializer: identityFunc,
  shouldSerializeObject: defaultShouldSerializeObject
};
