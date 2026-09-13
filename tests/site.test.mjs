import assert from "node:assert/strict";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(resolve(root, "index.html"), "utf8");
const story = readFileSync(resolve(root, "stories/column-harbor.html"), "utf8");
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

test("library preserves all external resources and adds records and free templates", () => {
  assert.equal(resources.length, 28);
  assert.equal(new Set(resources.map((item) => item.href)).size, resources.length);
  assert.equal(resources.filter((item) => new URL(item.href, "https://jhsoftlabs.com/").hostname.endsWith("notion.site")).length, 7);
  assert.equal(resources.filter((item) => item.href.startsWith("https://csv.jhsoftlabs.com/guides/")).length, 4);
  const local = resources.filter((item) => item.href.startsWith("./"));
  assert.equal(local.length, 9);
  assert.equal(local[0].href, "./stories/column-harbor.html");
  assert.equal(local[0].target, undefined);
  assert.ok(local.every((item) => !item.target));
  assert.equal(resources.filter((item) => item["data-category"].split(" ").includes("project")).length, 3);
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
  for (const anchor of anchors.filter((item) => /^https?:/.test(item.href))) {
    assert.equal(new URL(anchor.href).protocol, "https:");
    assert.equal(anchor.target, "_blank");
    assert.ok(anchor.rel.includes("noopener") && anchor.rel.includes("noreferrer"));
  }
});

test("each project name and purpose precede its visual in reading order", () => {
  for (const card of html.matchAll(/<article class="project-card[^>]*>([\s\S]*?)<\/article>/g)) {
    assert.ok(card[1].indexOf('<div class="project-heading">') < card[1].indexOf('<div class="project-visual'));
    assert.ok(card[1].indexOf('class="project-summary"') < card[1].indexOf('<div class="project-visual'));
  }
});

test("starter paths use native disclosures and keep working without scripts", () => {
  const paths = [...html.matchAll(/<details class="starter-path">([\s\S]*?)<\/details>/g)];
  assert.equal(paths.length, 3);
  paths.forEach((path) => {
    assert.ok(path[1].includes("<summary>"));
    assert.ok(path[1].includes("<ol>"));
    assert.ok((path[1].match(/<li>/g) || []).length >= 2);
  });
});

test("build note has unique metadata and structured data matching its visible content", () => {
  const url = "https://jhsoftlabs.com/stories/column-harbor.html";
  assert.ok(story.includes(`rel="canonical" href="${url}"`));
  assert.ok(story.includes(`property="og:url" content="${url}"`));
  assert.ok(story.includes('property="og:type" content="article"'));
  assert.ok(story.includes('datetime="2026-09-13"'));
  const schema = JSON.parse(story.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(schema.mainEntityOfPage, url);
  assert.equal(schema.author.name, "회몬");
  assert.equal(schema.datePublished, "2026-09-13");
  assert.ok(!story.includes('src="../script.js"'));
  assert.ok(story.includes("자동") && story.includes("경고가 없다고"));
  assert.ok(readFileSync(resolve(root, "sitemap.xml"), "utf8").includes(`<loc>${url}</loc>`));
  assert.ok(readFileSync(resolve(root, "robots.txt"), "utf8").includes("Sitemap: https://jhsoftlabs.com/sitemap.xml"));
});

test("all public HTML documents have valid local destinations, assets, anchors and external link contracts", () => {
  const publicHtml = (directory) => readdirSync(resolve(root, directory), { withFileTypes: true }).flatMap((entry) => {
    const file = `${directory}/${entry.name}`;
    return entry.isDirectory() ? publicHtml(file) : file.endsWith(".html") ? [file] : [];
  });
  const files = ["index.html", ...["stories", "templates", "tools"].flatMap(publicHtml)];
  const documents = new Map(files.map((file) => [file, readFileSync(resolve(root, file), "utf8")]));
  for (const [file, source] of documents) {
    const base = new URL(file === "index.html" ? "/" : `/${file}`, "https://jhsoftlabs.com");
    const documentIds = [...source.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
    assert.equal(new Set(documentIds).size, documentIds.length, file);
    assert.equal((source.match(/<h1\b/g) || []).length, 1, file);
    assert.ok(!source.includes("\uFFFD"), file);
    for (const match of source.matchAll(/aria-(?:controls|labelledby)="([^"]+)"/g)) {
      match[1].split(" ").forEach((id) => assert.ok(documentIds.includes(id), `${file}: ${id}`));
    }
    for (const match of source.matchAll(/<a\b([^>]*)>/g)) {
      const link = attributes(match[1]);
      const url = new URL(link.href, base);
      assert.equal(url.protocol, "https:", link.href);
      if (url.origin !== base.origin) {
        assert.equal(link.target, "_blank", link.href);
        assert.ok(link.rel?.includes("noopener") && link.rel?.includes("noreferrer"), link.href);
        continue;
      }
      const path = url.pathname.endsWith("/") ? `${url.pathname}index.html` : url.pathname;
      assert.ok(existsSync(resolve(root, `.${path}`)), link.href);
      if (url.hash) {
        const destination = readFileSync(resolve(root, `.${path}`), "utf8");
        assert.ok(destination.includes(`id="${url.hash.slice(1)}"`), `${file}: ${link.href}`);
      }
    }
    for (const match of source.matchAll(/(?:src|href)="(\.\.?\/[^"?#]+)"/g)) {
      assert.ok(existsSync(resolve(root, dirname(file), match[1])), `${file}: ${match[1]}`);
    }
    assert.ok(source.includes('/_vercel/insights/script.js'));
    assert.ok(source.includes('/_vercel/speed-insights/script.js'));
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
