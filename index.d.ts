/// <reference types="node" />

type compress = (
  input: string | Uint8Array,
  mode: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9,
  onFinish: (result: number[] | null, error: Error | null) => void,
  onProgress?: (percentage: number) => void
) => void;

type decompress = (
  byteArray: ArrayLike<number>,
  onFinish: (result: string | null, error: Error | null) => void,
  onProgress?: (percentage: number) => void
) => void;

declare module "@719ben/lzma" {
  export const compress: compress;
  export const decompress: decompress;
  /** The class uses a web worker */
  export class LZMA {
    compress: compress;
    decompress: decompress;
  }
}
