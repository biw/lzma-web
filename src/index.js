//! © 2015 Nathan Rugg <nmrugg@gmail.com> | MIT
const { LZMA_WORKER } = require("./lzma_worker");
const { LZMA } = require("./lzma");
const { compress, decompress } = LZMA();

module.exports.LZMA = LZMA_WORKER;
module.exports.compress = compress;
module.exports.decompress = decompress;
