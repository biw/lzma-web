# @719ben/lzma

`@719ben/lzma` is a JavaScript implementation of the Lempel-Ziv-Markov (LZMA) chain compression algorithm. It is a fork of [LZMA-JS](https://github.com/nmrugg/LZMA-JS) written by [Nathan Rugg](https://github.com/nmrugg).

## Install

LZMA-JS is available in the npm repository.

```sh
yarn add @719ben/lzma
```

## Usage

```js
import { LZMA } from '@719ben/lzma'
const my_lzma = new LZMA()

/// To compress:
///NOTE: mode can be 1-9 (1 is fast and pretty good; 9 is slower and probably much better).
///NOTE: compress() can take a string or an array of bytes.
///      (A Node.js Buffer or a Uint8Array instance counts as an array of bytes.)
my_lzma.compress(string || byte_array, mode, on_finish(result, error) {}, on_progress(percent) {});

/// To decompress:
///NOTE: By default, the result will be returned as a string if it decodes as valid UTF-8 text;
///      otherwise, it will return a Uint8Array instance.
my_lzma.decompress(byte_array, on_finish(result, error) {}, on_progress(percent) {});
```

## Notes

The `decompress()` function needs an array of bytes or a Node.js `Buffer` object.

If the decompression progress is unable to be calculated, the `on_progress()` function will be triggered once with the value `-1`.

LZMA-JS will try to use Web Workers if they are available.  If the environment does not support Web Workers,
it will just do something else, and it won't pollute the global scope.
Each call to `LZMA()` will create a new Web Worker, which can be accessed via `my_lzma.worker()`.

LZMA-JS was originally based on gwt-lzma, which is a port of the LZMA SDK from Java into JavaScript.

## But I don't want to use Web Workers

If you'd prefer not to bother with Web Workers, you can use the functions directly. For example:

```js
import { compress, decompress } from '@719ben/lzma'

compress(string || byte_array, mode, on_finish(result, error) {}, on_progress(percent) {});

decompress(byte_array, on_finish(result, error) {}, on_progress(percent) {});
```

In Node.js, the Web Worker code is already skipped, so there's no need to do this.

## Demos

Live demos can be found [here](http://lzma-js.github.io/LZMA-JS/).

## Compatibility

LZMA-JS is compatible with anything that is compatible with the reference implementation of LZMA, for example, the `lzma` command.


## License

[MIT](https://github.com/biw/LZMA-JS/blob/master/LICENSE)
