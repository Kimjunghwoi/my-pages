import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const script = readFileSync(new URL("../script.js", import.meta.url), "utf8");
const attr = (source, name) => source.match(new RegExp(`${name}="([^"]*)"`))?.[1];
const plainText = (source) => source.replace(/<[^>]+>/g, " ");

// A small DOM adapter exercises the real collection script without taking browser focus.
function mount(initial = "https://jhsoftlabs.com/") {
  let focused, url = new URL(initial), position = 0, timerId = 0;
  const history = [url.href], timers = new Map(), documentEvents = {}, windowEvents = {};
  function element(textContent = "", dataset = {}) {
    return {
      textContent, dataset, value: "", hidden: false, attributes: {}, events: {},
      addEventListener(type, handler) { this.events[type] = handler; },
      setAttribute(name, value) { this.attributes[name] = value; },
      focus() { focused = this; },
      scrollIntoView() { this.scrolled = true; },
      closest(selector) { return selector === "[data-filter]" && this.dataset.filter ? this : null; },
    };
  }
  const buttons = [...html.matchAll(/<button([^>]*data-filter="[^"]+"[^>]*)>(.*?)<\/button>/g)]
    .map((m) => element(m[2], { filter: attr(m[1], "data-filter") }));
  const rows = [...html.matchAll(/<a class="resource"([^>]*)>([\s\S]*?)<\/a>/g)]
    .map((m) => element(plainText(m[2]), { category: attr(m[1], "data-category"), keywords: attr(m[1], "data-keywords") }));
  const ids = Object.fromEntries(["collection-search", "filter-bar", "collection-more", "collection-reset", "result-count", "collection-empty", "empty-reset", "collection", "current-year"].map((id) => [id, element()]));
  ids["filter-bar"].querySelectorAll = () => buttons;
  const controls = element();
  controls.hidden = true;
  function write(next, push) {
    url = new URL(next);
    if (push) { history.splice(position + 1); history.push(url.href); position++; }
    else history[position] = url.href;
  }
  const window = {
    get location() { return url; },
    history: {
      pushState: (_state, _title, next) => write(next, true),
      replaceState: (_state, _title, next) => write(next, false),
    },
    addEventListener: (type, handler) => { windowEvents[type] = handler; },
  };
  const document = {
    getElementById: (id) => ids[id],
    querySelectorAll: () => rows,
    querySelector: () => controls,
    addEventListener: (type, handler) => { documentEvents[type] = handler; },
  };
  runInNewContext(script, {
    document, window, URL, URLSearchParams,
    setTimeout: (fn) => { timers.set(++timerId, fn); return timerId; },
    clearTimeout: (id) => timers.delete(id),
  });
  return {
    ids, rows, buttons, controls,
    get url() { return url; },
    get focused() { return focused; },
    visible: () => rows.filter((row) => !row.hidden),
    filter(value) { ids["filter-bar"].events.click({ target: buttons.find((button) => button.dataset.filter === value) }); },
    search(value) { ids["collection-search"].value = value; ids["collection-search"].events.input(); },
    flush() { const jobs = [...timers.values()]; timers.clear(); jobs.forEach((job) => job()); },
    click(id) { ids[id].events.click(); },
    escape() { ids["collection-search"].events.keydown({ key: "Escape", preventDefault() {} }); },
    back() { if (position > 0) { url = new URL(history[--position]); windowEvents.popstate(); } },
    forward() { if (position + 1 < history.length) { url = new URL(history[++position]); windowEvents.popstate(); } },
    key(event) { documentEvents.keydown({ preventDefault() {}, target: element(), ...event }); },
  };
}

test("initial collection shows six of thirty-two, expands all, and focuses the first newly revealed row", () => {
  const ui = mount();
  assert.equal(ui.controls.hidden, false);
  assert.equal(ui.visible().length, 6);
  assert.match(ui.ids["result-count"].textContent, /전체 32개/);
  ui.click("collection-more");
  assert.equal(ui.visible().length, 32);
  assert.equal(ui.focused, ui.rows[6]);
  assert.equal(ui.ids["collection-more"].attributes["aria-expanded"], "true");
  ui.click("collection-more");
  assert.equal(ui.visible().length, 6);
  assert.equal(ui.ids["collection-more"].scrolled, true);
});

test("project filter keeps exactly three services while data also includes the build note", () => {
  const ui = mount();
  ui.filter("project");
  assert.equal(ui.visible().length, 3);
  assert.equal(ui.url.searchParams.get("tab"), "project");
  ui.filter("data");
  assert.equal(ui.visible().length, 6);
  assert.ok(ui.visible().some((row) => row.textContent.includes("만든 이야기")));
  assert.equal(ui.buttons.filter((button) => button.attributes["aria-pressed"] === "true").length, 1);
});

test("normalized multi-term search finds the build note and escapes clear only the query", () => {
  const ui = mount();
  ui.filter("data");
  ui.search("ＣＳＶ   원본");
  assert.equal(ui.visible().length, 1);
  assert.match(ui.visible()[0].textContent, /숫자로 바꾸기 전에/);
  ui.flush();
  assert.equal(ui.url.searchParams.get("q"), "ＣＳＶ   원본");
  ui.escape();
  assert.equal(ui.url.searchParams.get("q"), null);
  assert.equal(ui.url.searchParams.get("tab"), "data");
  assert.equal(ui.visible().length, 6);
});

test("empty-state reset clears filters, query and pending search writes", () => {
  const ui = mount();
  ui.filter("interview");
  ui.search("zzzzmissing");
  assert.equal(ui.visible().length, 0);
  assert.equal(ui.ids["collection-empty"].hidden, false);
  ui.click("empty-reset");
  ui.flush();
  assert.equal(ui.visible().length, 6);
  assert.equal(ui.url.search, "");
  assert.equal(ui.focused, ui.ids["collection-search"]);
});

test("filter history restores query, selected filter and collapsed results", () => {
  const ui = mount();
  ui.filter("data");
  ui.filter("ai-side");
  ui.back();
  assert.equal(ui.url.searchParams.get("tab"), "data");
  assert.match(ui.ids["result-count"].textContent, /^데이터 실무/);
  ui.forward();
  assert.equal(ui.url.searchParams.get("tab"), "ai-side");
  assert.match(ui.ids["result-count"].textContent, /^AI·부업/);
});

test("shared URL restores query and unknown filters safely fall back to all", () => {
  const ui = mount("https://jhsoftlabs.com/?tab=data&q=CSV%20%EC%9B%90%EB%B3%B8#collection");
  assert.equal(ui.visible().length, 1);
  assert.equal(ui.ids["collection-search"].value, "CSV 원본");
  const invalid = mount("https://jhsoftlabs.com/?tab=missing");
  assert.match(invalid.ids["result-count"].textContent, /^전체 32개/);
});

test("record and template filters expose internal content without adding featured services", () => {
  const ui = mount();
  ui.filter("record");
  assert.equal(ui.visible().length, 6);
  assert.match(ui.ids["result-count"].textContent, /작업 기록 9개/);
  ui.click("collection-more");
  assert.equal(ui.visible().length, 9);
  assert.equal(ui.url.searchParams.get("tab"), "record");
  ui.filter("template");
  assert.equal(ui.visible().length, 4);
  assert.ok(ui.visible().every((row) => row.textContent.includes("무료 양식")));
  ui.filter("project");
  assert.equal(ui.visible().length, 3);
});

test("legacy anchors preserve filters and navigate to the unified library", () => {
  for (const hash of ["archive", "recent-updates", "navigator"]) {
    const ui = mount(`https://jhsoftlabs.com/?tab=data#${hash}`);
    assert.equal(ui.url.hash, "#collection");
    assert.equal(ui.url.searchParams.get("tab"), "data");
    assert.equal(ui.ids.collection.scrolled, true);
  }
});

test("new development records are searchable by their specific engineering topics", () => {
  for (const [query, title] of [
    ["초안 환각", "AI가 내 경험을 대신 지어내지 않도록"],
    ["로그인 분모", "로그인을 없앤 다음에도"],
    ["쇼츠 디코딩", "24초 영상에도"],
    ["정보 구조", "색을 바꿔도 같아 보이던"],
  ]) {
    const ui = mount();
    ui.filter("record");
    ui.search(query);
    ui.flush();
    assert.equal(ui.visible().length, 1, query);
    assert.ok(ui.visible()[0].textContent.includes(title));
    assert.equal(ui.url.searchParams.get("tab"), "record");
    assert.equal(ui.url.searchParams.get("q"), query);
  }
});

test("search shortcut leaves editing and modified key combinations alone", () => {
  const ui = mount();
  ui.key({ key: "/", ctrlKey: true });
  ui.key({ key: "/", isComposing: true });
  ui.key({ key: "/", target: { closest: () => ({}) } });
  assert.equal(ui.focused, undefined);
  ui.key({ key: "/" });
  assert.equal(ui.focused, ui.ids["collection-search"]);
});
