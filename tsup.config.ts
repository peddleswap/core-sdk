import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  // viem is a peer dependency: bundling a second copy into this package would give a
  // consumer two viem instances, and `instanceof` checks across them fail.
  external: ["viem"],
  treeshake: true,
  sourcemap: true,
});
