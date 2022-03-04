const { build } = require("esbuild");

build({
  bundle: true,
  target: ["es6", "node6"],
  platform: "node",
  sourcemap: "external",
  entryPoints: ["./src/lzma.js", "./src/lzma_worker.js", "./src/index.js"],
  outdir: "dist",
  minify: true,
});
