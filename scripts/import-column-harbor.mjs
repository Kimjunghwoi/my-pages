import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = realpathSync(process.argv[2] || "");
assert.ok(existsSync(join(source, "scripts/verify-artifact.mjs")), "Expected a verified Column Harbor checkout");
execFileSync(process.execPath, ["scripts/verify-artifact.mjs"], { cwd: source, stdio: "inherit" });
const derivation = JSON.parse(readFileSync(join(source, "ROOT-DERIVATION.json"), "utf8"));
assert.equal(derivation.deploymentOrigin, "https://jhsoftlabs.com");
assert.equal(derivation.adsEnabled, false);
const target = join(root, "integrations/column-harbor");
if (existsSync(join(target, "manifest.json"))) {
  assert.equal(process.argv[3], "--replace", "Use --replace for the reviewed new snapshot");
  const directory = join(target, "public");
  assert.equal(realpathSync(target), target);
  assert.ok(!lstatSync(directory).isSymbolicLink() && realpathSync(directory) === directory);
  rmSync(directory, { recursive: true });
}
const stamp = JSON.parse(readFileSync(join(source, "outputs/verified.json"), "utf8"));
const artifact = join(source, "dist/client");
const approved = /^(?:(?:_next|guides|images|learn|media|samples|workspace)\/|(?:index|method|csv-checker|privacy|guides|workspace|404)\.(?:html|txt)$|(?:favicon\.svg|llms(?:-full)?\.txt|tools\.json|vinext-client-manifest\.json|sitemap\.xml)$)/;
const files = [];
function walk(directory = "") {
  for (const entry of readdirSync(join(artifact, directory), { withFileTypes: true })) {
    const name = directory + entry.name;
    assert.ok(!entry.isSymbolicLink(), "No symlinks in a public snapshot");
    if (entry.name.startsWith(".")) continue;
    if (entry.isDirectory()) { walk(name + "/"); continue; }
    if (!approved.test(name)) continue;
    assert.ok(!/\.(?:map|env)$/i.test(name));
    const bytes = readFileSync(join(artifact, name));
    const path = join(target, "public", name);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, bytes);
    files.push({ path: name, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") });
  }
}
walk();
const guides = JSON.parse(readFileSync(join(source, "lib/guide-content.json"), "utf8"));
const lessons = JSON.parse(readFileSync(join(source, "lib/academy-content.json"), "utf8"));
const catalog = JSON.parse(readFileSync(join(artifact, "tools.json"), "utf8"));
const manifest = {
  version: 1, importedOn: "2026-10-29", sourceCommit: derivation.sourceCommit, deploymentOrigin: derivation.deploymentOrigin, adsEnabled: false, derivation: derivation.changes,
  verifiedAt: stamp.verifiedAt, fingerprints: stamp.fingerprints,
  counts: { guides: guides.length, lessons: lessons.length, tools: catalog.tools.length },
  files: files.sort((a, b) => a.path.localeCompare(b.path, "en")),
};
writeFileSync(join(target, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(JSON.stringify({ imported: files.length, counts: manifest.counts, sourceCommit: manifest.sourceCommit }));
