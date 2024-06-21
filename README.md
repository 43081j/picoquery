# picoquery

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

It will be called with the `value` and the `key` (i.e. `(value, key) => *`).

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

## License

MIT
