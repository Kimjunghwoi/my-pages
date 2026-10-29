import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { contentFiles, integratedSitemap } from "../scripts/column-harbor.mjs";
const root = fileURLToPath(new URL("../", import.meta.url));
const read = file => readFileSync(new URL("../" + file, import.meta.url), "utf8");

test("the main entry offers on-domain tasks and learning rather than portfolio exits", () => {
  const home = read("hosting/content-home.html");
  assert.equal((home.match(/<h1\b/g) || []).length, 1);
  for (const path of ["/workspace/compare-csv-files", "/workspace/csv-to-excel", "/workspace/compare-two-lists", "/learn/excel", "/guides", "/about/", "/method", "/migration/"]) assert.ok(home.includes(`href="${path}"`), path);
  assert.doesNotMatch(home, /href="https:\/\/csv\.|pagead2|<ins\b|승인 보장|수익 보장/);
  assert.ok(home.indexOf('id="toolbox"') < home.indexOf('id="about"'));
  assert.match(home, /모든 셀을 텍스트/);
  assert.match(home, /실제 Excel 화면은 아닙니다/);
});

test("React payloads are built on the main origin and never string-rewritten after serialization", () => {
  const files = contentFiles(root);
  for (const name of ["workspace/compare-csv-files.html", "workspace/compare-csv-files.txt", "csv-checker.html", "method.html"]) {
    assert.deepEqual(files.get(name), readFileSync(new URL("../integrations/column-harbor/public/" + name, import.meta.url)));
  }
  const checker = files.get("csv-checker.html").toString();
  assert.match(checker, /rel="canonical" href="https:\/\/jhsoftlabs.com\/csv-checker"/);
  assert.match(checker, /href="\/method"/);
  assert.match(checker, /href="\/csv-checker#checker"/);
  assert.match(checker, /JH SOFT LABS/);
});

test("the pinned public snapshot excludes private source and preserves every sample byte", () => {
  const manifest = JSON.parse(read("integrations/column-harbor/manifest.json"));
  assert.deepEqual(manifest.counts, { guides: 63, lessons: 24, tools: 10 });
  assert.equal(manifest.sourceCommit, "65920846c70a488af63e2ef325120263ea31021d");
  const files = contentFiles(root);
  for (const entry of manifest.files) {
    assert.doesNotMatch(entry.path, /(?:^|\/)(?:docs|content|node_modules|\.git|\.openai|\.env)(?:\/|$)|\.map$/);
    if (/^samples\/.*\.(?:csv|tsv|xlsx|py|pq|pdf)$/.test(entry.path)) assert.deepEqual(files.get(entry.path), readFileSync(new URL("../integrations/column-harbor/public/" + entry.path, import.meta.url)));
  }
  assert.ok(files.has("workspace/csv-to-excel.html"));
  assert.ok(files.has("learn/excel/monthly-report-capstone.html"));
  assert.ok(files.has("method.html"));
  assert.ok(files.has("csv-checker.html"));
  assert.ok(!files.has("index.html") && !files.has("privacy.html") && !files.has("404.html"));
  for (const [name, bytes] of files) {
    if (!/\.(?:html|js|txt|json)$/.test(name)) continue;
    assert.doesNotMatch(bytes.toString(), /https:\/\/csv\.jhsoftlabs\.com|https:\/\/pagead2\.googlesyndication\.com/);
  }
});

test("the integrated sitemap contains all existing articles and uses the main host only", () => {
  const old = read("sitemap.xml");
  const xml = integratedSitemap(root, old);
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
  assert.equal(urls.length, 130);
  assert.equal(new Set(urls).size, urls.length);
  assert.ok(urls.every(url => new URL(url).origin === "https://jhsoftlabs.com"));
  assert.equal(urls.filter(url => url.includes("/guides/")).length, 63);
  assert.equal(urls.filter(url => url.includes("/learn/excel/")).length, 24);
  for (const [, url] of old.matchAll(/<loc>([^<]+)<\/loc>/g)) assert.ok(urls.includes(url.replace(/\.html$/, "")));
  assert.match(xml, /<loc>https:\/\/jhsoftlabs.com\/privacy<\/loc><lastmod>2026-10-29/);
});

test("storage and privacy notices explain the origin boundary without silently moving values", () => {
  const notice = read("migration/index.html");
  assert.match(notice, /localStorage/);
  assert.match(notice, /自動|자동으로 복사되지/);
  assert.match(notice, /__legacy=1/);
  assert.doesNotMatch(notice, /<script|postMessage|fetch\(/);
  assert.match(read("privacy.html"), /파일 내용과 행 값, 계산 결과/);
});
