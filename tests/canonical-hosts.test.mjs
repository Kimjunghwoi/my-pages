import assert from "node:assert/strict";
import { test } from "node:test";
import { assertCanonicalHostRedirect, canonicalHostCases, canonicalHostTarget } from "../scripts/canonical-hosts.mjs";

const response = (status, location) => ({ status, headers: new Headers(location ? { location } : {}) });
const source = "https://www.jhsoftlabs.com/data-guides/excel-trim-spaces?source=index-check&step=1";
const target = "https://jhsoftlabs.com/data-guides/excel-trim-spaces?source=index-check&step=1";

test("both www schemes preserve the complete path and query on canonical HTTPS", () => {
  for (const scheme of ["http:", "https:"]) {
    const url = source.replace("https:", scheme);
    assert.equal(canonicalHostTarget(url), target);
    assert.equal(assertCanonicalHostRedirect(url, response(301, target)), target);
  }
});

test("temporary, missing and unrelated parked redirects fail the host contract", () => {
  assert.throws(() => assertCanonicalHostRedirect(source, response(302, target)));
  assert.throws(() => assertCanonicalHostRedirect(source, response(301)));
  assert.throws(() => assertCanonicalHostRedirect(source, response(301, "https://jhsoftlabs-com.l.ink/")));
});

test("query loss, homepage-only forwarding and redirect loops fail the host contract", () => {
  for (const wrong of [target.split("?")[0], "https://jhsoftlabs.com/", source, target.replace("https:", "http:")]) {
    assert.throws(() => assertCanonicalHostRedirect(source, response(301, wrong)));
  }
});

test("other service hosts and credential-bearing inputs are not canonical-host probes", () => {
  for (const url of ["https://csv.jhsoftlabs.com/", "https://image.jhsoftlabs.com/", "https://interview.jhsoftlabs.com/", "https://jhsoftlabs.com/", "https://user@www.jhsoftlabs.com/"]) {
    assert.throws(() => canonicalHostTarget(url));
  }
});

test("the public cases include a true not-found path rather than soft-404 forwarding", () => {
  assert.equal(canonicalHostCases.length, 5);
  const missing = canonicalHostCases.find(item => item.expectedStatus === 404);
  assert.match(canonicalHostTarget(missing.url), /^https:\/\/jhsoftlabs\.com\/__canonical-host-missing-/);
});
