/// <reference types="node" />

type Mode = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

type compress = (
  input: string | Uint8Array,
  mode: Mode,
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
    compress: (
      input: string | ArrayLike<number>,
      mode: Mode = 9
    ) => Promise<number[]>;
    decompress: (input: ArrayLike<number>) => Promise<string>;
  }
}
