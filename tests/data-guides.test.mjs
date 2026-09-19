import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const slugs = ["csv-one-column", "excel-leading-zeros", "power-query-merge-rows", "excel-filter-spill"];
const home = read("index.html");
const hub = read("data-guides/index.html");
const sitemap = read("sitemap.xml");
const schema = (source) => JSON.parse(source.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);

test("data guide hub and four articles are substantial, discoverable static content", () => {
  assert.equal(schema(hub).mainEntity.numberOfItems, 4);
  assert.match(home, /href="\.\/data-guides\/"/);
  assert.match(sitemap, /<loc>https:\/\/jhsoftlabs\.com\/data-guides\/<\/loc>/);
  for (const slug of slugs) {
    const source = read(`data-guides/${slug}.html`);
    const text = source.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    const data = schema(source);
    const url = `https://jhsoftlabs.com/data-guides/${slug}.html`;
    assert.equal(data["@type"], "TechArticle");
    assert.equal(data.mainEntityOfPage, url);
    assert.equal(data.datePublished, "2026-09-19");
    assert.ok(text.length > 1800, `${slug}: thin article`);
    assert.match(source, new RegExp(`rel="canonical" href="${url.replaceAll(".", "\\.")}"`));
    assert.match(source, /합성|예제/);
    assert.match(source, /https:\/\/csv\.jhsoftlabs\.com\/guides\//);
    assert.ok(home.includes(`href="./data-guides/${slug}.html"`));
    assert.ok(hub.includes(`href="./${slug}.html"`));
    assert.ok(sitemap.includes(`<loc>${url}</loc>`));
    assert.doesNotMatch(source, /<input|<form|localStorage|sessionStorage|fetch\s*\(/i);
  }
});

test("hub structured list matches article metadata and routes", () => {
  const items = schema(hub).mainEntity.itemListElement;
  assert.deepEqual(items.map((item) => item.position), [1, 2, 3, 4]);
  items.forEach((item, index) => {
    const slug = slugs[index];
    const article = schema(read(`data-guides/${slug}.html`));
    assert.equal(item.name, article.headline);
    assert.equal(item.url, article.mainEntityOfPage);
  });
});
