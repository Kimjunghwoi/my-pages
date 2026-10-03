import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const home = read("index.html");
const article = read("stories/deep-constellation-retrospective.html");
const slug = "deep-constellation-retrospective.html";

test("paused project is honest about revenue and remains linked as a preserved experiment", () => {
  const card = home.match(/<article class="project-card project-card--image"[\s\S]*?<\/article>/)[0];
  assert.match(card, /활동 중단/);
  assert.match(card, /수익을 만들지 못했고/);
  assert.match(card, /2026\. 10\. 03\./);
  assert.ok(card.includes(`href="./stories/${slug}"`));
  assert.ok(card.includes('href="https://image.jhsoftlabs.com/"'));
  assert.ok(card.includes('href="https://image.jhsoftlabs.com/hair-salon.html#cases"'));
  assert.doesNotMatch(card, /함께합니다|월간 콘텐츠까지|small-dot/);
  assert.doesNotMatch(home, /직접 만들고 운영합니다|직접 운영하는 프로젝트/);
  assert.ok(home.includes('href="https://interview.jhsoftlabs.com/diagnosis"'));
  assert.ok(home.includes('href="https://csv.jhsoftlabs.com/workspace"'));
});

test("retrospective has matching publication metadata and bounded historical claims", () => {
  const data = JSON.parse(article.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(data.datePublished, "2026-10-03");
  assert.equal(data.dateModified, "2026-10-03");
  assert.ok(article.includes(`<h1>${data.headline}</h1>`));
  assert.equal(data.mainEntityOfPage, `https://jhsoftlabs.com/stories/${slug}`);
  assert.match(article, /시장 전체에 수요가 없다는 판정/);
  assert.match(article, /손실 규모를 임의의 숫자로 제시하지 않습니다/);
  assert.match(article, /10월 3일에 다시 조회한 최신 지표가 아닙니다/);
  assert.match(article, /통계적 검증선이 아니라/);
  assert.doesNotMatch(article, /docs\/|MARKET-READINESS|PROMOTION-REVIEW|[CD]:[\\/]|<(?:iframe|form|input)\b/);
  assert.ok(read("sitemap.xml").includes(`<loc>${data.mainEntityOfPage}</loc>`));
});

test("earlier publishing and video records link to the later pause without deleting history", () => {
  for (const file of ["salon-publishing.html", "shorts-release-pipeline.html"]) {
    const source = read(`stories/${file}`);
    assert.match(source, /aria-label="프로젝트 상태 업데이트"/);
    assert.ok(source.includes(`href="./${slug}"`));
    assert.ok(source.includes('"datePublished":"2026-09-13"'));
    assert.ok(source.includes('"dateModified":"2026-10-03"'));
    assert.ok(article.includes(`href="./${file}"`));
  }
});
