# picoquery

[![CI](https://github.com/43081j/picoquery/actions/workflows/main.yml/badge.svg?branch=main)](https://github.com/43081j/picoquery/actions/workflows/main.yml)
[![NPM version](https://img.shields.io/npm/v/picoquery.svg?style=flat)](https://www.npmjs.com/package/picoquery)

A lightweight query string parser/stringifier with support for nesting and some
configurability.

Built on top of [fast-querystring](https://github.com/anonrig/fast-querystring).

## Install

```sh
npm i -S picoquery
```

### CommonJS vs ESM

`2.x` and above are _ESM only_ (i.e. your project will need `type: "module"`
in the `package.json`).

If you cannot yet move to ESM, you may continue to use `1.x` which will still
receive non-breaking changes, backported from `main`.

## Usage

Parsing a query string:

```ts
import {parse} from 'picoquery';

parse('foo.bar=abc&baz=def');

/*
  {
    foo: {
      bar: 'abc'
    },
    baz: 'def'
  }
*/
```

Stringifying an object:

```ts
import {stringify} from 'picoquery';

stringify({
  foo: {
    bar: 123
  }
});

/*
foo.bar=123
*/
```

## API

### `stringify(object[, options])`

Converts the given object into a query string, optionally with configured
options.

### `parse(str[, options])`

Parses the given query string into an object, optionally with configured
options.

## Options

### Default options

The default options are as follows:

```ts
{
  nesting: true,
  nestingSyntax: 'dot',
  arrayRepeat: false,
  arrayRepeatSyntax: 'repeat',
  delimiter: '&'
}
```

### `nesting`

When true, nested objects are supported.

For example, when parsing:

```ts
parse('foo.bar=baz', {nesting: true});

// {foo: {bar: 'baz'}}
```

When stringifying:

```ts
stringify({foo: {bar: 'baz'}}, {nesting: true});

// foo.bar=baz
```

This also results in arrays being supported:

```ts
parse('foo.0=bar', {nesting: true});
// {foo: ['bar']}

stringify({foo: ['bar']}, {nesting: true});
// foo.0=bar
```

### `nestingSyntax`

Sets which style of nesting syntax should be used. The choices are:

- `dot` (e.g. `foo.bar=baz`)
- `index` (e.g. `foo[bar]=baz`)
- `js` (e.g. `foo.bar[0]=baz`, i.e. arrays are indexed and properties are
dotted or indexed)

### `arrayRepeat`

If `true`, this will treat repeated keys as arrays.

For example:

```ts
parse('foo=x&foo=y', {arrayRepeat: true});
// {foo: ['x', 'y']}

stringify({foo: ['x', 'y']}, {arrayRepeat: true});
// foo=x&foo=y
```

### `arrayRepeatSyntax`

Sets which style of array repetition syntax should be used. The choices are:

- `bracket` (e.g. `foo[]=x&foo[]=y`)
- `repeat` (e.g. `foo=x&foo=y`)

### `delimiter`

Sets the delimiter to be used instead of `&`.

For example:

```ts
parse('foo=x;bar=y', {delimiter: ';'});
// {foo: 'x', bar: 'y'}

stringify({foo: 'x', bar: 'y'}, {delimiter: ';'});
// foo=x;bar=y
```

### `valueDeserializer`

Can be set to a function which will be used to deserialize each value during
parsing.

It will be called with the `value` and the already deserialized
`key` (i.e. `(value: string, key: PropertyKey) => *`).

For example:

```ts
parse('foo=300', {
  valueDeserializer: (value) => {
    const asNum = Number(value);
    return Number.isNaN(asNum) ? value : asNum;
  }
});

// {foo: 300}
```

### `keyDeserializer`

Can be set to a function which will be used to deserialize each key during
parsing.

It will be called with the `key` from the query string
(i.e. `(key) => PropertyKey`).

For example:

```ts
parse('300=foo', {
  keyDeserializer: (key) => {
    const asNum = Number(key);
    return Number.isNaN(asNum) ? key : asNum;
  }
});

// {300: 'foo'}
```

### `shouldSerializeObject`

Can be set to a function which determines if an _object-like_ value should be
serialized instead of being treated as a nested object.

**All non-object primitives will always be serialized.**

For example:

```
// Assuming `StringifableObject` returns its constructor value when `toString`
// is called.
stringify({
  foo: new StringifiableObject('test')
}, {
  shouldSerializeObject(val) {
    return val instanceof StringifableObject;
  },
  valueSerializer: (value) => {
    return String(value);
  }
});

// foo=test
```

If you want to fall back to the default logic, you can import the default
function:

```
import {defaultShouldSerializeObject, stringify} from 'picoquery';

stringify({
  foo: new StringifiableObject('test')
}, {
  shouldSerializeObject(val) {
    if (val instanceof StringifableObject) {
      return true;
    }
    return defaultShouldSerializeObject(val);
  }
});
```

### `valueSerializer`

Can be set to a function which will be used to serialize each value during
stringifying.

It will be called with the `value` and the `key`
(i.e. `(value: unknown, key: PropertyKey) => string`).

For example:

```ts
stringify({foo: 'bar'}, {
  valueSerializer: (val) => String(val) + String(val)
});

// foo=barbar
```

**Note** that you can import the default serializer if you only want to handle
some cases.

For example:

```ts
import {defaultValueSerializer, stringify} from 'picoquery';

stringify({foo: 'bar'}, {
  valueSerializer: (val, key) => {
    if (val instanceof Date) {
      return val.toISOString();
    }

    // Call the original serializer otherwise
    return defaultValueSerializer(val, key);
  }
});
```

## Benchmarks

**IMPORTANT**: there are a few things to take into account with these
benchmarks:

- `fast-querystring` is not capable of parsing or stringifying nested objects,
so the results are incomparible (but here as reference)
- all libraries have their own level of configurability. It will be possible
to increase perf in each of them by disabling various features, but these are
just the 'happy path'

### Parse

```
Benchmark: Basic (no nesting)
┌─────────┬─────────────────────────────────┬─────────────┬────────────────────┬──────────┬─────────┐
│ (index) │ Task Name                       │ ops/sec     │ Average Time (ns)  │ Margin   │ Samples │
├─────────┼─────────────────────────────────┼─────────────┼────────────────────┼──────────┼─────────┤
│ 0       │ 'picoquery'                     │ '2,393,539' │ 417.79130492907393 │ '±0.42%' │ 1196770 │
│ 1       │ 'qs'                            │ '382,933'   │ 2611.4212945313157 │ '±1.04%' │ 191467  │
│ 2       │ 'fast-querystring (no nesting)' │ '2,633,148' │ 379.77342802356833 │ '±1.58%' │ 1316575 │
└─────────┴─────────────────────────────────┴─────────────┴────────────────────┴──────────┴─────────┘
Benchmark: Dot-syntax nesting
┌─────────┬─────────────────────────────────┬─────────────┬───────────────────┬──────────┬─────────┐
│ (index) │ Task Name                       │ ops/sec     │ Average Time (ns) │ Margin   │ Samples │
├─────────┼─────────────────────────────────┼─────────────┼───────────────────┼──────────┼─────────┤
│ 0       │ 'picoquery'                     │ '1,406,039' │ 711.2176054736389 │ '±0.56%' │ 703020  │
│ 1       │ 'qs'                            │ '205,611'   │ 4863.536155478235 │ '±0.98%' │ 102806  │
│ 2       │ 'fast-querystring (no nesting)' │ '2,588,560' │ 386.3151031345139 │ '±0.66%' │ 1294281 │
└─────────┴─────────────────────────────────┴─────────────┴───────────────────┴──────────┴─────────┘
```

### Stringify

```
Benchmark: Basic (no nesting)
┌─────────┬─────────────────────────────────┬─────────────┬────────────────────┬──────────┬─────────┐
│ (index) │ Task Name                       │ ops/sec     │ Average Time (ns)  │ Margin   │ Samples │
├─────────┼─────────────────────────────────┼─────────────┼────────────────────┼──────────┼─────────┤
│ 0       │ 'picoquery'                     │ '4,163,092' │ 240.20605684139227 │ '±0.16%' │ 2081547 │
│ 1       │ 'qs'                            │ '843,630'   │ 1185.352608720127  │ '±0.76%' │ 421816  │
│ 2       │ 'fast-querystring (no nesting)' │ '3,795,565' │ 263.46536774751036 │ '±0.24%' │ 1897783 │
└─────────┴─────────────────────────────────┴─────────────┴────────────────────┴──────────┴─────────┘
Benchmark: Dot-syntax nesting
┌─────────┬─────────────────────────────────┬─────────────┬────────────────────┬──────────┬─────────┐
│ (index) │ Task Name                       │ ops/sec     │ Average Time (ns)  │ Margin   │ Samples │
├─────────┼─────────────────────────────────┼─────────────┼────────────────────┼──────────┼─────────┤
│ 0       │ 'picoquery'                     │ '1,768,770' │ 565.3644818387182  │ '±1.08%' │ 884387  │
│ 1       │ 'qs'                            │ '332,254'   │ 3009.743667534287  │ '±1.38%' │ 166128  │
│ 2       │ 'fast-querystring (no nesting)' │ '7,227,031' │ 138.36940410118828 │ '±1.15%' │ 3613517 │
└─────────┴─────────────────────────────────┴─────────────┴────────────────────┴──────────┴─────────┘
```

## License

MIT
