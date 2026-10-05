import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const illustrations = [
  ["data-guides/power-query-merge-rows.html", "guide-merge-multiplication", 820],
  ["data-guides/excel-leading-zeros.html", "guide-display-vs-value", 720],
  ["stories/ai-retry-safety.html", "story-retry-boundary", 860],
];

test("editorial diagrams are local, accessible and explicitly not screenshots", () => {
  for (const [page, name, height] of illustrations) {
    const html = read(page), svg = read(`assets/${name}.svg`);
    const image = html.match(new RegExp(`<img src="\\.\\./assets/${name}\\.svg"[^>]+>`))?.[0];
    assert.ok(image, page);
    assert.match(image, /alt="[^"]{30,}"/);
    assert.match(image, /loading="lazy" decoding="async"/);
    assert.ok(image.includes(`width="640" height="${height}"`));
    assert.ok(svg.includes(`viewBox="0 0 640 ${height}"`));
    assert.match(svg, /<title id="title">[^<]+<\/title>/);
    assert.match(svg, /<desc id="desc">[^<]+<\/desc>/);
    assert.doesNotMatch(svg, /<script|<foreignObject|<image|\son\w+=|(?:href|url\()=["']?https?:/i);
    assert.match(html, /설명 이미지|학습 모델의 설명/);
    assert.match(html, /이미지 크게 보기/);
  }
});

test("diagram values match the verified learning examples", () => {
  const merge = read("assets/guide-merge-multiplication.svg");
  assert.match(merge, /4행 · 42 → 6행 · 72/);
  for (const label of ["S1 · A1 · 10", "S1 · A2 · 10", "S2 · A1 · 20", "S2 · A2 · 20"]) assert.ok(merge.includes(label));
  const display = read("assets/guide-display-vs-value.svg");
  assert.match(display, /내부 값: 123/);
  assert.match(display, /내부 값: 00123/);
  assert.match(display, /ISTEXT: FALSE/);
  assert.match(display, /ISTEXT: TRUE/);
  const retry = read("assets/story-retry-boundary.svg");
  assert.match(retry, /아직 결과 0건 · 횟수 1회 유지/);
  assert.match(retry, /기존 결과 반환: 추가 차감 없음/);
});

test("the self-hosted video is the unchanged archived silent edition with a text alternative", () => {
  const bytes = readFileSync(new URL("../assets/deep-constellation-promo-muted.mp4", import.meta.url));
  assert.equal(bytes.length, 6877083);
  assert.equal(createHash("sha256").update(bytes).digest("hex"), "2d7730fa5abdb1855dee1feb8cd96c394a2bf15c2edd035a6308b7134daac97a");
  const html = read("stories/shorts-release-pipeline.html");
  assert.equal((html.match(/<video\b/g) || []).length, 1);
  assert.match(html, /preload="none"/);
  assert.match(html, /poster="\.\.\/assets\/salon-season.webp"/);
  assert.match(html, /aria-describedby="video-caption video-status"/);
  assert.match(html, /활동 중단 전의 제작 기록/);
  assert.match(html, /영상 대신 읽는 장면 설명/);
  for (const time of ["0:00", "0:03", "0:05.5", "0:08.5", "0:11.5", "0:14.5", "0:18.5"]) assert.ok(html.includes(time));
  assert.doesNotMatch(html, /<iframe|youtube-nocookie|\sautoplay(?:\s|=|>)/);
});
