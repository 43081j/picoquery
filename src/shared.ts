export type ArrayRepeatSyntax =
  // `foo[]=a&foo[]=b`
  | 'bracket'
  // `foo=a&foo=b`
  | 'repeat';

export type NestingSyntax =
  // `foo.bar`
  | 'dot'
  // `foo[bar]`
  | 'index';

// This is a special return value for deserializers and serializers, to tell the library
// to fall back to using the default (de)serialize function.
// We can't just return `null` or `undefined` etc, because we may want to deserialize to that
export const CONTINUE = Symbol('continue');

export type DeserializeValueFunction = (
  value: string,
  key: string
) => unknown | typeof CONTINUE;

export type DeserializeKeyFunction = (
  key: string
) => PropertyKey | typeof CONTINUE;

export interface Options {
  // Enable parsing nested objects and arrays
  // default: true
  nested: boolean;

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
}

const identityFunc = <T>(v: T): T => v;

export const defaultOptions: Options = {
  nested: true,
  nestingSyntax: 'dot',
  arrayRepeat: false,
  arrayRepeatSyntax: 'repeat',
  delimiter: 38,
  valueDeserializer: identityFunc,
  keyDeserializer: identityFunc
};
