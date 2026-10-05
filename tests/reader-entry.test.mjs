import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("four Korean problem paths precede projects and work without JavaScript", () => {
  const home = read("index.html");
  const start = home.match(/<section class="guide-start[\s\S]*?<\/section>/)?.[0];
  assert.ok(start);
  assert.ok(home.indexOf(start) < home.indexOf('id="projects"'));
  assert.equal((start.match(/<li>/g) || []).length, 4);
  for (const slug of ["csv-one-column", "excel-leading-zeros", "power-query-merge-rows", "excel-filter-spill"]) {
    assert.ok(start.includes(`href="./data-guides/${slug}.html"`));
  }
  assert.doesNotMatch(start, /\shidden(?:\s|=|>)|onclick|target="_blank"/);
  assert.match(start, /합성 데이터/);
});

test("guide hub does not hard-code a changing external inventory", () => {
  assert.doesNotMatch(read("data-guides/index.html"), /(?:영문 가이드|영어 원문)\s*\d+편|Excel Academy\s*\d+강/);
});

test("native evidence retains executed outcomes and explicit testing boundaries", () => {
  const evidence = JSON.parse(read("docs/excel-import-evidence-2026-10-05.json").replace(/^\uFEFF/, ""));
  assert.equal(evidence.passed, evidence.results.length);
  assert.ok(evidence.passed >= 27);
  for (const row of evidence.results) assert.deepEqual(row.observed, row.expected, row.check);
  assert.equal(evidence.results.find((row) => row.check === "text.sku").observed, "00123");
  assert.equal(evidence.results.find((row) => row.check === "display-only.value").observed, 123);
  for (const slug of ["csv-one-column", "excel-leading-zeros"]) {
    const article = read(`data-guides/${slug}.html`);
    assert.match(article, /id="native-evidence"/);
    assert.match(article, /QueryTables/);
    assert.match(article, /5569\.0/);
    assert.match(article, /Power Query/);
    assert.match(article, /검증[^<]*아니|검증[^<]*아닙/);
    assert.match(article, /"dateModified": "2026-10-05"/);
    assert.match(article, /ISTEXT\(A2\)/);
    assert.ok(read("sitemap.xml").includes(`${slug}.html</loc><lastmod>2026-10-05</lastmod>`));
  }
});
