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

export type DeserializeValueFunction = (
  value: string,
  key: PropertyKey
) => unknown;

export type DeserializeKeyFunction = (key: string) => PropertyKey;

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
}

const identityFunc = <T>(v: T): T => v;

export const defaultOptions: Options = {
  nesting: true,
  nestingSyntax: 'dot',
  arrayRepeat: false,
  arrayRepeatSyntax: 'repeat',
  delimiter: 38,
  valueDeserializer: identityFunc,
  keyDeserializer: identityFunc
};
