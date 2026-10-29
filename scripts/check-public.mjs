import assert from "node:assert/strict";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { assertCanonicalHostRedirect, canonicalHostCases } from "./canonical-hosts.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const artifact = join(root, ".pages-dist");
const origin = "https://jhsoftlabs.com";
const reportIndex = process.argv.indexOf("--report");
const reportPath = resolve(root, reportIndex === -1 ? "outputs/reviews/reader-2026-10-19/public.json" : process.argv[reportIndex + 1] || "");
if (!reportPath.startsWith(resolve(root, "outputs") + sep) || !reportPath.endsWith(".json")) throw new Error("Report path must be a JSON file inside outputs/");
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
    if (["excel-trim-spaces", "excel-long-identifiers"].includes(slug)) {
      assert.match(html, /"datePublished":"2026-10-20"/);
      assert.match(html, /data-select-url/);
      assert.ok(html.includes(`assets/share-${slug}.png`));
      assert.match(html, /5574\.0/);
    }
    if (new URL(url).pathname === "/") {
      assert.match(html, /href="\/workspace\/compare-csv-files"/);
      assert.match(html, /href="\/learn\/excel"/);
      assert.match(html, /href="\/about\/"/);
      assert.match(html, /href="\/feed\.xml"/);
    }
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

for (const file of files(artifact).filter(file => !file.endsWith(".html") && file !== "_headers")) {
  await check("asset", `${origin}/${file}`, async response => {
    assert.equal(response.status, 200);
    const actual = Buffer.from(await response.arrayBuffer());
    const expected = readFileSync(join(artifact, file));
    // Git LF and a Windows CRLF checkout represent the same text asset.
    if (textFile.test(file)) assert.equal(normalize(actual.toString("utf8")), normalize(expected.toString("utf8")), file);
    else assert.deepEqual(actual, expected, file);
  });
}

for (const path of ["/__reader-check-missing-2026-10-19", "/docs/reader-followup-2026-10-19.md", "/tests/reader-followup.test.mjs", "/docs/traffic-paths-2026-10-20.md", "/scripts/verify-traffic-excel.py"]) {
  await check("not-found", origin + path, response => assert.equal(response.status, 404));
}
for (const slug of ["csv-one-column", "excel-leading-zeros", "power-query-merge-rows", "excel-filter-spill", "excel-trim-spaces", "excel-long-identifiers"]) {
  await check("legacy-alias", `${origin}/data-guides/${slug}.html?reader=check`, response => {
    assert.equal(response.status, 200);
    assert.equal(response.url, `${origin}/data-guides/${slug}?reader=check`);
  });
}

for (const { url, expectedStatus } of canonicalHostCases) {
  await check("canonical-host", url, async response => {
    const first = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(20000) });
    try {
      const target = assertCanonicalHostRedirect(url, first);
      assert.equal(response.url, target);
      assert.equal(response.status, expectedStatus);
    } finally {
      await first.body?.cancel();
    }
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
