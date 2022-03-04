describe("Vanilla", function () {
  before(loadLZMAReference("/base/src/lzma_worker.js"));

  describe("lzma_worker.js", function () {
    before(loadLZMA("/base/src/lzma_worker.js"));
    LZMATestCase(true, true, false);
  });

  describe("lzma-c.js", function () {
    before(loadLZMA("/base/src/lzma-c.js"));
    LZMATestCase(true, false, false);
  });

  describe("lzma-d.js", function () {
    before(loadLZMA("/base/src/lzma-d.js"));
    LZMATestCase(false, true, false);
  });

  describe("lzma.js with lzma_worker.js", function () {
    before(loadLZMAWorker("/base/src/lzma.js", "/base/src/lzma_worker.js"));
    LZMATestCase(true, true, true);
  });

  describe("lzma.js with lzma-c.js", function () {
    before(loadLZMAWorker("/base/src/lzma.js", "/base/src/lzma-c.js"));
    LZMATestCase(true, false, true);
  });

  describe("lzma.js with lzma-d.js", function () {
    before(loadLZMAWorker("/base/src/lzma.js", "/base/src/lzma-d.js"));
    LZMATestCase(false, true, true);
  });
});
