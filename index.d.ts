type Mode = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

declare module "lzma-web" {
  /** The class uses a web worker */
  export default class LZMA {
    /** @param mode defaults to 9 */
    compress: (
      input: string | Uint8Array | ArrayBuffer,
      mode?: Mode
    ) => Promise<Uint8Array>;
    /**
     * By default, the result will be returned as a string if it decodes
     * as valid UTF-8 text; otherwise, it will return a Uint8Array instance.
     **/
    decompress: (
      byteArray: Uint8Array | ArrayBuffer
    ) => Promise<string | Uint8Array>;

    cb: {
      compress: (
        input: string | Uint8Array | ArrayBuffer,
        mode: Mode,
        onFinish: (result: Uint8Array | null, error: Error | null) => void,
        onProgress?: (percentage: number) => void
      ) => void;
      /**
       * By default, the result will be returned as a string if it decodes
       * as valid UTF-8 text; otherwise, it will return a Uint8Array instance.
       *
       * ----
       *
       * If the decompression progress is unable to be calculated, the
       * `on_progress()` function will be triggered once with the value `-1`.
       **/
      decompress: (
        byteArray: Uint8Array | ArrayBuffer,
        onFinish: (
          result: string | Uint8Array | null,
          error: Error | null
        ) => void,
        onProgress?: (percentage: number) => void
      ) => void;
    };
  }
}
