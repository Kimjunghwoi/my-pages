import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const page = read("projects/bampang/index.html");

test("game introduction has matching metadata, visible modes and real play links", () => {
  const canonical = "https://jhsoftlabs.com/projects/bampang/";
  const schema = JSON.parse(page.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(schema.url, canonical);
  assert.equal(schema.about["@type"], "VideoGame");
  assert.equal(schema.about.url, "https://bogle-chestnut.vercel.app/");
  assert.ok(page.includes(`rel="canonical" href="${canonical}"`));
  assert.ok(page.includes(`property="og:url" content="${canonical}"`));
  assert.ok(read("sitemap.xml").includes(`<loc>${canonical}</loc>`));
  for (const text of ["밤팡 장터", "60초 밤판", "간식가게", "브라우저에 저장", "2026-10-11", "실제 게임 화면"]) assert.ok(page.includes(text), text);
  assert.doesNotMatch(page, /<iframe|<video|autoplay/);
  assert.deepEqual([...page.matchAll(/<script[^>]*src="([^"]+)"/g)].map(match => match[1]), ["../../sharing.js"]);
  assert.ok(page.includes('href="../../#projects"'));
  assert.ok(page.includes('href="https://bogle-chestnut.vercel.app/privacy.html"'));
});

test("game artwork is local, sized, script-free and is not described as a screenshot", () => {
  const asset = read("assets/bampang-chestnut.svg");
  assert.match(asset, /viewBox="0 0 100 100"/);
  assert.doesNotMatch(asset, /<script|<foreignObject|href=|onload=/);
  assert.match(page, /<img[^>]*width="100"[^>]*height="100"[^>]*alt="[^"]+"/);
  assert.ok(page.includes("소개 이미지"));
  const home = read("index.html");
  assert.ok(home.includes('id="project-bampang"'));
  assert.ok(home.includes('href="#project-bampang"'));
  assert.ok(home.includes('href="./projects/bampang/"'));
});
