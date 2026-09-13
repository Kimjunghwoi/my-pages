import { createHash } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repository = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const bootstrap = "window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); }; window.si = window.si || function () { (window.siq = window.siq || []).push(arguments); };";

export function pagesHtml(source) {
  const html = source.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/g, (tag, attributes, body) => {
    if (/\bsrc="\/_vercel\/(?:insights|speed-insights)\/script\.js"/.test(attributes)) return "";
    if (!attributes.trim() && body.trim().replace(/\s+/g, " ") === bootstrap) return "";
    return tag;
  });
  if (/\/_vercel\/|window\.(?:va|si)\s*=/.test(html)) throw new Error("Unrecognized Vercel telemetry: inspect before publishing.");
  return html;
}

function pagesUrls(source, file, articles) {
  const base = new URL(file, "https://jhsoftlabs.com/");
  const absolute = source.replace(/https:\/\/jhsoftlabs\.com\/stories\/[a-z0-9-]+\.html/g,
    (url) => articles.has(new URL(url).pathname) ? url.slice(0, -5) : url);
  return absolute.replace(/href="([^"]+)"/g, (attribute, href) => {
    const url = new URL(href, base);
    if (url.origin !== base.origin || !articles.has(url.pathname)) return attribute;
    return `href="${href.replace(/\.html(?=[?#]|$)/, "")}"`;
  });
}

export function buildPages(root = repository) {
  root = realpathSync(root);
  const output = resolve(root, ".pages-dist");
  const sources = ["index.html", "styles.css", "stories.css", "script.js", "experiences.js", "ads.txt", "robots.txt", "sitemap.xml"];
  const groups = {
    assets: /\.(?:svg|png|jpe?g|webp|woff2?)$/i,
    stories: /\.html$/,
    templates: /\.(?:html|md)$/,
    "tools/release-check": /\.(?:html|css|js)$/,
  };
  // Only approved public paths enter the artifact; never publish the repository root.
  for (const [directory, pattern] of Object.entries(groups)) {
    for (const entry of readdirSync(join(root, directory), { withFileTypes: true })) {
      if (entry.isFile() && pattern.test(entry.name)) sources.push(`${directory}/${entry.name}`);
    }
  }
  const files = new Map();
  const articles = new Set(sources.filter((file) => /^stories\/(?!index\.html)[a-z0-9-]+\.html$/.test(file)).map((file) => `/${file}`));
  for (const file of sources.sort()) {
    const path = join(root, file);
    if (lstatSync(path).isSymbolicLink() || !realpathSync(path).startsWith(`${root}${sep}`)) throw new Error(`Refusing unsafe public path: ${file}`);
    const bytes = readFileSync(path);
    const text = file.endsWith(".html") ? pagesHtml(bytes.toString("utf8")) : bytes.toString("utf8");
    files.set(file, file.endsWith(".html") || file === "sitemap.xml" ? Buffer.from(pagesUrls(text, file, articles)) : bytes);
  }
  files.set("404.html", readFileSync(join(root, "hosting/404.html")));
  const manifest = [...files].map(([path, bytes]) => ({
    path, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex"),
  }));
  if (manifest.length > 20000 || manifest.some((file) => file.bytes > 25 * 1024 * 1024)) {
    throw new Error("Static artifact exceeds a Pages Free file limit.");
  }
  // Recursive cleanup is restricted to this exact non-symlink build directory.
  if (dirname(output) !== root) throw new Error("Output must stay inside the repository.");
  if (existsSync(output)) {
    if (lstatSync(output).isSymbolicLink() || realpathSync(output) !== output) throw new Error("Unsafe output path.");
    rmSync(output, { recursive: true });
  }
  for (const [file, bytes] of files) {
    const path = join(output, file);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, bytes);
  }
  return { output, files: manifest, totalBytes: manifest.reduce((total, file) => total + file.bytes, 0) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const result = buildPages();
  console.log(`Pages artifact: ${result.files.length} files, ${result.totalBytes} bytes -> ${result.output}`);
}
