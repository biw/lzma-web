# lzma.js

[![Build Status][build-badge]][build]
[![version][version-badge]][package]
[![bundlephobia][bundlephobia-badge]][bundlephobia]
[![MIT License][license-badge]][license]

`lzma.js` is a JavaScript implementation of the Lempel-Ziv-Markov (LZMA) chain compression algorithm.

**The codebase is a fork of [LZMA-JS](https://github.com/nmrugg/LZMA-JS) written by [Nathan Rugg](https://github.com/nmrugg).**

## Install

```sh
yarn add lzma.js
```

## Usage

```js
import LZMA from 'lzma.js'
const lzma = new LZMA()

const str = "Hello World"

const compressed = await lzma.compress(str)

const decompressed = await lzma.decompress(compressed)

console.log(str === decompressed) // -> true
```

You can also set the compression level on `compress` via an optional second parameter:

```js
// value ranges from `1` (fastest) to `9` best
const compressed = await lzma.compress("Hello World", 1)
```

Finally, lzma.js also supports compression progress via callbacks (for large payloads):

```js
const str = "Hello World"

lzma.cb.compress(
  str, 
  9, // compression level must be set when using callback
  (result, error) => { // when the compression finishes or errors
    if (error) throw error
    console.log(results)
  },
  (progressPercentage) => {
    console.log('the current percentage is', progressPercentage)
  },
)
```

and decompression progress via callbacks:

```js
const byteArray = [/* <array of bytes> */]

lzma.cb.decompress(
  byteArray,
  (result, error) => {
    if (error) throw error
    console.log(results)
  },
  // If the decompression progress is unable to be calculated, the 
  // `on_progress()` function will be triggered once with the value `-1`.
  (progressPercentage) => {
    console.log('the current percentage is', progressPercentage)
  }
)
```

## Typescript

The repo has typescript support. You can view the types in [`index.d.ts`](https://github.com/biw/lzma.js/blob/main/index.d.ts).

## Web Workers

If the current browser supports web workers, `lzma.js` uses them to prevent blocking the main thread.

Each call of `new LZMA()` will create a new web worker.

In Node.js and unsupported browsers, `lzma.js` is run in the main thread.

Almost all modern browsers support web workers: [https://caniuse.com/webworkers](https://caniuse.com/webworkers)

## Demos

Live demos can be found at [http://lzma-js.github.io/LZMA-JS/](http://lzma-js.github.io/LZMA-JS/).

## Compatibility

`lzma.js` is compatible with the reference implementation of LZMA, for example, the `lzma` command.

## License

[MIT](https://github.com/biw/lzma.js/blob/main/LICENSE)



[build-badge]: https://img.shields.io/circleci/build/github/biw/lzma.js.svg?style=flat-square
[build]: https://app.circleci.com/pipelines/github/biw/lzma.js
[version-badge]: https://img.shields.io/npm/v/lzma.js.svg?style=flat-square
[package]: https://www.npmjs.com/package/lzma.js
[license-badge]: https://img.shields.io/npm/l/lzma.js.svg?style=flat-square
[license]: https://github.com/biw/lzma.js/blob/master/LICENSE
[bundlephobia]: https://bundlephobia.com/result?p=lzma.js
[bundlephobia-badge]: https://img.shields.io/bundlephobia/minzip/lzma.js@latest?style=flat-square
