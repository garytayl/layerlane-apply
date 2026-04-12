import * as esbuild from "esbuild";
import { copyFileSync, mkdirSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dist = join(__dirname, "dist");

if (!existsSync(dist)) mkdirSync(dist, { recursive: true });

await esbuild.build({
  entryPoints: [join(__dirname, "src/content.ts")],
  bundle: true,
  outfile: join(dist, "content.js"),
  format: "iife",
  target: ["chrome100"],
});

await esbuild.build({
  entryPoints: [join(__dirname, "src/popup.ts")],
  bundle: true,
  outfile: join(dist, "popup.js"),
  format: "iife",
  target: ["chrome100"],
});

copyFileSync(join(__dirname, "popup.html"), join(dist, "popup.html"));
copyFileSync(join(__dirname, "public/manifest.json"), join(dist, "manifest.json"));

console.log("Built extension to dist/");
