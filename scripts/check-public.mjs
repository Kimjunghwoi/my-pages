import assert from "node:assert/strict";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const artifact = join(root, ".pages-dist");
const origin = "https://jhsoftlabs.com";
const reportPath = join(root, "outputs/reviews/reader-2026-10-19/public.json");
const results = [];
const textFile = /\.(?:css|js|mjs|xml|txt|csv|tsv|pq|md|svg)$/i;
const normalize = (text) => text.replace(/\r\n/g, "\n");

function files(directory, prefix = "") {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const relative = prefix + entry.name;
    return entry.isDirectory() ? files(join(directory, entry.name), relative + "/") : [relative];
  });
}

async function check(kind, url, verify) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
    await verify(response);
    results.push({ kind, url, status: response.status, passed: true });
  } catch (error) {
    results.push({ kind, url, passed: false, error: error.message });
  }
}

const sitemap = readFileSync(join(artifact, "sitemap.xml"), "utf8");
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
assert.equal(new Set(urls).size, urls.length);
for (const url of urls) {
  await check("page", url, async response => {
    assert.equal(response.status, 200);
    assert.equal(response.url, url);
    assert.doesNotMatch(response.headers.get("x-robots-tag") || "", /noindex/i);
    const html = await response.text();
    assert.equal(html.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/)?.[1], url);
    assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1);
    assert.doesNotMatch(html, /<meta\b[^>]*name="robots"[^>]*content="[^"]*noindex/i);
    const slug = new URL(url).pathname.split("/").at(-1);
    if (["csv-one-column", "excel-leading-zeros"].includes(slug)) {
      assert.match(html, /"dateModified": "2026-10-19"/);
      assert.match(html, /property="article:modified_time" content="2026-10-19"/);
    }
    if (slug === "csv-one-column") assert.match(html, /데이터 변환\(Transform Data\)/);
    if (slug === "excel-leading-zeros") {
      assert.match(html, /id="browser-export"/);
      assert.match(html, /https:\/\/csv\.jhsoftlabs\.com\/workspace\/csv-to-excel/);
      assert.match(html, /모든 셀을 텍스트로 보존/);
    }
    if (new URL(url).pathname.startsWith("/data-guides/") && slug) {
      const regions = [...html.matchAll(/<div class="sample-table-wrap"([^>]*)>/g)];
      assert.ok(regions.length);
      for (const [, attributes] of regions) {
        assert.match(attributes, /tabindex="0"/);
        assert.match(attributes, /role="region"/);
        assert.match(attributes, /aria-label="[^"]+"/);
      }
    }
  });
}

for (const file of files(artifact).filter(file => !file.endsWith(".html"))) {
  await check("asset", `${origin}/${file}`, async response => {
    assert.equal(response.status, 200);
    const actual = Buffer.from(await response.arrayBuffer());
    const expected = readFileSync(join(artifact, file));
    // Git LF and a Windows CRLF checkout represent the same text asset.
    if (textFile.test(file)) assert.equal(normalize(actual.toString("utf8")), normalize(expected.toString("utf8")), file);
    else assert.deepEqual(actual, expected, file);
  });
}

for (const path of ["/__reader-check-missing-2026-10-19", "/docs/reader-followup-2026-10-19.md", "/tests/reader-followup.test.mjs"]) {
  await check("not-found", origin + path, response => assert.equal(response.status, 404));
}
for (const slug of ["csv-one-column", "excel-leading-zeros", "power-query-merge-rows", "excel-filter-spill"]) {
  await check("legacy-alias", `${origin}/data-guides/${slug}.html?reader=check`, response => {
    assert.equal(response.status, 200);
    assert.equal(response.url, `${origin}/data-guides/${slug}?reader=check`);
  });
}

const report = {
  checkedAt: new Date().toISOString(), origin, sitemapPages: urls.length,
  passed: results.filter(result => result.passed).length,
  failed: results.filter(result => !result.passed).length,
  results,
  limits: "Public HTTP, metadata and source/download integrity only; not browser behavior, indexing, reader uptake or AdSense approval.",
};
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ sitemapPages: report.sitemapPages, passed: report.passed, failed: report.failed, report: reportPath }));
for (const result of results.filter(result => !result.passed)) console.error(`${result.kind} ${result.url}: ${result.error}`);
if (report.failed) process.exitCode = 1;
