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
│ 0       │ 'picoquery'                     │ '2,183,852' │ 457.9063444716842  │ '±1.22%' │ 1091927 │
│ 1       │ 'qs'                            │ '411,782'   │ 2428.4668709806833 │ '±0.60%' │ 205892  │
│ 2       │ 'fast-querystring (no nesting)' │ '2,683,879' │ 372.5949751851286  │ '±0.19%' │ 1341940 │
└─────────┴─────────────────────────────────┴─────────────┴────────────────────┴──────────┴─────────┘
Benchmark: Dot-syntax nesting
┌─────────┬─────────────────────────────────┬─────────────┬───────────────────┬──────────┬─────────┐
│ (index) │ Task Name                       │ ops/sec     │ Average Time (ns) │ Margin   │ Samples │
├─────────┼─────────────────────────────────┼─────────────┼───────────────────┼──────────┼─────────┤
│ 0       │ 'picoquery'                     │ '1,378,933' │ 725.198016728858  │ '±0.56%' │ 689467  │
│ 1       │ 'qs'                            │ '226,988'   │ 4405.505978237383 │ '±0.77%' │ 113495  │
│ 2       │ 'fast-querystring (no nesting)' │ '2,696,811' │ 370.8082736210032 │ '±0.62%' │ 1348406 │
└─────────┴─────────────────────────────────┴─────────────┴───────────────────┴──────────┴─────────┘
```

### Stringify

```
Benchmark: Basic (no nesting)
┌─────────┬─────────────────────────────────┬─────────────┬───────────────────┬──────────┬─────────┐
│ (index) │ Task Name                       │ ops/sec     │ Average Time (ns) │ Margin   │ Samples │
├─────────┼─────────────────────────────────┼─────────────┼───────────────────┼──────────┼─────────┤
│ 0       │ 'picoquery'                     │ '3,207,683' │ 311.7514686608459 │ '±1.35%' │ 1603842 │
│ 1       │ 'qs'                            │ '869,914'   │ 1149.538346231021 │ '±0.71%' │ 434958  │
│ 2       │ 'fast-querystring (no nesting)' │ '3,763,828' │ 265.6869199723878 │ '±2.07%' │ 1881915 │
└─────────┴─────────────────────────────────┴─────────────┴───────────────────┴──────────┴─────────┘
Benchmark: Dot-syntax nesting
┌─────────┬─────────────────────────────────┬─────────────┬────────────────────┬──────────┬─────────┐
│ (index) │ Task Name                       │ ops/sec     │ Average Time (ns)  │ Margin   │ Samples │
├─────────┼─────────────────────────────────┼─────────────┼────────────────────┼──────────┼─────────┤
│ 0       │ 'picoquery'                     │ '1,655,674' │ 603.9833856381597  │ '±0.74%' │ 827838  │
│ 1       │ 'qs'                            │ '356,189'   │ 2807.4931441470685 │ '±1.08%' │ 178096  │
│ 2       │ 'fast-querystring (no nesting)' │ '7,173,898' │ 139.39421988037319 │ '±1.31%' │ 3586950 │
└─────────┴─────────────────────────────────┴─────────────┴────────────────────┴──────────┴─────────┘
```

## License

MIT
