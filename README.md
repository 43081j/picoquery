# nanoquery

A lightweight query string parser/stringifier with support for nesting and some
configurability.

Built on top of [fast-querystring](https://github.com/anonrig/fast-querystring).

## Install

```sh
npm i -S nanoquery
```

## Usage

Parsing a query string:

```ts
import {parse} from 'nanoquery';

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

## License

MIT
