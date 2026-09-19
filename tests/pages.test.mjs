import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { buildPages, pagesHtml } from "../scripts/build-pages.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

test("Pages HTML removes only known telemetry, preserving public content and metadata", () => {
  const source = readFileSync(join(root, "index.html"), "utf8");
  const result = pagesHtml(source);
  assert.doesNotMatch(result, /\/_vercel\/|window\.(?:va|si)\s*=/);
  assert.match(result, /google-adsense-account/);
  assert.match(result, /src="\.\/script.js"/);
  assert.match(result, /src="\.\/experiences.js"/);
  assert.equal(result.match(/<body>[\s\S]*<\/footer>/)[0], source.match(/<body>[\s\S]*<\/footer>/)[0]);
  assert.equal(result.match(/rel="canonical"[^>]+/)[0], source.match(/rel="canonical"[^>]+/)[0]);
  assert.throws(() => pagesHtml('<script src="/_vercel/unknown.js"></script>'), /Unrecognized/);
});

test("Pages artifact excludes private paths, preserves downloads and replaces stale output", () => {
  const fixture = mkdtempSync(join(tmpdir(), "mypages-pages-test-"));
  const roots = ["index.html", "styles.css", "stories.css", "script.js", "experiences.js", "ads.txt", "robots.txt", "sitemap.xml", "hosting/404.html"];
  for (const directory of ["assets", "stories", "data-guides", "templates", "tools/release-check"]) {
    roots.push(...readdirSync(join(root, directory), { withFileTypes: true }).filter((entry) => entry.isFile()).map((entry) => `${directory}/${entry.name}`));
  }
  for (const file of roots) {
    mkdirSync(dirname(join(fixture, file)), { recursive: true });
    writeFileSync(join(fixture, file), readFileSync(join(root, file)));
  }
  for (const privatePath of [".env", "docs/private.md", ".git/config", ".vercel/project.json", "assets/internal.txt", "templates/private/notes.md", "tools/admin/index.html"]) {
    mkdirSync(dirname(join(fixture, privatePath)), { recursive: true });
    writeFileSync(join(fixture, privatePath), "PRIVATE SENTINEL");
  }
  const first = buildPages(fixture);
  const names = first.files.map((file) => file.path);
  assert.ok(names.includes("404.html"));
  assert.equal(names.filter((file) => file.startsWith("stories/") && file.endsWith(".html")).length, 10);
  const sitemap = readFileSync(join(first.output, "sitemap.xml"), "utf8");
  assert.doesNotMatch(sitemap, /\.html/);
  assert.match(readFileSync(join(first.output, "stories/column-harbor.html"), "utf8"), /rel="canonical" href="https:\/\/jhsoftlabs.com\/stories\/column-harbor"/);
  assert.match(readFileSync(join(first.output, "index.html"), "utf8"), /image.jhsoftlabs.com\/hair-salon\.html#cases/);
  for (const file of first.files) {
    const bytes = readFileSync(join(first.output, file.path));
    assert.equal(file.sha256, createHash("sha256").update(bytes).digest("hex"));
    assert.ok(!bytes.includes("PRIVATE SENTINEL"));
    if (file.path.endsWith(".md") || file.path === "ads.txt") assert.deepEqual(bytes, readFileSync(join(root, file.path)));
    if (file.path.endsWith(".html")) {
      const source = bytes.toString();
      assert.doesNotMatch(source, /\/_vercel\//);
      const base = new URL(file.path, "https://jhsoftlabs.com/");
      for (const [, href] of source.matchAll(/(?:src|href)="([^"]+)"/g)) {
        const url = new URL(href.replaceAll("&amp;", "&"), base);
        if (url.origin !== base.origin) continue;
        const paths = [url.pathname, `${url.pathname}.html`, `${url.pathname.replace(/\/$/, "")}/index.html`];
        const destination = paths.map((path) => join(first.output, path)).find((path) => existsSync(path) && lstatSync(path).isFile());
        assert.ok(destination, `${file.path}: ${href}`);
        if (url.hash && destination.endsWith(".html")) assert.ok(readFileSync(destination, "utf8").includes(`id="${url.hash.slice(1)}"`), href);
      }
    }
  }
  writeFileSync(join(first.output, "stale.txt"), "old build");
  const second = buildPages(fixture);
  assert.deepEqual(second.files, first.files);
  assert.equal(existsSync(join(second.output, "stale.txt")), false);
  assert.match(readFileSync(join(fixture, "index.html"), "utf8"), /\/_vercel\/insights/);
});

test("Pages 404 is a genuine not-found document with depth-independent recovery links", () => {
  const source = readFileSync(join(root, "hosting/404.html"), "utf8");
  assert.match(source, /name="robots" content="noindex"/);
  assert.equal((source.match(/<h1>/g) || []).length, 1);
  for (const [, href] of source.matchAll(/(?:href|src)="([^"]+)"/g)) {
    assert.ok(href.startsWith("/"));
    const path = href.endsWith("/") ? `${href}index.html` : href;
    assert.ok(existsSync(join(root, path)), href);
  }
});
