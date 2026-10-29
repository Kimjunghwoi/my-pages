import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync, realpathSync } from "node:fs";
import { join, sep } from "node:path";

export const contentOrigin = "https://jhsoftlabs.com";
export function contentFiles(root) {
  const base = join(root, "integrations/column-harbor");
  if (!existsSync(join(base, "manifest.json"))) return new Map();
  const manifest = JSON.parse(readFileSync(join(base, "manifest.json"), "utf8"));
  assert.equal(manifest.version, 1);
  assert.equal(manifest.deploymentOrigin, contentOrigin);
  assert.equal(manifest.adsEnabled, false);
  assert.match(manifest.sourceCommit, /^[a-f0-9]{40}$/);
  const files = new Map();
  for (const entry of manifest.files) {
    assert.ok(!entry.path.includes("..") && !entry.path.startsWith("/") && !entry.path.includes("\\"));
    const path = join(base, "public", entry.path);
    assert.ok(!lstatSync(path).isSymbolicLink() && realpathSync(path).startsWith(realpathSync(join(base, "public")) + sep));
    const bytes = readFileSync(path);
    assert.equal(bytes.length, entry.bytes, entry.path);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), entry.sha256, entry.path);
    if (["index.html", "index.txt", "404.html", "404.txt", "privacy.html", "privacy.txt", "sitemap.xml"].includes(entry.path)) continue;
    // React Flight payloads contain byte lengths: never edit a serialized build.
    files.set(entry.path, bytes);
  }
  return files;
}

export function integratedSitemap(root, source) {
  const file = join(root, "integrations/column-harbor/public/sitemap.xml");
  if (!existsSync(file)) return source;
  const entries = [...readFileSync(file, "utf8").matchAll(/<url>([\s\S]*?)<\/url>/g)].map(([entry]) => entry)
    .filter(entry => ![contentOrigin + "/", contentOrigin + "/privacy"].some(url => entry.includes("<loc>" + url + "</loc>")));
  const extra = '<url><loc>https://jhsoftlabs.com/about/</loc><lastmod>2026-10-29</lastmod></url>\n<url><loc>https://jhsoftlabs.com/migration/</loc><lastmod>2026-10-29</lastmod></url>';
  return source.replace(/\.html(?=<\/loc>)/g, "")
    .replace(/(<loc>https:\/\/jhsoftlabs\.com\/<\/loc><lastmod>)[^<]+/, "$12026-10-29")
    .replace(/(<loc>https:\/\/jhsoftlabs\.com\/privacy<\/loc><lastmod>)[^<]+/, "$12026-10-29")
    .replace("</urlset>", entries.join("\n") + "\n" + extra + "\n</urlset>");
}
