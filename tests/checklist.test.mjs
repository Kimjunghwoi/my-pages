import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const html = read("tools/release-check/index.html");
const source = read("tools/release-check/checklist.js");
const story = read("stories/excel-native-checks.html");
const attr = (text, name) => text.match(new RegExp(`${name}="([^"]*)"`))?.[1];

// Exercise the shipped script with HTML-derived items; browser rendering is checked separately.
function mount({ kind = "", copyFails = false, downloadFails = false, restoredValue = "unknown" } = {}) {
  let location = new URL(`https://jhsoftlabs.com/tools/release-check/${kind ? `?kind=${kind}` : ""}`);
  let focused, copied, downloaded, createdBlob, removed = false;
  const timers = [], revoked = [];
  const element = (textContent = "", dataset = {}) => ({
    textContent, dataset, value: "unknown", hidden: false, open: false, disabled: false, events: {}, attributes: {},
    addEventListener(type, handler) { this.events[type] = handler; },
    setAttribute(name, value) { this.attributes[name] = value; },
    focus() { focused = this; },
    select() { this.selected = true; },
  });
  const panels = [...html.matchAll(/<section[^>]*data-check-panel="([^"]+)"[^>]*>([\s\S]*?)<\/section>/g)].map((match) => {
    const panel = element("", { checkPanel: match[1] });
    panel.title = match[2].match(/<h2[^>]*>([^<]+)<\/h2>/)[1];
    panel.rows = [...match[2].matchAll(/<li data-check-item="([^"]+)">([\s\S]*?)<\/li>/g)].map((rowMatch) => {
      const row = element("", { checkItem: rowMatch[1] });
      const title = rowMatch[2].match(/<h3>([^<]+)<\/h3>/)[1];
      const detail = rowMatch[2].match(/<p[^>]*>([^<]+)<\/p>/)[1];
      row.select = element();
      row.select.value = restoredValue;
      row.querySelector = (selector) => selector === "h3" ? element(title) : selector === ".check-copy p" ? element(detail) : row.select;
      return row;
    });
    panel.querySelector = () => element(panel.title);
    panel.querySelectorAll = () => panel.rows;
    return panel;
  });
  const buttons = panels.map((panel) => element(panel.title, { checkKind: panel.dataset.checkPanel }));
  const ids = Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => [match[1], element()]));
  ids["check-panels"].querySelectorAll = () => panels;
  const controls = [element(), element()];
  controls.forEach((control) => { control.hidden = true; });
  class PageURL extends URL {
    static createObjectURL(blob) { if (downloadFails) throw Error("unavailable"); createdBlob = blob; return "blob:local-test"; }
    static revokeObjectURL(url) { revoked.push(url); }
  }
  const document = {
    getElementById: (id) => ids[id],
    querySelectorAll: (selector) => selector === "[data-check-kind]" ? buttons : controls,
    body: { append() {} },
    createElement() { return { click() { downloaded = { href: this.href, name: this.download }; }, remove() { removed = true; } }; },
  };
  runInNewContext(source, {
    document, URL: PageURL, URLSearchParams, Blob,
    window: { get location() { return location; }, history: { replaceState: (_state, _title, url) => { location = new URL(url); } } },
    navigator: { clipboard: { async writeText(text) { if (copyFails) throw Error("denied"); copied = text; } } },
    setTimeout: (callback) => { timers.push(callback); },
  });
  return {
    panels, buttons, ids, controls, revoked,
    get location() { return location; }, get focused() { return focused; }, get copied() { return copied; },
    get downloaded() { return downloaded; }, get blob() { return createdBlob; }, get removed() { return removed; },
    select(kind, index, value) { const select = panels.find((panel) => panel.dataset.checkPanel === kind).rows[index].select; select.value = value; select.events.change(); },
    mode(kind) { buttons.find((button) => button.dataset.checkKind === kind).events.click(); },
    click(id) { return ids[id].events.click(); },
    flush() { timers.forEach((callback) => callback()); },
  };
}

test("three fixed checklists each expose six unique, labelled questions without JavaScript", () => {
  const ui = mount();
  assert.equal(ui.panels.length, 3);
  assert.ok(ui.panels.every((panel) => panel.rows.length === 6));
  const ids = ui.panels.flatMap((panel) => panel.rows.map((row) => row.dataset.checkItem));
  assert.equal(new Set(ids).size, 18);
  assert.equal((html.match(/<select\b/g) || []).length, 18);
  assert.equal((html.match(/data-status-control hidden/g) || []).length, 18);
  assert.ok([...html.matchAll(/<section[^>]*data-check-panel[^>]*>/g)].every((match) => !match[0].includes("hidden")));
  assert.match(html, /<noscript>/);
  assert.ok(ui.controls.every((control) => !control.hidden));
});

test("only an allowed query selects a checklist and defaults stay unverified", () => {
  const guide = mount({ kind: "guide" });
  assert.deepEqual(guide.panels.map((panel) => panel.hidden), [true, true, false]);
  assert.match(guide.ids["check-progress"].textContent, /실무 가이드 · 0\/6개/);
  assert.equal(guide.ids["check-reset"].disabled, true);
  const bad = mount({ kind: "__proto__" });
  assert.equal(bad.panels[0].hidden, false);
  assert.equal(bad.ids["count-unknown"].textContent, "6");
});

test("status counts distinguish attention, unverified and not-applicable from passing", () => {
  const ui = mount();
  ui.select("ai", 0, "pass"); ui.select("ai", 1, "recheck"); ui.select("ai", 2, "na");
  assert.equal(ui.ids["check-progress-bar"].value, 3);
  assert.equal(ui.ids["count-pass"].textContent, "1");
  assert.equal(ui.ids["count-recheck"].textContent, "1");
  assert.equal(ui.ids["count-na"].textContent, "1");
  assert.equal(ui.ids["count-unknown"].textContent, "3");
  assert.match(ui.ids["check-progress"].textContent, /재확인 1개/);
  assert.match(ui.ids["check-output-text"].value, /자동 검사·보안 감사·배포 안전의 증명이 아닙니다/);
});

test("mode changes preserve other checklists and never put item states in the URL", () => {
  const ui = mount();
  ui.select("ai", 0, "recheck"); ui.mode("guide"); ui.select("guide", 1, "pass"); ui.mode("ai");
  assert.equal(ui.ids["count-recheck"].textContent, "1");
  assert.equal(ui.location.search, "?kind=ai");
  assert.equal(ui.buttons.filter((button) => button.attributes["aria-pressed"] === "true").length, 1);
  ui.mode("guide");
  assert.equal(ui.ids["count-pass"].textContent, "1");
});

test("reset asks first, cancel preserves choices, and confirmation only clears the current checklist", () => {
  const ui = mount();
  ui.select("ai", 0, "pass"); ui.mode("site"); ui.select("site", 0, "recheck");
  ui.click("check-reset");
  assert.equal(ui.ids["check-confirm"].hidden, false);
  assert.equal(ui.focused, ui.ids["check-reset-cancel"]);
  ui.click("check-reset-cancel");
  assert.equal(ui.ids["count-recheck"].textContent, "1");
  ui.click("check-reset"); ui.click("check-reset-confirm");
  assert.equal(ui.ids["count-unknown"].textContent, "6");
  assert.equal(ui.ids["check-confirm"].hidden, true);
  ui.mode("ai");
  assert.equal(ui.ids["count-pass"].textContent, "1");
});

test("export includes every current question, status and unverified evidence blanks, not other modes", async () => {
  const ui = mount({ kind: "guide" });
  ui.select("guide", 0, "pass");
  await ui.click("check-copy");
  assert.match(ui.copied, /# 작업 점검 기록 · 실무 가이드/);
  assert.equal((ui.copied.match(/^## /gm) || []).length, 6);
  assert.equal((ui.copied.match(/- 상태: 미확인/g) || []).length, 5);
  assert.equal((ui.copied.match(/- 실제 결과 \/ 근거:/g) || []).length, 6);
  assert.doesNotMatch(ui.copied, /같은 요청을 두 번/);
  assert.match(ui.copied, /kind=guide/);
});

test("denied clipboard access reveals selected readonly text instead of discarding the record", async () => {
  const ui = mount({ copyFails: true });
  ui.select("ai", 0, "recheck");
  await ui.click("check-copy");
  assert.equal(ui.ids["check-output"].open, true);
  assert.equal(ui.ids["check-output-text"].selected, true);
  assert.match(ui.ids["check-output-status"].textContent, /직접 복사/);
  assert.match(ui.ids["check-output-text"].value, /- 상태: 재확인 필요/);
});

test("Markdown download uses a temporary object URL and cleans it up after dispatch", async () => {
  const ui = mount({ kind: "site" });
  ui.click("check-download");
  assert.equal(ui.downloaded.name, "work-check-site.md");
  assert.equal(ui.downloaded.href, "blob:local-test");
  assert.match(await ui.blob.text(), /# 작업 점검 기록 · 웹사이트·콘텐츠/);
  assert.equal(ui.removed, true);
  assert.equal(ui.revoked.length, 0);
  ui.flush();
  assert.deepEqual(ui.revoked, ["blob:local-test"]);
});

test("download failure keeps a directly selectable record available", () => {
  const ui = mount({ downloadFails: true });
  ui.click("check-download");
  assert.equal(ui.ids["check-output"].open, true);
  assert.equal(ui.ids["check-output-text"].selected, true);
  assert.match(ui.ids["check-output-status"].textContent, /시작하지 못했습니다/);
});

test("unknown status values fail closed to unverified", () => {
  const ui = mount();
  ui.select("ai", 0, "constructor");
  assert.equal(ui.ids["count-unknown"].textContent, "6");
  assert.equal(ui.panels[0].rows[0].select.value, "unknown");
});

test("fresh page initialization clears browser-restored control values", () => {
  const ui = mount({ restoredValue: "pass" });
  assert.equal(ui.ids["count-unknown"].textContent, "6");
  assert.ok(ui.panels.every((panel) => panel.rows.every((row) => row.select.value === "unknown")));
});

test("manual selection works independently of clipboard and download APIs", () => {
  const ui = mount({ copyFails: true, downloadFails: true });
  ui.select("ai", 1, "recheck");
  ui.click("check-select-text");
  assert.equal(ui.ids["check-output-text"].selected, true);
  assert.equal(ui.ids["check-output"].open, true);
  assert.match(ui.ids["check-output-text"].value, /- 상태: 재확인 필요/);
  assert.match(ui.ids["check-output-status"].textContent, /복사 단축키/);
});

test("checklist state uses neither persistent storage, network transmission nor HTML injection", () => {
  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|sendBeacon|innerHTML|eval\(/);
  assert.match(html, /textarea[^>]*readonly/);
  assert.doesNotMatch(html, /<(?:input|form)\b/);
  assert.doesNotThrow(() => runInNewContext(source, { document: { getElementById: () => null } }));
});

test("new public material has metadata, discovery links and explicit verification boundaries", () => {
  const schema = JSON.parse(story.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(schema.headline, "글자 수는 같았는데, ID는 달라졌다");
  assert.match(story, /<h1>글자 수는 같았는데, ID는 달라졌다<\/h1>/);
  assert.match(story, /Version 16\.0 \/ Build 5569\.0/);
  assert.match(story, /원인은 아직 미해결/);
  assert.match(story, /실제 Excel 화면이 아닙니다/);
  assert.match(story, /tools\/release-check\/\?kind=guide/);
  for (const [page, url] of [[story, schema.mainEntityOfPage], [html, "https://jhsoftlabs.com/tools/release-check/"]]) {
    assert.ok(page.includes(`rel="canonical" href="${url}"`));
    assert.ok(page.includes(`property="og:url" content="${url}"`));
    assert.ok(read("sitemap.xml").includes(`<loc>${url}</loc>`));
    assert.doesNotMatch(page, /[CD]:[\\/]|threadId|dpl_[a-zA-Z0-9]|prj_[a-zA-Z0-9]|service_role|request_token|career-pack/);
  }
  assert.match(read("templates/index.html"), /href="\.\.\/tools\/release-check\/"/);
  assert.match(read("index.html"), /href="\.\/tools\/release-check\/"/);
});
