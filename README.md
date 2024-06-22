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
│ 0       │ 'picoquery'                     │ '2,088,510' │ 478.8101442558084  │ '±1.24%' │ 1044256 │
│ 1       │ 'qs'                            │ '404,952'   │ 2469.4269571359787 │ '±0.58%' │ 202477  │
│ 2       │ 'fast-querystring (no nesting)' │ '2,673,291' │ 374.07067091817515 │ '±0.17%' │ 1336646 │
└─────────┴─────────────────────────────────┴─────────────┴────────────────────┴──────────┴─────────┘
Benchmark: Dot-syntax nesting
┌─────────┬─────────────────────────────────┬─────────────┬───────────────────┬──────────┬─────────┐
│ (index) │ Task Name                       │ ops/sec     │ Average Time (ns) │ Margin   │ Samples │
├─────────┼─────────────────────────────────┼─────────────┼───────────────────┼──────────┼─────────┤
│ 0       │ 'picoquery'                     │ '1,311,689' │ 762.3752984694953 │ '±0.61%' │ 655846  │
│ 1       │ 'qs'                            │ '204,369'   │ 4893.105514508282 │ '±4.32%' │ 102185  │
│ 2       │ 'fast-querystring (no nesting)' │ '2,703,468' │ 369.8951402599062 │ '±0.52%' │ 1351739 │
└─────────┴─────────────────────────────────┴─────────────┴───────────────────┴──────────┴─────────┘
```

### Stringify

```
Benchmark: Basic (no nesting)
┌─────────┬─────────────────────────────────┬─────────────┬───────────────────┬──────────┬─────────┐
│ (index) │ Task Name                       │ ops/sec     │ Average Time (ns) │ Margin   │ Samples │
├─────────┼─────────────────────────────────┼─────────────┼───────────────────┼──────────┼─────────┤
│ 0       │ 'picoquery'                     │ '3,173,165' │ 315.142724962959  │ '±1.00%' │ 1586583 │
│ 1       │ 'qs'                            │ '874,512'   │ 1143.494080140431 │ '±0.67%' │ 437257  │
│ 2       │ 'fast-querystring (no nesting)' │ '3,880,750' │ 257.6821177957498 │ '±0.22%' │ 1940376 │
└─────────┴─────────────────────────────────┴─────────────┴───────────────────┴──────────┴─────────┘
Benchmark: Dot-syntax nesting
┌─────────┬─────────────────────────────────┬─────────────┬────────────────────┬──────────┬─────────┐
│ (index) │ Task Name                       │ ops/sec     │ Average Time (ns)  │ Margin   │ Samples │
├─────────┼─────────────────────────────────┼─────────────┼────────────────────┼──────────┼─────────┤
│ 0       │ 'picoquery'                     │ '1,594,677' │ 627.0860926154869  │ '±0.67%' │ 797339  │
│ 1       │ 'qs'                            │ '348,532'   │ 2869.1769746537816 │ '±3.81%' │ 174347  │
│ 2       │ 'fast-querystring (no nesting)' │ '7,300,567' │ 136.97564903135648 │ '±2.05%' │ 3650286 │
└─────────┴─────────────────────────────────┴─────────────┴────────────────────┴──────────┴─────────┘
```

## License

MIT
