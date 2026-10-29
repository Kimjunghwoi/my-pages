import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(process.argv[2] || "");
const target = resolve(root, process.argv[3] || "_workspace/column-harbor-root-2026-10-29");
assert.ok(target.startsWith(join(root, "_workspace") + sep), "Isolated source must stay inside _workspace/");
assert.ok(existsSync(join(source, "package.json")) && !existsSync(target), "Use an existing source and a new isolated build directory");
mkdirSync(dirname(target), { recursive: true });
const commit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: source, encoding: "utf8" }).trim();
execFileSync("git", ["clone", "--shared", "--no-hardlinks", "--no-checkout", source, target], { stdio: "inherit" });
execFileSync("git", ["checkout", "--detach", commit], { cwd: target, stdio: "inherit" });
const names = execFileSync("git", ["ls-files", "-z"], { cwd: target, encoding: "utf8" }).split("\0").filter(Boolean);
for (const name of names) {
  if (!/\.(?:tsx?|mjs|json|txt|xml|md|csv|tsv|css|html)$/.test(name)) continue;
  const file = join(target, name);
  assert.ok(!lstatSync(file).isSymbolicLink());
  const before = readFileSync(file, "utf8");
  const after = before.replaceAll("https://csv.jhsoftlabs.com", "https://jhsoftlabs.com")
    .replace(/\/about(?=[?#"'\\\s<])/g, "/method").replaceAll("/#checker", "/csv-checker#checker");
  if (after !== before) writeFileSync(file, after);
}
renameSync(join(target, "app/about"), join(target, "app/method"));
mkdirSync(join(target, "app/csv-checker"), { recursive: true });
const checker = readFileSync(join(target, "app/page.tsx"), "utf8")
  .replace("alternates: { canonical: '/' }", "alternates: { canonical: '/csv-checker' }")
  .replace("url: 'https://jhsoftlabs.com/',", "url: 'https://jhsoftlabs.com/csv-checker',");
writeFileSync(join(target, "app/csv-checker/page.tsx"), checker);
const article = join(target, "components/guide-article.tsx");
writeFileSync(article, readFileSync(article, "utf8")
  .replace(/^import GuideAd[^\n]*\n/m, "")
  .replace(/\s*<script async src="https:\/\/pagead2[^\n]*\n/, "\n")
  .replace(/<GuideAd\s*\/>/g, ""));
const chrome = join(target, "components/site-chrome.tsx");
writeFileSync(chrome, readFileSync(chrome, "utf8").replace(/\r\n/g, "\n")
  .replace('    <>\n      <a className="skip-link"', '    <>\n      <div className="content-return"><a href="/">JH SOFT LABS · 한국어 홈</a><span>Column Harbor · English tools &amp; lessons</span></div>\n      <a className="skip-link"')
  .replaceAll("pathname === '/' && hash", "pathname === '/csv-checker' && hash"));
const css = join(target, "app/globals.css");
writeFileSync(css, readFileSync(css, "utf8") + "\n" + readFileSync(join(root, "assets/content-shell.css"), "utf8"));
const generator = join(target, "scripts/build-guide-assets.mjs");
writeFileSync(generator, readFileSync(generator, "utf8").replace("const pages=[", "const pages=[{url:'/csv-checker',date:'2026-10-29'},"));
const discovery = join(target, "scripts/check-discovery.mjs");
writeFileSync(discovery, readFileSync(discovery, "utf8").replace("guides.length + 9 +", "guides.length + 10 +").replaceAll("guide ? 1 : 0", "0"));
writeFileSync(join(target, "ROOT-DERIVATION.json"), JSON.stringify({ version: 1, sourceCommit: commit, deploymentOrigin: "https://jhsoftlabs.com", adsEnabled: false, changes: ["Build metadata on the main origin before React serialization", "Add dedicated checker and method routes", "Preserve all computational samples and article dates", "Remove advertising requests, keep ownership metadata", "Add main-domain navigation"] }, null, 2) + "\n");
console.log(`Prepared: ${target}\nNext: create a node_modules junction to the existing verified dependency tree, then run npm run verify in this directory.`);
