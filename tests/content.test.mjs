import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const stories = ["salon-publishing", "guides-that-work", "ai-retry-safety"];
const templates = ["content-release", "guide-quality", "ai-release"];
const home = read("index.html"), hub = read("templates/index.html"), sitemap = read("sitemap.xml");
const decode = (text) => text.replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&amp;", "&");

test("each experiment has visible provenance, distinct metadata and its matching template", () => {
  stories.forEach((slug, index) => {
    const source = read(`stories/${slug}.html`);
    const url = `https://jhsoftlabs.com/stories/${slug}.html`;
    assert.ok(source.includes(`rel="canonical" href="${url}"`));
    assert.ok(source.includes(`property="og:url" content="${url}"`));
    const schema = JSON.parse(source.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    assert.equal(schema.mainEntityOfPage, url);
    assert.equal(schema.author.name, "회몬");
    assert.equal(schema.datePublished, "2026-09-13");
    assert.ok(source.includes(`<h1>${schema.headline}</h1>`));
    assert.ok(source.includes(`../templates/#${templates[index]}`));
    assert.ok(source.includes("대화를 바탕으로"));
    assert.ok(home.includes(`href="./stories/${slug}.html"`));
    assert.ok(sitemap.includes(`<loc>${url}</loc>`));
    assert.ok(!source.includes('src="../script.js"'));
  });
});

test("downloadable templates and full no-JS previews are identical", () => {
  const previews = [...hub.matchAll(/<pre>([\s\S]*?)<\/pre>/g)];
  assert.equal(previews.length, 3);
  assert.equal((hub.match(/<details class="template-preview">/g) || []).length, 3);
  assert.ok(!/<(?:input|textarea|form)\b/.test(hub));
  templates.forEach((slug, index) => {
    const content = read(`templates/${slug}.md`);
    assert.equal(decode(previews[index][1]), content);
    assert.ok(hub.includes(`href="./${slug}.md" download="${slug}.md"`));
    assert.ok(hub.includes(`href="../stories/${stories[index]}.html"`));
    assert.ok(home.includes(`href="./templates/#${slug}"`));
    assert.ok(content.includes("공개용"));
    assert.ok(content.includes("미확인"));
    assert.ok((content.match(/- \[ \]/g) || []).length >= 8);
  });
  assert.ok(sitemap.includes("<loc>https://jhsoftlabs.com/templates/</loc>"));
});

test("public content excludes private source identifiers and separates observation from outcomes", () => {
  const sources = [...stories.map((slug) => read(`stories/${slug}.html`)), ...templates.map((slug) => read(`templates/${slug}.md`)), hub];
  sources.forEach((source) => {
    assert.ok(!/[CD]:[\\/]|threadId|rolloutOrdinal|dpl_[a-zA-Z0-9]|prj_[a-zA-Z0-9]|service_role|request_token/.test(source));
    assert.ok(!source.includes("\uFFFD"));
  });
  assert.ok(read("stories/salon-publishing.html").includes("고객 확보 성공기"));
  assert.ok(read("stories/guides-that-work.html").includes("현재 누적 수치나 검색·매출 성과를 뜻하지 않습니다"));
  assert.ok(read("stories/ai-retry-safety.html").includes("실제 사용자에게 같은 사고가 발생했다고 확인한 기록은 아닙니다"));
  const ignore = read(".vercelignore");
  assert.ok(ignore.split(/\r?\n/).includes("docs"));
  assert.ok(read(".gitignore").split(/\r?\n/).includes("docs/fieldnotes-sources-2026-09-13.md"));
});

test("featured project section stays above the compact three-entry field notes", () => {
  assert.ok(home.indexOf('id="projects"') < home.indexOf('id="fieldnotes"'));
  assert.ok(home.indexOf('id="fieldnotes"') < home.indexOf('id="collection"'));
  const section = home.match(/<section class="fieldnotes[\s\S]*?<\/section>/)[0];
  assert.equal((section.match(/<li>/g) || []).length, 3);
  assert.ok(section.includes('href="./templates/"'));
});
