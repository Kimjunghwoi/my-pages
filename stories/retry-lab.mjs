// Learning model only: one process, in-memory state, no real AI/DB/payment calls.
import assert from "node:assert/strict";

function createLab() {
  let state = { remaining: 1, results: new Map() };
  function submit(requestId, answer, failure = "none") {
    const prior = state.results.get(requestId);
    if (prior) {
      if (prior.answer !== answer) throw new Error("KEY_REUSED_WITH_DIFFERENT_INPUT");
      return prior;
    }
    if (state.remaining < 1) throw new Error("LIMIT_REACHED");
    const result = Object.freeze({ id: requestId, answer, feedback: "synthetic result" });
    const next = { remaining: state.remaining - 1, results: new Map(state.results) };
    next.results.set(requestId, result);
    if (failure === "before-commit") throw new Error("SAVE_FAILED");
    // One synchronous assignment models a commit; this is NOT a DB transaction.
    state = next;
    if (failure === "after-commit") throw new Error("RESPONSE_LOST");
    return result;
  }
  const snapshot = () => ({ results: state.results.size, remaining: state.remaining });
  return { submit, snapshot };
}

const before = createLab();
assert.throws(() => before.submit("req-42", "sample", "before-commit"), /SAVE_FAILED/);
assert.deepEqual(before.snapshot(), { results: 0, remaining: 1 });
console.log("before-commit: results=0 remaining=1");
before.submit("req-42", "sample");
assert.deepEqual(before.snapshot(), { results: 1, remaining: 0 });
console.log("retry-after-failure: results=1 remaining=0");

const after = createLab();
assert.throws(() => after.submit("req-42", "sample", "after-commit"), /RESPONSE_LOST/);
assert.deepEqual(after.snapshot(), { results: 1, remaining: 0 });
console.log("response-lost: results=1 remaining=0");
const original = after.submit("req-42", "sample");
assert.strictEqual(after.submit("req-42", "sample"), original);
assert.deepEqual(after.snapshot(), { results: 1, remaining: 0 });
console.log("same-key-retry: same-result remaining=0");
assert.throws(() => after.submit("req-42", "changed"), /KEY_REUSED_WITH_DIFFERENT_INPUT/);
assert.throws(() => after.submit("req-43", "sample"), /LIMIT_REACHED/);
assert.deepEqual(after.snapshot(), { results: 1, remaining: 0 });
console.log("changed-input: rejected; new-key: limit-reached");
