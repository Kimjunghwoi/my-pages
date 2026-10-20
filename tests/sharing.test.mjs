import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";

const source = readFileSync(new URL("../sharing.js", import.meta.url), "utf8");
function mount({ canonical = "https://jhsoftlabs.com/data-guides/excel-trim-spaces?private=ignored#sample", clipboard, share, present = true } = {}) {
  const nodes = {};
  for (const key of ["controls", "copy", "select", "native", "fallback", "field", "status"]) nodes[key] = {
    hidden: ["controls", "native", "fallback"].includes(key), value: "", textContent: "", attributes: {}, events: {}, disabled: false,
    addEventListener(type, handler) { this.events[type] = handler; },
    setAttribute(name, value) { this.attributes[name] = value; },
    removeAttribute(name) { delete this.attributes[name]; },
    focus() { this.focused = true; }, select() { this.selected = true; },
    setSelectionRange(start, end) { this.selection = [start, end]; },
  };
  const selectors = {
    "[data-share-controls]": nodes.controls, "[data-copy-link]": nodes.copy,
    "[data-select-url]": nodes.select,
    "[data-native-share]": nodes.native, "[data-share-fallback]": nodes.fallback,
    "[data-share-url]": nodes.field, "[data-share-status]": nodes.status,
  };
  runInNewContext(source, {
    URL, navigator: { clipboard, share },
    document: { title: "공백 실습", querySelector: selector => selector === "[data-reader-actions]" ? (present ? { querySelector: key => selectors[key] } : null) : { getAttribute: () => canonical } },
  });
  return nodes;
}

test("sharing is inert without a reader region or an approved HTTPS canonical", () => {
  for (const options of [{ present: false }, { canonical: "javascript:alert(1)" }, { canonical: "http://jhsoftlabs.com/" }, { canonical: "https://other.example/" }, { canonical: "invalid" }]) {
    const ui = mount(options);
    assert.equal(ui.controls.hidden, true);
    assert.equal(ui.copy.events.click, undefined);
  }
});

test("copy uses only the canonical article URL and preserves no search or fragment state", async () => {
  const values = [];
  const ui = mount({ clipboard: { writeText: async value => values.push(value) } });
  assert.equal(ui.controls.hidden, false);
  assert.equal(ui.native.hidden, true);
  assert.equal(ui.field.readOnly, true);
  assert.equal(values.length, 0);
  await ui.copy.events.click();
  assert.deepEqual(values, ["https://jhsoftlabs.com/data-guides/excel-trim-spaces"]);
  assert.match(ui.status.textContent, /복사했습니다/);
  assert.equal(ui.fallback.hidden, true);
  assert.equal(ui.copy.disabled, false);
});

test("denied or missing clipboard reveals a focused, selected readonly URL", async () => {
  for (const clipboard of [undefined, { writeText: async () => { throw new Error("denied"); } }]) {
    const ui = mount({ clipboard });
    await ui.copy.events.click();
    assert.equal(ui.fallback.hidden, false);
    assert.equal(ui.field.focused, true);
    assert.equal(ui.field.selected, true);
    assert.deepEqual(ui.field.selection, [0, ui.field.value.length]);
    assert.match(ui.status.textContent, /직접 선택/);
    assert.equal(ui.copy.disabled, false);
  }
});

test("manual URL selection stays available independently of clipboard or native share support", () => {
  const ui = mount();
  ui.select.events.click();
  assert.equal(ui.fallback.hidden, false);
  assert.equal(ui.field.readOnly, true);
  assert.equal(ui.field.focused, true);
  assert.deepEqual(ui.field.selection, [0, ui.field.value.length]);
  assert.match(ui.status.textContent, /주소를 선택했습니다/);
});

test("native share runs only on activation; cancellation is not reported as failure", async () => {
  const shared = [];
  const ui = mount({ share: async data => shared.push(data) });
  assert.equal(ui.native.hidden, false);
  assert.equal(shared.length, 0);
  await ui.native.events.click();
  assert.equal(shared[0].url, "https://jhsoftlabs.com/data-guides/excel-trim-spaces");
  assert.equal(shared[0].title, "공백 실습");
  const cancelled = mount({ share: async () => { throw { name: "AbortError" }; } });
  await cancelled.native.events.click();
  assert.match(cancelled.status.textContent, /취소/);
  assert.equal(cancelled.fallback.hidden, true);
  const failed = mount({ share: async () => { throw new Error("unavailable"); } });
  await failed.native.events.click();
  assert.equal(failed.fallback.hidden, false);
});

test("pending operations cannot be duplicated and controls recover on completion", async () => {
  let release, writes = 0;
  const ui = mount({ clipboard: { writeText: () => { writes++; return new Promise(resolve => { release = resolve; }); } } });
  const first = ui.copy.events.click();
  await ui.copy.events.click();
  assert.equal(writes, 1);
  assert.equal(ui.copy.disabled, true);
  assert.equal(ui.controls.attributes["aria-busy"], "true");
  release();
  await first;
  assert.equal(ui.copy.disabled, false);
  assert.equal(ui.controls.attributes["aria-busy"], undefined);
});

test("sharing adds no transport, persistent state, analytics or HTML insertion", () => {
  assert.doesNotMatch(source, /fetch\s*\(|sendBeacon|XMLHttpRequest|localStorage|sessionStorage|innerHTML|document\.cookie|utm_|\.track\(/);
});
