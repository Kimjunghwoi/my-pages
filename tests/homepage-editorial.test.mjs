import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const html = read("index.html");
const css = read("home.css");

test("a concrete introduction leads to both guide and project paths without JavaScript", () => {
  const intro = html.match(/<section class="intro"[\s\S]*?<\/section>/)[0];
  assert.match(intro, /CSV·Excel 문제를 풀고/);
  assert.match(intro, /직접 만든 도구를 나눕니다/);
  assert.match(intro, /class="intro-actions"/);
  for (const destination of ["#data-guides", "#projects", "#about"]) assert.ok(intro.includes(`href="${destination}"`));
  assert.doesNotMatch(intro, /\shidden\b|onclick|<form/);
});

test("one guide is featured with an accurate synthetic comparison and three other task paths", () => {
  const feature = html.match(/<article class="featured-guide"[\s\S]*?<\/article>/)[0];
  assert.equal((html.match(/class="featured-guide"/g) || []).length, 1);
  assert.match(feature, /href="\.\/data-guides\/excel-leading-zeros\.html"/);
  assert.match(feature, /숫자에 표시 서식만 적용/);
  assert.match(feature, /실제 값 <code>123<\/code> · 숫자/);
  assert.match(feature, /실제 값 <code>"00123"<\/code> · 텍스트/);
  assert.match(feature, /합성 예제/);
  assert.match(feature, /실제 Excel 화면은 아닙니다/);
  const others = html.match(/<ol class="guide-start-list"[\s\S]*?<\/ol>/)[0];
  assert.equal((others.match(/<li>/g) || []).length, 3);
  assert.doesNotMatch(others, /excel-leading-zeros/);
  assert.doesNotMatch(feature, /iframe|onclick|data-demo-mode|\shidden(?:\s|=|>)/);
});

test("available projects come first in DOM order and paused work stays visible as a separate record", () => {
  const grid = html.match(/<div class="project-grid">([\s\S]*?)<div class="project-archive">/)[1];
  assert.deepEqual([...grid.matchAll(/<article class="project-card[^>]*id="([^"]+)"/g)].map(m => m[1]), ["project-csv", "project-interview", "project-bampang"]);
  const archive = html.match(/<div class="project-archive">[\s\S]*?<\/article>/)[0];
  assert.match(archive, /id="project-image"/);
  assert.match(archive, /수익을 만들지 못했고/);
  assert.match(archive, /활동 중단/);
  assert.match(archive, /deep-constellation-retrospective\.html/);
  assert.doesNotMatch(archive, /<details|\shidden\b/);
  assert.ok(html.indexOf(archive) > html.indexOf('id="project-bampang"'));
  assert.doesNotMatch(css, /\.project-card[^{}]*\{[^}]*\border\s*:/);
});

test("ad preparation is an inert template, not a blank visible box or an advertising request", () => {
  const template = html.match(/<template id="home-ad-template" data-ad-state="disabled">[\s\S]*?<\/template>/)[0];
  assert.match(template, /aria-labelledby="home-ad-label"/);
  assert.match(template, />광고<\/p>/);
  assert.match(template, /<div class="home-ad-container"><\/div>/);
  assert.doesNotMatch(template, /<script|<ins|src=|data-ad-(?:client|slot)=|adsbygoogle|pagead2/);
  assert.doesNotMatch(html.replace(template, ""), /class="home-ad-slot"|class="home-ad-container"/);
  assert.ok(html.indexOf(template) > html.indexOf('id="fieldnotes"'));
  assert.ok(html.indexOf(template) < html.indexOf('id="collection"'));
  assert.doesNotMatch(read("script.js") + read("experiences.js"), /home-ad-template|adsbygoogle|pagead2/);
});

test("homepage-only styles and article publication dates remain independent", () => {
  assert.match(html, /<body class="home">/);
  assert.match(html, /href="\.\/home\.css\?v=20261020-editorial"/);
  assert.match(css, /\.home \.intro-description\s*\{ font-size: 15px;/);
  assert.match(css, /\.home \.resource-copy > span\s*\{ font-size: 15px;/);
  assert.match(css, /@media \(max-width: 580px\)/);
  assert.match(css, /\.home \.main-nav a\s*\{[^}]*flex-shrink: 0/);
  for (const slug of ["csv-one-column", "excel-leading-zeros", "power-query-merge-rows", "excel-filter-spill"]) {
    assert.doesNotMatch(read(`data-guides/${slug}.html`), /home\.css/);
  }
  assert.match(read("sitemap.xml"), /<loc>https:\/\/jhsoftlabs\.com\/<\/loc><lastmod>2026-10-20<\/lastmod>/);
});
