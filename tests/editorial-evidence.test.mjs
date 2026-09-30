import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";

test("published number-check example reproduces both detections and documented blind spots", () => {
  const article = readFileSync(new URL("../stories/ai-answer-fidelity.html", import.meta.url), "utf8");
  const code = article.match(/id="number-check-example"><code>([\s\S]*?)<\/code>/)[1].replaceAll("&gt;", ">");
  const context = {};
  runInNewContext(code, context, { timeout: 1000 });
  const check = (source, draft) => Array.from(context.findAddedNumbers(source, draft));
  assert.deepEqual(check("조회 쿼리를 수정했습니다.", "응답 시간을 40% 줄였습니다."), ["40%"]);
  assert.deepEqual(check("응답 시간을 40% 줄였습니다.", "응답 시간을 40% 줄였습니다."), []);
  assert.deepEqual(check("작업 2개를 처리했습니다.", "서버 2대를 운영했습니다."), []);
  assert.deepEqual(check("조회 쿼리를 수정했습니다.", "Redis를 도입했습니다."), []);
  assert.deepEqual(check("40%", "４０％"), []);
});
