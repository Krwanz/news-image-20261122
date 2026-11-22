import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const SRC = new URL("./poster.png", import.meta.url).pathname;
const OUT_DIR = process.env.MAKEFUN_OUTPUT_DIR;
const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

if (!OUT_DIR) {
  throw new Error("MAKEFUN_OUTPUT_DIR is not set");
}
if (!existsSync(SRC)) {
  throw new Error(`poster.png not found at ${SRC}`);
}

// Clear only the contents of the output directory, never the directory itself.
mkdirSync(OUT_DIR, { recursive: true });
for (const name of readdirSync(OUT_DIR)) {
  rmSync(join(OUT_DIR, name), { recursive: true, force: true });
}

// Verify the source poster itself before copying it, so a bad source
// fails loudly here instead of passing a bad file through.
const srcBuf = readFileSync(SRC);
if (!srcBuf.subarray(0, 8).equals(PNG_SIG)) {
  throw new Error("poster.png does not start with the PNG signature");
}
if (srcBuf.readUInt32BE(16) !== 1024 || srcBuf.readUInt32BE(20) !== 576) {
  throw new Error(
    `poster.png is ${srcBuf.readUInt32BE(16)}x${srcBuf.readUInt32BE(20)}, expected exactly 1024x576`,
  );
}

const OUT = join(OUT_DIR, "entry.png");
copyFileSync(SRC, OUT);

// Verify the output we just wrote.
const buf = readFileSync(OUT);
if (!buf.subarray(0, 8).equals(PNG_SIG)) {
  throw new Error("entry.png does not start with the PNG signature");
}
const width = buf.readUInt32BE(16);
const height = buf.readUInt32BE(20);
if (width !== 1024 || height !== 576) {
  throw new Error(`entry.png is ${width}x${height}, expected exactly 1024x576`);
}
if (buf.length > 1048576) {
  throw new Error(`entry.png is ${buf.length} bytes, over the 1 MiB limit`);
}
console.log(`wrote ${OUT}: ${width}x${height}, ${buf.length} bytes`);
