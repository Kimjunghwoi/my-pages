import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";

const source = readFileSync(new URL("../experiences.js", import.meta.url), "utf8");
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

function mount() {
  const controls = { hidden: true, addEventListener: (_type, handler) => { controls.click = handler; } };
  const buttons = ["number", "text"].map((mode) => ({
    dataset: { demoMode: mode },
    attributes: {},
    setAttribute(name, value) { this.attributes[name] = value; },
  }));
  const panels = ["number", "text"].map((mode) => ({ dataset: { demoPanel: mode }, hidden: false }));
  const announcement = { textContent: "" };
  const classes = new Set();
  const demo = {
    querySelector(selector) { return selector === ".demo-controls" ? controls : announcement; },
    querySelectorAll(selector) { return selector === "[data-demo-mode]" ? buttons : panels; },
    classList: { add: (name) => classes.add(name) },
  };
  runInNewContext(source, { document: { querySelectorAll: () => [demo] } });
  return { controls, buttons, panels, announcement, classes, click: (button) => controls.click({ target: { closest: () => button } }) };
}

test("demo progressively enhances a readable no-script comparison", () => {
  assert.match(html, /class="demo-controls"[^>]*hidden/);
  const panels = [...html.matchAll(/<div[^>]*data-demo-panel="[^"]+"[^>]*>/g)];
  assert.equal(panels.length, 2);
  assert.ok(panels.every((panel) => !panel[0].includes("hidden")));
  const ui = mount();
  assert.equal(ui.controls.hidden, false);
  assert.equal(ui.buttons[0].attributes["aria-pressed"], "true");
  assert.equal(ui.buttons[1].attributes["aria-pressed"], "false");
  assert.deepEqual(ui.panels.map((panel) => panel.hidden), [false, true]);
  assert.equal(ui.announcement.textContent, "");
  assert.ok(ui.classes.has("is-interactive"));
});

test("both comparison modes update visual and announced states consistently", () => {
  const ui = mount();
  ui.click(ui.buttons[1]);
  assert.deepEqual(ui.panels.map((panel) => panel.hidden), [true, false]);
  assert.equal(ui.buttons[1].attributes["aria-pressed"], "true");
  assert.match(ui.announcement.textContent, /00123이 그대로/);
  assert.match(ui.announcement.textContent, /설명용 예시/);
  ui.click(ui.buttons[0]);
  assert.deepEqual(ui.panels.map((panel) => panel.hidden), [false, true]);
  assert.equal(ui.buttons[1].attributes["aria-pressed"], "false");
  assert.match(ui.announcement.textContent, /123으로 바뀌어/);
});

test("unrelated and repeated clicks do not change or re-announce demo state", () => {
  const ui = mount();
  ui.click(null);
  ui.click({ dataset: { demoMode: "invalid" } });
  ui.click(ui.buttons[0]);
  assert.equal(ui.announcement.textContent, "");
  assert.deepEqual(ui.panels.map((panel) => panel.hidden), [false, true]);
});

test("demo makes no requests and adds no input, storage or HTML injection sinks", () => {
  assert.doesNotMatch(source, /fetch\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|innerHTML|eval\(/);
  const demo = html.slice(html.indexOf('class="csv-demo"'), html.indexOf('<div class="project-body">', html.indexOf('class="csv-demo"')));
  assert.doesNotMatch(demo, /<(input|textarea|form)\b/);
  assert.ok(demo.includes('role="status"'));
});

test("demo script is harmless on a document with no demo", () => {
  assert.doesNotThrow(() => runInNewContext(source, { document: { querySelectorAll: () => [] } }));
});
