import assert from "node:assert/strict";

export const canonicalHostCases = [
  { url: "http://www.jhsoftlabs.com/", expectedStatus: 200 },
  { url: "https://www.jhsoftlabs.com/", expectedStatus: 200 },
  { url: "http://www.jhsoftlabs.com/data-guides/excel-trim-spaces?source=index-check&step=1", expectedStatus: 200 },
  { url: "https://www.jhsoftlabs.com/data-guides/excel-trim-spaces?source=index-check&step=1", expectedStatus: 200 },
  { url: "https://www.jhsoftlabs.com/__canonical-host-missing-2026-10-28?source=index-check", expectedStatus: 404 },
];

export function canonicalHostTarget(source) {
  const url = new URL(source);
  assert.equal(url.hostname, "www.jhsoftlabs.com");
  assert.ok(["http:", "https:"].includes(url.protocol));
  assert.equal(url.port, "");
  assert.equal(url.username, "");
  assert.equal(url.password, "");
  url.protocol = "https:";
  url.hostname = "jhsoftlabs.com";
  return url.href;
}

export function assertCanonicalHostRedirect(source, response) {
  assert.equal(response.status, 301, "www must return a permanent redirect");
  const location = response.headers.get("location");
  assert.ok(location, "www redirect must include Location");
  const target = new URL(location, source).href;
  assert.equal(target, canonicalHostTarget(source), "redirect must preserve the path and query on the canonical HTTPS host");
  return target;
}
