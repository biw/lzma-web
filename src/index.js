//! © 2015 Nathan Rugg <nmrugg@gmail.com> | MIT
import { LZMA_WORKER } from "./lzma_worker";
import { LZMA } from "./lzma";
const { compress, decompress } = LZMA();

export default class lzma {
  LZMA = new LZMA_WORKER();
  compress = async (input, mode = 9) => {
    return new Promise((res, rej) => {
      this.LZMA.compress(input, mode, (result, error) => {
        if (result) return res(result);
        rej(error);
      });
    });
  };
  decompress = async (input) => {
    return new Promise((res, rej) => {
      this.LZMA.decompress(input, (result, error) => {
        if (result) return res(result);
        rej(error);
      });
    });
  };
  cb = {
    compress,
    decompress,
  };
}
