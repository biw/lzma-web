describe("Vanilla", function () {
  before(loadLZMAReference("/base/dist/lzma_worker.js"));

  describe("lzma_worker.js", function () {
    before(loadLZMA("/base/dist/lzma_worker.js"));
    LZMATestCase(true, true, false);
  });

  describe("lzma.js with lzma_worker.js", function () {
    before(loadLZMAWorker("/base/dist/lzma.js", "/base/dist/lzma_worker.js"));
    LZMATestCase(true, true, true);
  });
});
