import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const journal = read("stories/index.html");
const home = read("index.html");
const sitemap = read("sitemap.xml");
const schema = (source) => JSON.parse(source.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
const added = ["ai-answer-fidelity", "guest-trial-funnel", "shorts-release-pipeline", "homepage-information-order"];
const articleFiles = readdirSync(new URL("../stories/", import.meta.url)).filter((name) => name.endsWith(".html") && name !== "index.html");

test("journal links every published article once in project groups matching structured data", () => {
  const links = [...journal.matchAll(/class="journal-entry" href="\.\/([^"]+)"/g)].map((m) => m[1]);
  assert.equal(links.length, 9);
  assert.equal(new Set(links).size, 9);
  assert.deepEqual([...links].sort(), [...articleFiles].sort());
  const data = schema(journal);
  assert.equal(data["@type"], "CollectionPage");
  assert.equal(data.mainEntity.numberOfItems, links.length);
  data.mainEntity.itemListElement.forEach((item, index) => {
    assert.equal(item.position, index + 1);
    assert.equal(item.url, `https://jhsoftlabs.com/stories/${links[index]}`);
    assert.equal(item.name, schema(read(`stories/${links[index]}`)).headline);
  });
  const groups = [...journal.matchAll(/<section class="journal-group" id="([^"]+)"[\s\S]*?<\/section>/g)];
  assert.deepEqual(groups.map((g) => (g[0].match(/class="journal-entry"/g) || []).length), [3, 2, 3, 1]);
  groups.forEach((group) => assert.ok(journal.includes(`href="#${group[1]}"`)));
  assert.ok(home.includes('class="fieldnotes-all" href="./stories/"'));
});

test("journal and each article have a return path, unique metadata and valid sitemap entries", () => {
  const headlines = new Set();
  articleFiles.forEach((file) => {
    const source = read(`stories/${file}`);
    const data = schema(source);
    headlines.add(data.headline);
    assert.ok(source.includes('href="./">개발기록 전체 보기'));
    assert.ok(journal.includes(`href="./${file}"`));
    assert.ok(home.includes(`href="./stories/${file}"`));
  });
  assert.equal(headlines.size, articleFiles.length);
  for (const slug of added) {
    const source = read(`stories/${slug}.html`);
    const data = schema(source);
    const url = `https://jhsoftlabs.com/stories/${slug}.html`;
    assert.equal(data["@type"], "BlogPosting");
    assert.equal(data.mainEntityOfPage, url);
    assert.equal(data.author.name, "회몬");
    assert.equal(data.datePublished, "2026-09-13");
    assert.ok(source.includes(`<h1>${data.headline}</h1>`));
    assert.ok(source.includes(`property="og:title" content="${data.headline}"`));
    assert.ok(source.includes(`name="twitter:title" content="${data.headline}"`));
    assert.ok(source.includes(`rel="canonical" href="${url}"`));
    assert.ok(sitemap.includes(`<loc>${url}</loc>`));
    assert.match(source, /<aside class="note-summary"/);
    assert.match(source, /aria-label="이 글의 목차"/);
  }
  assert.match(journal, /rel="canonical" href="https:\/\/jhsoftlabs.com\/stories\/"/);
  assert.ok(sitemap.includes("<loc>https://jhsoftlabs.com/stories/</loc>"));
  assert.match(sitemap, /^<\?xml[^>]+>\s*<urlset[^>]+>(?:\s*<url><loc>https:\/\/[^<]+<\/loc><lastmod>\d{4}-\d{2}-\d{2}<\/lastmod><\/url>)+\s*<\/urlset>\s*$/);
});

test("new editorial pages add no application state, embeds or user inputs", () => {
  for (const source of [journal, ...added.map((slug) => read(`stories/${slug}.html`))]) {
    assert.doesNotMatch(source, /<(?:iframe|video|form|input|textarea)\b/);
    assert.doesNotMatch(source, /localStorage|sessionStorage|innerHTML|fetch\(/);
    const scripts = [...source.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]);
    assert.deepEqual(scripts, ["/_vercel/insights/script.js", "/_vercel/speed-insights/script.js"]);
  }
});

test("public articles exclude private paths and preserve specific evidence limitations", () => {
  for (const source of [journal, ...articleFiles.map((file) => read(`stories/${file}`))]) {
    assert.doesNotMatch(source, /[CD]:[\\/]|threadId|rolloutOrdinal|dpl_[a-zA-Z0-9]|prj_[a-zA-Z0-9]|service_role|request_token|career-pack|deep-constellation-private|DM-DRAFTS|TARGETS-2026|\uFFFD/);
  }
  const fidelity = read("stories/ai-answer-fidelity.html");
  assert.match(fidelity, /설명용 합성 예시/);
  assert.match(fidelity, /실제 사용자 답변이나 모델 재실행 결과가 아닙니다/);
  assert.match(fidelity, /오탐·미탐/);
  const trial = read("stories/guest-trial-funnel.html");
  assert.match(trial, /분모가 없으면 전환율은 0%가 아니라 판단 불가/);
  assert.match(trial, /완료 성과에 포함하지 않았습니다/);
  const video = read("stories/shorts-release-pipeline.html");
  assert.match(video, /제작 패키지에는 당시의/);
  assert.match(video, /후속 게시 로그에는/);
  assert.match(video, /당시 기록에는 성과 측정이 없었습니다/);
  assert.match(video, /별도로 만든 캠페인 영상의 미게시 상태/);
  const homepage = read("stories/homepage-information-order.html");
  assert.match(homepage, /실제 파일 저장과 OS 클립보드 전달을 확정하지 못했습니다/);
  assert.match(homepage, /API 없이 텍스트를 직접 선택/);
  assert.ok(read(".gitignore").split(/\r?\n/).includes("docs/development-records-sources-2026-09-13.md"));
  assert.ok(read(".vercelignore").split(/\r?\n/).includes("docs"));
});
