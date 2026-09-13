import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildPages } from "./build-pages.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const checks = ["script.js", "experiences.js", "tools/release-check/checklist.js", "scripts/build-pages.mjs", "scripts/verify-pages.mjs"];
const tests = readdirSync(resolve(root, "tests")).filter((name) => name.endsWith(".test.mjs")).sort().map((name) => `tests/${name}`);
for (const args of [...checks.map((file) => ["--check", file]), ["--test", ...tests]]) {
  const result = spawnSync(process.execPath, args, { cwd: root, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
const result = buildPages();
console.log(`Pages artifact verified: ${result.files.length} files, ${result.totalBytes} bytes -> ${result.output}`);
