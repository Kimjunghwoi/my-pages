import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const decode = (html) => html.replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&amp;", "&");
const code = (html, id) => decode(html.match(new RegExp(`<code id="${id}">([\\s\\S]*?)</code>`))?.[1] || "");
const run = (source) => spawnSync(process.execPath, ["--input-type=module", "--eval", source], { encoding: "utf8", timeout: 10000 });

test("article code previews exactly match the downloadable self-contained labs", () => {
  for (const [article, download, id] of [
    ["data-guides/power-query-merge-rows.html", "data-guides/merge-lab.pq", "merge-lab-source"],
    ["stories/ai-retry-safety.html", "stories/retry-lab.mjs", "retry-lab-source"],
  ]) {
    const html = read(article);
    assert.equal(code(html, id).trim(), read(download).trim());
    assert.ok(html.includes(`href="./${download.split("/").at(-1)}" download`));
    assert.match(html, /"dateModified":\s*"2026-10-05"/);
    assert.ok(read("sitemap.xml").includes(`${article}</loc><lastmod>2026-10-05</lastmod>`));
  }
});

test("native Excel evidence belongs to the exact published M source and has nine passed checks", () => {
  const report = JSON.parse(read("docs/merge-lab-evidence-2026-10-05.json").replace(/^\uFEFF/, ""));
  assert.equal(report.querySha256, createHash("sha256").update(read("data-guides/merge-lab.pq")).digest("hex"));
  assert.equal(report.excel, "16.0");
  assert.equal(report.build, "5569.0");
  assert.equal(report.checks.length, 9);
  for (const check of report.checks) assert.deepEqual(check.actual, check.expected, check.name);
  assert.equal(report.checks.find((check) => check.name === "expanded.total").actual, 72);
  assert.equal(report.checks.find((check) => check.name === "corrected.total").actual, 42);
  assert.ok(report.checks.find((check) => check.name === "duplicate_rejected"));
  assert.match(read("data-guides/power-query-merge-rows.html"), /UI テスト|UI 테스트/);
});

test("retry model runs with built-in modules and prints the article's exact observed output", () => {
  const source = read("stories/retry-lab.mjs");
  assert.doesNotMatch(source, /fetch\(|node:(?:fs|https?|net)|process\.env/);
  const result = run(source);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), code(read("stories/ai-retry-safety.html"), "retry-lab-output").trim());
  assert.match(read("stories/ai-retry-safety.html"), /단일 프로세스의 동기 메모리 모델/);
});

test("all three suggested mistakes actually fail the retry model's assertions", () => {
  const source = read("stories/retry-lab.mjs");
  const limit = '    if (state.remaining < 1) throw new Error("LIMIT_REACHED");\n';
  const wrongLimit = source.replace(limit, "").replace("    const prior", limit + "    const prior");
  const earlyCommit = source.replace("    state = next;\n", "").replace('    if (failure === "before-commit")', '    state = next;\n    if (failure === "before-commit")');
  const noInputCheck = source.replace('      if (prior.answer !== answer) throw new Error("KEY_REUSED_WITH_DIFFERENT_INPUT");\n', "");
  for (const mutant of [wrongLimit, earlyCommit, noInputCheck]) {
    assert.notEqual(mutant, source);
    const result = run(mutant);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /LIMIT_REACHED|AssertionError/);
  }
});
