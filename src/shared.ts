export type ArraySyntax =
  // `foo[0]=a&foo[1]=b`
  | 'index'
  // same as `index` but `foo[0]=a&foo[2]=b` would be ['a', undefined, 'b']
  | 'index-sparse'
  // `foo[]=a&foo[]=b`
  | 'bracket'
  // `foo=a&foo=b`
  | 'repeat';

// This is a special return value for deserializers and serializers, to tell the library
// to fall back to using the default (de)serialize function.
// We can't just return `null` or `undefined` etc, because we may want to deserialize to that
export const CONTINUE = Symbol('continue');
