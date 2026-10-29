import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const origin = new URL(process.argv[2] || "https://jhsoftlabs.com").origin;
assert.ok(origin === "https://jhsoftlabs.com" || origin === "http://127.0.0.1:8019" || /^https:\/\/[a-f0-9]+\.jhsoftlabs\.pages\.dev$/.test(origin));
const artifact = join(root, ".pages-dist");
const results = [];
const sitemap = readFileSync(join(artifact, "sitemap.xml"), "utf8");
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
function walk(directory = "") { return readdirSync(join(artifact, directory), { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(directory + entry.name + "/") : [directory + entry.name]); }
const tasks = [
  ...urls.map(canonical => ({ kind: "page", path: new URL(canonical).pathname, canonical })),
  ...walk().filter(file => !file.endsWith(".html") && file !== "_headers").map(file => ({ kind: "asset", path: "/" + file, file })),
  ...["/__integration-missing-2026-10-29", "/docs/root-content-integration-2026-10-29.md", "/integrations/column-harbor/manifest.json", "/_workspace/column-harbor-root-2026-10-29/package.json", "/.git/config"].map(path => ({ kind: "private-or-missing", path })),
];
let next = 0;
async function worker() {
  while (next < tasks.length) {
    const item = tasks[next++];
    try {
      const response = await fetch(origin + item.path, { signal: AbortSignal.timeout(30000) });
      assert.equal(response.status, item.kind === "private-or-missing" ? 404 : 200);
      const bytes = Buffer.from(await response.arrayBuffer());
      if (item.kind === "page") {
        const html = bytes.toString();
        assert.equal(html.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/)?.[1], item.canonical);
        assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1);
        if (origin === "https://jhsoftlabs.com") assert.doesNotMatch(response.headers.get("x-robots-tag") || "", /noindex/);
        assert.doesNotMatch(html, /<meta\b[^>]*name="robots"[^>]*content="[^"]*noindex/i);
        assert.doesNotMatch(html, /<script[^>]*src="https:\/\/pagead2/);
      } else if (item.kind === "asset") {
        const expected = readFileSync(join(artifact, item.file));
        const flight = item.file.endsWith(".txt") && /^(?:csv-checker|method|guides|workspace|learn)(?:\/|\.txt$)/.test(item.file);
        if (!flight && /\.(?:css|js|xml|txt|svg|json|md|csv|tsv|pq|py|vtt)$/.test(item.file)) assert.equal(bytes.toString().replace(/\r\n/g, "\n"), expected.toString().replace(/\r\n/g, "\n"));
        else assert.equal(createHash("sha256").update(bytes).digest("hex"), createHash("sha256").update(expected).digest("hex"));
      }
      results.push({ ...item, status: response.status, passed: true });
    } catch (error) { results.push({ ...item, passed: false, error: error.message.slice(0, 1200) }); }
  }
}
await Promise.all(Array.from({ length: 8 }, worker));
const report = { checkedAt: new Date().toISOString(), origin, sitemapPages: urls.length, passed: results.filter(item => item.passed).length, failed: results.filter(item => !item.passed).length, results };
const output = join(root, "outputs/root-integration-2026-10-29", origin.startsWith("http:") ? "local-http.json" : origin.includes("pages.dev") ? "preview-http.json" : "public-http.json");
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ origin, pages: report.sitemapPages, passed: report.passed, failed: report.failed, report: output }));
for (const item of results.filter(item => !item.passed)) console.error(item.path + ": " + item.error);
if (report.failed) process.exitCode = 1;
