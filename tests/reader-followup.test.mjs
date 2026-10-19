import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const slugs = ["csv-one-column", "excel-leading-zeros", "power-query-merge-rows", "excel-filter-spill"];

test("CSV import opens the editor before removing numeric inference and assigning Text", () => {
  const article = read("data-guides/csv-one-column.html");
  const flow = article.match(/<section id="import">([\s\S]*?)<\/section>/)[1];
  const preview = flow.indexOf("Delimiter");
  const editor = flow.indexOf("데이터 변환(Transform Data)");
  const inferredType = flow.indexOf("Changed Type");
  const textType = flow.indexOf("텍스트(Text)");
  assert.ok(preview >= 0 && editor > preview && inferredType > editor && textType > inferredType);
  assert.match(flow, /먼저 그 단계를 삭제/);
  assert.match(flow, /123을 Text로 바꾸기만 해서는/);
  assert.match(article, /Power Query나 Text to Columns 화면을 클릭한 검증이 아니/);
});

test("XLSX alternative is actionable and separates all-text preservation from numeric calculation", () => {
  const article = read("data-guides/excel-leading-zeros.html");
  const section = article.match(/<section id="browser-export"[\s\S]*?<\/section>/)[0];
  assert.match(article, /href="#browser-export"/);
  assert.match(section, /href="https:\/\/csv\.jhsoftlabs\.com\/workspace\/csv-to-excel"/);
  for (const label of ["CSV to convert", "Comma", "Create Excel workbook", "Download XLSX", "00123", "00007", "A-004"]) assert.ok(section.includes(label));
  assert.match(section, /모든 셀을 텍스트로 보존/);
  assert.match(section, /계산 대상 열만 검토한 뒤 숫자로 변환/);
  assert.match(section, /복원해 주지는 않습니다/);
  assert.match(section, /파일 생성 성공과 내 Excel 환경에서의 결과 확인은 별개/);
  assert.doesNotMatch(section, /<iframe|<input|<form|fetch\(|localStorage|sessionStorage/);
});

test("all guide tables and code regions have named no-script keyboard entry points", () => {
  for (const slug of slugs) {
    const article = read(`data-guides/${slug}.html`);
    assert.match(article, /<main id="main" class="story-shell" tabindex="-1">/);
    assert.match(article, /<nav class="story-toc" aria-label="목차">/);
    const labels = [];
    const tables = [...article.matchAll(/<div class="sample-table-wrap"([^>]*)>/g)];
    assert.ok(tables.length > 0);
    for (const [, attributes] of tables) {
      assert.match(attributes, /role="region"/);
      assert.match(attributes, /tabindex="0"/);
      const label = attributes.match(/aria-label="([^"]+)"/)?.[1];
      assert.ok(label);
      labels.push(label);
    }
    assert.equal(new Set(labels).size, labels.length);
    for (const [, attributes] of article.matchAll(/<pre class="sample-code"([^>]*)>/g)) {
      assert.match(attributes, /tabindex="0"/);
      assert.match(attributes, /aria-label="[^"]+"/);
    }
  }
});

test("only substantively changed guide dates advance and print styles preserve wide examples", () => {
  const sitemap = read("sitemap.xml");
  for (const slug of slugs) {
    const article = read(`data-guides/${slug}.html`);
    const modified = ["csv-one-column", "excel-leading-zeros"].includes(slug) ? "2026-10-19" : slug === "power-query-merge-rows" ? "2026-10-05" : "2026-09-27";
    assert.ok(article.includes(`"dateModified": "${modified}"`));
    assert.ok(article.includes('"datePublished": "2026-09-19"'));
    assert.ok(sitemap.includes(`${slug}.html</loc><lastmod>${modified}</lastmod>`));
    assert.match(article, /stories\.css\?v=20261019-reader/);
  }
  const print = read("stories.css").match(/@media print\s*\{([\s\S]*?)\n\}/)[1];
  assert.match(print, /\.sample-table-wrap\s*\{\s*overflow: visible;/);
  assert.match(print, /\.sample-table\s*\{\s*white-space: normal; table-layout: fixed;/);
  assert.match(print, /\.sample-code, \.template-preview pre\.sample-code\s*\{\s*white-space: pre-wrap; overflow: visible; overflow-wrap: anywhere;/);
});
