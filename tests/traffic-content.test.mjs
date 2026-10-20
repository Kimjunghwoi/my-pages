import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";
import { createFeed, feedArticles } from "../scripts/build-feed.mjs";

const read = file => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const schema = text => JSON.parse(text.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
const newGuides = ["excel-trim-spaces", "excel-long-identifiers"];

test("two new guides are linked from home, collection, hub and sitemap with truthful dates", () => {
  for (const slug of newGuides) {
    const source = read(`data-guides/${slug}.html`);
    assert.match(read("index.html"), new RegExp(`href="\\./data-guides/${slug}\\.html"`));
    assert.ok(read("data-guides/index.html").includes(`href="./${slug}.html"`));
    assert.ok(read("sitemap.xml").includes(`${slug}.html</loc><lastmod>2026-10-20</lastmod>`));
    assert.equal(schema(source).datePublished, "2026-10-20");
    assert.match(source, /5574\.0/);
    assert.match(source, /합성/);
    assert.match(source, /Excel COM/);
    assert.match(source, /검증한 결과[는가] 아닙니다|검증 범위가 아닙니다/);
    assert.doesNotMatch(source, /<form|<input|localStorage|fetch\s*\(/);
    for (const [, attributes] of source.matchAll(/<div class="sample-table-wrap"([^>]*)>/g)) {
      assert.match(attributes, /role="region"/);
      assert.match(attributes, /tabindex="0"/);
      assert.match(attributes, /aria-label="[^"]+"/);
    }
  }
});

test("the download's invisible characters match the actual Excel calculation evidence", () => {
  const evidence = JSON.parse(read("docs/traffic-excel-evidence-2026-10-20.json"));
  assert.equal(evidence.passed, 36);
  assert.equal(evidence.results.length, 36);
  evidence.results.forEach(row => assert.deepEqual(row.observed, row.expected, row.check));
  const rows = read("data-guides/trim-example.tsv").trimEnd().split(/\r?\n/).slice(1).map(row => row.split("\t"));
  assert.deepEqual(rows.map(row => row[0]), ["  Seoul  Center  ", "\u00a0Seoul\u00a0Center\u00a0", "AB  12", "\u202fSeoul\u202f"]);
  rows.forEach((row, index) => assert.equal(row[0], evidence.results.find(item => item.check === `trim.${index + 2}.1`).observed));
  const ids = read("data-guides/long-id-example.csv").trim().split(/\r?\n/).slice(1).map(row => row.split(","));
  assert.deepEqual(ids.map(row => row[0]), ["1234567890123456", "1234567890123450", "0000123456789012"]);
  assert.equal(ids.reduce((sum, row) => sum + Number(row[1]), 0), 6);
  assert.equal(evidence.results.find(row => row.check === "id.exact").observed, false);
  assert.equal(evidence.results.find(row => row.check === "id.numeric-length").observed, 16);
  assert.equal(evidence.results.find(row => row.check === "id.text-length").observed, 16);
});

test("RSS is deterministic, full-text, canonical and restricted to sixteen approved articles", () => {
  const feed = createFeed();
  assert.equal(read("feed.xml").replace(/\r\n/g, "\n"), feed);
  assert.equal(feedArticles.length, 16);
  assert.equal((feed.match(/<item>/g) || []).length, 16);
  assert.equal((feed.match(/<guid isPermaLink="true">/g) || []).length, 16);
  assert.match(feed, /<atom:link href="https:\/\/jhsoftlabs.com\/feed.xml"/);
  assert.doesNotMatch(feed, /href="\.\.?\/|src="\.\.?\/|href="#|https:\/\/jhsoftlabs\.com\/[^"<>\s]*\.html|[CD]:[\\/]|<script|<textarea|data-reader-actions/);
  const items = [...feed.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(match => match[1]);
  const dates = items.map(item => Date.parse(item.match(/<pubDate>([^<]+)<\/pubDate>/)[1]));
  assert.deepEqual(dates, [...dates].sort((a, b) => b - a));
  for (const file of feedArticles) {
    const data = schema(read(file));
    const url = data.mainEntityOfPage.replace(/\.html$/, "");
    const item = items.find(value => value.includes(`<guid isPermaLink="true">${url}</guid>`));
    assert.ok(item, file);
    assert.ok(item.includes("story-content"), `${file}: missing full body`);
    const lastSection = [...read(file).matchAll(/<section id="([^"]+)"/g)].at(-1)?.[1];
    if (lastSection) assert.ok(item.includes(`id="${lastSection}"`), `${file}: truncated body`);
  }
  assert.match(feed, /EXACT\(C2,B2\)/);
  assert.match(feed, /원본 시스템이 두 값을 다른 키로 취급한다면/);
});

test("every selected article provides crawlable follow-up resources and progressive sharing", () => {
  for (const file of [...feedArticles, "templates/index.html", "projects/bampang/index.html"]) {
    const source = read(file);
    assert.equal((source.match(/data-reader-actions/g) || []).length, 1, file);
    assert.match(source, /data-share-controls hidden/);
    assert.match(source, /data-share-url readonly/);
    assert.match(source, /data-share-status role="status" aria-live="polite"/);
    assert.match(source, /<a href="https:\/\/jhsoftlabs.com\/[^"]+">이 글의 정규 주소/);
    const related = source.match(/<nav class="related-resources"[\s\S]*?<\/nav>/)[0];
    assert.ok((related.match(/<a href=/g) || []).length >= 2, file);
    assert.doesNotMatch(related, /onclick|\shidden\b|javascript:/);
  }
});

test("eleven distinct 1200 by 630 share cards match metadata and remain script-free illustrations", () => {
  const names = readdirSync(new URL("../assets", import.meta.url)).filter(name => /^share-.+\.png$/.test(name));
  assert.equal(names.length, 11);
  const digests = new Set();
  const html = [...feedArticles, "templates/index.html", "projects/bampang/index.html"].map(read).join("\n");
  for (const name of names) {
    const png = readFileSync(new URL(`../assets/${name}`, import.meta.url));
    assert.equal(png.toString("hex", 0, 8), "89504e470d0a1a0a");
    assert.equal(png.readUInt32BE(16), 1200);
    assert.equal(png.readUInt32BE(20), 630);
    digests.add(createHash("sha256").update(png).digest("hex"));
    assert.ok(html.includes(`https://jhsoftlabs.com/assets/${name}`), name);
    const svg = read(`assets/${name.replace(".png", ".svg")}`);
    assert.doesNotMatch(svg, /<script|<foreignObject|\bon\w+=/i);
    assert.match(svg, /설명용 예제|실제 게임 캐릭터/);
  }
  assert.equal(digests.size, names.length);
});

test("only three search titles change and original narrative headlines stay intact", () => {
  const rows = [
    ["ai-retry-safety", "AI API 재시도와 중복 저장 방지", "AI가 답한 뒤에 생기는 문제들"],
    ["excel-native-checks", "Excel 긴 ID 손상과 필터 검증 기록", "글자 수는 같았는데, ID는 달라졌다"],
    ["column-harbor", "CSV 원본 보존을 위한 브라우저 도구 설계", "숫자로 바꾸기 전에, 원본을 한 번 더"],
  ];
  for (const [slug, title, headline] of rows) {
    const source = read(`stories/${slug}.html`);
    assert.ok(source.includes(`<title>${title} |`));
    assert.equal(schema(source).headline, headline);
    const visible = source.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)[1].replace(/<br\s*\/?>/g, " ").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    assert.equal(visible, headline + (slug === "column-harbor" ? "." : ""));
    assert.equal(schema(source).datePublished, "2026-09-13");
  }
});
