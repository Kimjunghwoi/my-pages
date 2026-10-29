import assert from "node:assert/strict";
import { test } from "node:test";
import { assertCsvMigration, csvMigrationTarget } from "../scripts/csv-migration.mjs";
const response = (status, location) => ({ status, headers: new Headers(location ? { location } : {}) });
test("both CSV schemes move to the canonical root origin and keep query data", () => {
  for (const scheme of ["http:", "https:"]) assert.equal(csvMigrationTarget(scheme + "//csv.jhsoftlabs.com/guides/example?source=test&step=1"), "https://jhsoftlabs.com/guides/example?source=test&step=1");
});
test("the former CSV About aliases move to method, not the personal profile", () => {
  for (const path of ["/about", "/about/", "/about.html"]) assert.equal(csvMigrationTarget("https://csv.jhsoftlabs.com" + path + "?source=test"), "https://jhsoftlabs.com/method?source=test");
});
test("explicit storage recovery and existing client chunks are not redirected", () => {
  for (const path of ["/workspace?__legacy=1", "/learn/excel?__legacy=1", "/_next/static/chunks/example.js"]) assert.equal(csvMigrationTarget("https://csv.jhsoftlabs.com" + path), null);
});
test("redirect checking rejects temporary moves, lost routes and unwanted targets", () => {
  const source = "https://csv.jhsoftlabs.com/guides/example?source=test";
  const target = csvMigrationTarget(source);
  assert.equal(assertCsvMigration(source, response(301, target)), target);
  for (const result of [response(302, target), response(301, "https://jhsoftlabs.com/"), response(301, source)]) assert.throws(() => assertCsvMigration(source, result));
});
test("migration contracts cannot target unrelated services or credentials", () => {
  for (const url of ["https://image.jhsoftlabs.com/", "https://interview.jhsoftlabs.com/", "https://user@csv.jhsoftlabs.com/", "https://jhsoftlabs.com/"]) assert.throws(() => csvMigrationTarget(url));
});
