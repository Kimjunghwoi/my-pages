import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const base = new URL("../integrations/column-harbor/public/", import.meta.url);
const read = name => readFileSync(new URL(name, base), "utf8");
const focused = {
  "power-query-merge-duplicates-extra-rows": "2026-09-16",
  "excel-freeze-rows-and-columns-together": "2026-09-30",
  "compare-csv-added-missing-ids": "2026-09-09",
  "power-query-promote-headers": "2026-10-05",
  "excel-xlookup-multiple-criteria": "2026-09-09",
};

test("five main-domain guide entries offer static practice and result navigation", () => {
  for (const [slug, published] of Object.entries(focused)) {
    const html = read(`guides/${slug}.html`);
    assert.equal((html.match(/id="guide-start-title"/g) || []).length, 1, slug);
    assert.equal((html.match(/id="check-your-result"/g) || []).length, 1, slug);
    assert.match(html, /href="#check-your-result"/);
    assert.match(html, /href="#worked-example"/);
    assert.match(html, /id="worked-example"/);
    assert.match(html, /Try the worked example/);
    assert.match(html, /Continue with the next task/);
    assert.ok(html.includes(`"datePublished":"${published}"`));
    assert.ok(html.includes('"dateModified":"2026-11-18"'));
    assert.ok(html.includes(`rel="canonical" href="https://jhsoftlabs.com/guides/${slug}"`));
    assert.doesNotMatch(html, /href="#step-0"|https:\/\/csv\.jhsoftlabs|pagead2\.googlesyndication|googletagmanager\.com/);
    for (const [, id] of html.matchAll(/<a\b[^>]*href="#([^"]+)"/g)) {
      assert.ok(html.includes(`id="${id}"`), `${slug}: missing anchor ${id}`);
    }
  }
  assert.doesNotMatch(read("guides/excel-leading-zeros.html"), /id="guide-start-title"/);
});

test("focused download links preserve the supplied file and runnable script name", () => {
  const python = read("guides/compare-csv-added-missing-ids.html");
  assert.match(python, /href="\/samples\/compare-csv-added-missing-ids\/example-2\.py" download="compare_ids\.py"/);
  assert.match(read("guides/excel-freeze-rows-and-columns-together.html"), /href="\/samples\/excel-freeze-rows-and-columns-together\/practice-workbook\.xlsx"/);
  for (const slug of Object.keys(focused)) {
    const html = read(`guides/${slug}.html`);
    for (const [, path] of html.matchAll(/<a\b[^>]*href="(\/samples\/[^"?#]+)"/g)) {
      assert.ok(readFileSync(new URL(path.slice(1), base)).length > 0, path);
    }
  }
});
