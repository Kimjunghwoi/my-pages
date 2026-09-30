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
    assert.match(source, new RegExp(`rel="canonical"\\s+href="${url.replaceAll(".", "\\.")}"`));
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

test("Korean guide samples reproduce the stated results", () => {
  const semicolon = read("data-guides/semicolon-example.csv").trim().split(/\r?\n/);
  assert.deepEqual(semicolon, ["sku;description;price", '00123;"Mug, blue";12.50', '00456;"Plate; small";8.00']);

  const identifiers = read("data-guides/identifier-example.csv").trim().split(/\r?\n/).slice(1);
  assert.deepEqual(identifiers.map((row) => row.split(",")[0]), ["00123", "00007", "A-004"]);

  const sales = read("data-guides/sales-example.csv").trim().split(/\r?\n/).slice(1).map((row) => row.split(","));
  const addresses = read("data-guides/addresses-example.csv").trim().split(/\r?\n/).slice(1).map((row) => row.split(","));
  assert.equal(sales.reduce((sum, row) => sum + Number(row[2]), 0), 42);
  assert.deepEqual(sales.map((sale) => addresses.filter((address) => address[1] === sale[1]).length), [2, 2, 1, 0]);
  const expanded = sales.flatMap((sale) => {
    const matches = addresses.filter((address) => address[1] === sale[1]);
    return (matches.length ? matches : [null]).map(() => Number(sale[2]));
  });
  assert.equal(expanded.length, 6);
  assert.equal(expanded.reduce((sum, amount) => sum + amount, 0), 72);

  const selected = read("data-guides/sales-address-example.csv").trim().split(/\r?\n/).slice(1).map((row) => row.split(","));
  const corrected = selected.flatMap((sale) => {
    const matches = addresses.filter((address) => address[1] === sale[1] && address[0] === sale[2]);
    return (matches.length ? matches : [null]).map((address) => ({ id: sale[0], city: address?.[2] ?? null, amount: Number(sale[3]) }));
  });
  assert.deepEqual(corrected.map((row) => row.id), ["S1", "S2", "S3", "S4"]);
  assert.deepEqual(corrected.map((row) => row.city), ["Seoul", "Busan", "Incheon", null]);
  assert.equal(corrected.reduce((sum, row) => sum + row.amount, 0), 42);

  const filter = read("data-guides/filter-example.tsv").trim().split(/\r?\n/).slice(1).map((row) => row.split("\t"));
  const north = filter.filter((row) => row[1] === "North");
  assert.deepEqual(north.map((row) => row[0]), ["R1", "R3", "R4"]);
  assert.equal(north.reduce((sum, row) => sum + Number(row[2]), 0), 6);

  for (const [guide, sample] of [
    ["csv-one-column", "semicolon-example.csv"],
    ["excel-leading-zeros", "identifier-example.csv"],
    ["power-query-merge-rows", "sales-example.csv"],
    ["power-query-merge-rows", "addresses-example.csv"],
    ["power-query-merge-rows", "sales-address-example.csv"],
    ["excel-filter-spill", "filter-example.tsv"],
  ]) assert.ok(read(`data-guides/${guide}.html`).includes(`href="./${sample}"`));
});
