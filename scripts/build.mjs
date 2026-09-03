import { build } from "esbuild";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = path.join(projectRoot, "dist");
const clientDirectory = path.join(outputDirectory, "client");
const serverDirectory = path.join(outputDirectory, "server");

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(path.join(clientDirectory, "assets"), { recursive: true });

await build({
  entryPoints: [path.join(projectRoot, "src", "main.tsx")],
  bundle: true,
  jsx: "automatic",
  minify: true,
  target: ["es2022"],
  format: "esm",
  external: ["/assets/*"],
  outfile: path.join(clientDirectory, "assets", "app.js"),
  logLevel: "info",
});

await build({
  entryPoints: [path.join(projectRoot, "src", "worker.ts")],
  bundle: true,
  minify: true,
  target: ["es2022"],
  format: "esm",
  platform: "neutral",
  outfile: path.join(serverDirectory, "index.js"),
  logLevel: "info",
});

await cp(path.join(projectRoot, "public"), clientDirectory, { recursive: true });

const sourceHtml = await readFile(path.join(projectRoot, "index.html"), "utf8");
const productionHtml = sourceHtml.replace(
  '<script type="module" src="/src/main.tsx"></script>',
  '<link rel="stylesheet" href="/assets/app.css" />\n    <script type="module" src="/assets/app.js"></script>',
);
await writeFile(path.join(clientDirectory, "index.html"), productionHtml, "utf8");

await writeFile(
  path.join(serverDirectory, "wrangler.json"),
  JSON.stringify(
    {
      name: "nearmade-marketplace",
      main: "index.js",
      compatibility_date: "2026-05-22",
      assets: {
        directory: "../client",
        binding: "ASSETS",
        not_found_handling: "single-page-application",
        run_worker_first: true,
      },
    },
    null,
    2,
  ),
  "utf8",
);

console.log("Nearmade production bundle written to dist/.");
