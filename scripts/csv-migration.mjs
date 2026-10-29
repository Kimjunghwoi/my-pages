import assert from "node:assert/strict";

export function csvMigrationTarget(source) {
  const url = new URL(source);
  assert.equal(url.hostname, "csv.jhsoftlabs.com");
  assert.ok(["http:", "https:"].includes(url.protocol));
  assert.equal(url.username, "");
  assert.equal(url.password, "");
  assert.equal(url.port, "");
  if (url.search.slice(1).includes("__legacy=1") || url.pathname.startsWith("/_next/")) return null;
  url.protocol = "https:";
  url.hostname = "jhsoftlabs.com";
  if (["/about", "/about/", "/about.html"].includes(url.pathname)) url.pathname = "/method";
  return url.href;
}

export function assertCsvMigration(source, response) {
  const target = csvMigrationTarget(source);
  if (target === null) {
    assert.equal(response.status, 200, "Explicit legacy and previously loaded assets must remain reachable");
    return null;
  }
  assert.equal(response.status, 301, "CSV content must permanently redirect");
  assert.equal(new URL(response.headers.get("location"), source).href, target, "CSV migration must preserve the route and query");
  return target;
}
