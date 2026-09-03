import { build } from "esbuild";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = path.join(projectRoot, "dist");

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(path.join(outputDirectory, "assets"), { recursive: true });

await build({
  entryPoints: [path.join(projectRoot, "src", "main.tsx")],
  bundle: true,
  jsx: "automatic",
  minify: true,
  target: ["es2022"],
  format: "esm",
  external: ["/assets/*"],
  outfile: path.join(outputDirectory, "assets", "app.js"),
  logLevel: "info",
});

await build({
  entryPoints: [path.join(projectRoot, "src", "worker.ts")],
  bundle: true,
  minify: true,
  target: ["es2022"],
  format: "esm",
  platform: "neutral",
  outfile: path.join(outputDirectory, "server", "index.js"),
  logLevel: "info",
});

await cp(path.join(projectRoot, "public"), outputDirectory, { recursive: true });

const sourceHtml = await readFile(path.join(projectRoot, "index.html"), "utf8");
const productionHtml = sourceHtml.replace(
  '<script type="module" src="/src/main.tsx"></script>',
  '<link rel="stylesheet" href="/assets/app.css" />\n    <script type="module" src="/assets/app.js"></script>',
);
await writeFile(path.join(outputDirectory, "index.html"), productionHtml, "utf8");

console.log("Nearmade production bundle written to dist/.");
