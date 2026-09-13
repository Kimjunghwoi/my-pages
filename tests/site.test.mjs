import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(resolve(root, "index.html"), "utf8");
const attributes = (text) => Object.fromEntries([...text.matchAll(/([\w-]+)="([^"]*)"/g)].map((match) => [match[1], match[2]]));
const anchors = [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].map((match) => ({ ...attributes(match[1]), content: match[2] }));
const resources = anchors.filter((anchor) => anchor.class === "resource");
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
const projectHosts = ["interview.jhsoftlabs.com", "image.jhsoftlabs.com", "csv.jhsoftlabs.com"];

test("exactly three featured projects, each linked to its own service", () => {
  const cards = [...html.matchAll(/<article class="project-card[^>]*>([\s\S]*?)<\/article>/g)];
  assert.equal(cards.length, 3);
  cards.forEach((card, index) => {
    const urls = [...card[1].matchAll(/href="(https:[^"]+)"/g)].map((match) => new URL(match[1]));
    assert.equal(urls.length, 2);
    assert.ok(urls.every((url) => url.hostname === projectHosts[index]));
  });
});

test("library preserves seven Notion pages, adds four guides, and has no duplicate destinations", () => {
  assert.equal(resources.length, 19);
  assert.equal(new Set(resources.map((item) => item.href)).size, resources.length);
  assert.equal(resources.filter((item) => new URL(item.href).hostname.endsWith("notion.site")).length, 7);
  assert.equal(resources.filter((item) => item.href.startsWith("https://csv.jhsoftlabs.com/guides/")).length, 4);
});

test("every topic has a matching accessible filter", () => {
  const filters = [...html.matchAll(/<button[^>]*data-filter="([^"]+)"[^>]*>/g)];
  const categories = new Set(filters.map((match) => match[1]));
  assert.equal(filters.length, categories.size);
  assert.ok(categories.has("all"));
  assert.ok(categories.has("data"));
  for (const resource of resources) {
    assert.ok(resource["data-category"].split(" ").every((category) => categories.has(category)));
  }
  assert.equal(filters.filter((match) => match[0].includes('aria-pressed="true"')).length, 1);
});

test("external links use HTTPS and safe new-tab attributes", () => {
  for (const anchor of anchors.filter((item) => !item.href.startsWith("#"))) {
    assert.equal(new URL(anchor.href).protocol, "https:");
    assert.equal(anchor.target, "_blank");
    assert.ok(anchor.rel.includes("noopener") && anchor.rel.includes("noreferrer"));
  }
});

test("in-page navigation and ARIA references resolve to unique IDs", () => {
  assert.equal(new Set(ids).size, ids.length);
  anchors.filter((item) => item.href.startsWith("#")).forEach((item) => assert.ok(ids.includes(item.href.slice(1))));
  for (const match of html.matchAll(/aria-(?:controls|labelledby)="([^"]+)"/g)) {
    match[1].split(" ").forEach((id) => assert.ok(ids.includes(id)));
  }
});

test("local assets exist and images have accessible descriptions and intrinsic dimensions", () => {
  const localFiles = [...html.matchAll(/(?:src|href)="(\.\/[^"?#]+)"/g)].map((match) => match[1]);
  localFiles.forEach((path) => assert.ok(existsSync(resolve(root, path)), path));
  for (const match of html.matchAll(/<img\b([^>]*)>/g)) {
    const image = attributes(match[1]);
    assert.ok(image.alt.length > 0);
    assert.ok(Number(image.width) > 0 && Number(image.height) > 0);
  }
  for (const name of ["salon-opening.webp", "salon-season.webp"]) {
    assert.ok(readFileSync(resolve(root, "assets", name)).length < 100_000);
  }
});

test("social sharing uses a valid 1200 by 630 PNG and a canonical main domain", () => {
  const png = readFileSync(resolve(root, "assets/og-card.png"));
  assert.equal(png.subarray(1, 4).toString(), "PNG");
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
  assert.ok(html.includes('rel="canonical" href="https://jhsoftlabs.com/"'));
  assert.ok(html.includes('property="og:image" content="https://jhsoftlabs.com/assets/og-card.png"'));
});

test("AdSense ownership and Vercel telemetry integrations are preserved", () => {
  assert.ok(html.includes('name="google-adsense-account" content="ca-pub-6113316314236430"'));
  assert.ok(readFileSync(resolve(root, "ads.txt"), "utf8").includes("pub-6113316314236430"));
  assert.ok(html.includes('/_vercel/insights/script.js'));
  assert.ok(html.includes('/_vercel/speed-insights/script.js'));
});

test("content is available without JavaScript and retired project URLs are absent", () => {
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.ok(html.includes('<html lang="ko">'));
  assert.ok(html.includes("<noscript>"));
  assert.ok(!html.includes("deep-constellation.netlify.app"));
  assert.ok(!html.includes("\uFFFD"));
  assert.ok(!readFileSync(resolve(root, "script.js"), "utf8").includes("innerHTML"));
});
