import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { assertCsvMigration } from "./csv-migration.mjs";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sitemap = readFileSync(join(root, "integrations/column-harbor/public/sitemap.xml"), "utf8");
const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => new URL(match[1]).pathname)
  .filter(path => path !== "/csv-checker").map(path => path === "/method" ? "/about" : path);
const sources = paths.flatMap(path => ["http:", "https:"].map(protocol => `${protocol}//csv.jhsoftlabs.com${path}`));
sources.push("https://csv.jhsoftlabs.com/about.html?source=migration-check&step=1", "https://csv.jhsoftlabs.com/about/?source=migration-check", "https://csv.jhsoftlabs.com/guides/csv-to-json-preserve-types/?source=migration-check", "https://csv.jhsoftlabs.com/__migration-missing-2026-10-29?source=migration-check");
sources.push(...["/workspace", "/learn/excel", "/workspace/repeat-cleanup"].map(path => "https://csv.jhsoftlabs.com" + path + "?__legacy=1"));
const legacy = await fetch("https://csv.jhsoftlabs.com/workspace?__legacy=1");
const legacyHtml = await legacy.text();
const asset = legacyHtml.match(/<script[^>]*src="(\/_next\/[^"]+\.js)"/)?.[1];
if (asset) sources.push("https://csv.jhsoftlabs.com" + asset);
let next = 0;
const results = [];
async function worker() {
  while (next < sources.length) {
    const source = sources[next++];
    let response;
    try {
      response = await fetch(source, { redirect: "manual", signal: AbortSignal.timeout(30000) });
      const target = assertCsvMigration(source, response);
      results.push({ source, target, status: response.status, passed: true });
    } catch (error) { results.push({ source, passed: false, error: error.message }); }
    finally { await response?.body?.cancel(); }
  }
}
await Promise.all(Array.from({ length: 6 }, worker));
const report = { checkedAt: new Date().toISOString(), oldCanonicalPages: paths.length, passed: results.filter(row => row.passed).length, failed: results.filter(row => !row.passed).length, results };
const output = join(root, "outputs/root-integration-2026-10-29/redirects.json");
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ pages: report.oldCanonicalPages, passed: report.passed, failed: report.failed, report: output }));
for (const row of results.filter(row => !row.passed)) console.error(row.source + ": " + row.error);
if (report.failed) process.exitCode = 1;
