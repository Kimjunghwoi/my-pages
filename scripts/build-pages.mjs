import { createHash } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createFeed } from "./build-feed.mjs";
import { contentFiles, integratedSitemap } from "./column-harbor.mjs";

const repository = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const bootstrap = "window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); }; window.si = window.si || function () { (window.siq = window.siq || []).push(arguments); };";
const compactBootstrap = "window.va=window.va||function(){(window.vaq=window.vaq||[]).push(arguments)};window.si=window.si||function(){(window.siq=window.siq||[]).push(arguments)};";

export function pagesHtml(source) {
  const html = source.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/g, (tag, attributes, body) => {
    if (/\bsrc="\/_vercel\/(?:insights|speed-insights)\/script\.js"/.test(attributes)) return "";
    if (!attributes.trim() && [bootstrap, compactBootstrap].includes(body.trim().replace(/\s+/g, " "))) return "";
    return tag;
  });
  if (/\/_vercel\/|window\.(?:va|si)\s*=/.test(html)) throw new Error("Unrecognized Vercel telemetry: inspect before publishing.");
  return html;
}

function pagesUrls(source, file, articles) {
  const base = new URL(file, "https://jhsoftlabs.com/");
  const absolute = source.replace(/https:\/\/jhsoftlabs\.com\/(?:[a-z0-9-]+\/)*[a-z0-9-]+\.html/g,
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
  const sources = ["index.html", "privacy.html", "styles.css", "home.css", "stories.css", "growth.css", "sharing.js", "feed.xml", "script.js", "experiences.js", "ads.txt", "robots.txt", "sitemap.xml", "data-guides/merge-lab.pq", "stories/retry-lab.mjs", "assets/deep-constellation-promo-muted.mp4"];
  const integrated = existsSync(join(root, "integrations/column-harbor/manifest.json"));
  if (existsSync(join(root, "migration/index.html"))) sources.push("migration/index.html");
  if (integrated) sources.push("assets/content-shell.css", "assets/content-home.css");
  if (readFileSync(join(root, "feed.xml"), "utf8").replace(/\r\n/g, "\n") !== createFeed(root)) throw new Error("Stale feed.xml; run node scripts/build-feed.mjs --write");
  const groups = {
    assets: /\.(?:svg|png|jpe?g|webp|woff2?)$/i,
    stories: /\.html$/,
    "data-guides": /\.(?:html|csv|tsv)$/,
    templates: /\.(?:html|md)$/,
    "tools/release-check": /\.(?:html|css|js)$/,
    "projects/bampang": /\.(?:html|css)$/,
  };
  // Only approved public paths enter the artifact; never publish the repository root.
  for (const [directory, pattern] of Object.entries(groups)) {
    for (const entry of readdirSync(join(root, directory), { withFileTypes: true })) {
      if (entry.isFile() && pattern.test(entry.name)) sources.push(`${directory}/${entry.name}`);
    }
  }
  const files = new Map();
  const articles = new Set(sources.filter((file) => /^(?:stories|data-guides)\/(?!index\.html)[a-z0-9-]+\.html$/.test(file)).map((file) => `/${file}`));
  articles.add("/privacy.html");
  for (const file of sources.sort()) {
    const path = join(root, file);
    if (lstatSync(path).isSymbolicLink() || !realpathSync(path).startsWith(`${root}${sep}`)) throw new Error(`Refusing unsafe public path: ${file}`);
    const bytes = readFileSync(path);
    const text = file.endsWith(".html") ? pagesHtml(bytes.toString("utf8")) : bytes.toString("utf8");
    files.set(file, file.endsWith(".html") || file === "sitemap.xml" ? Buffer.from(pagesUrls(text, file, articles)) : bytes);
  }
  files.set("404.html", readFileSync(join(root, "hosting/404.html")));
  if (integrated) {
    const profile = files.get("index.html").toString("utf8")
      .replace(/<title>[^<]+<\/title>/, "<title>개발자 회몬 소개와 프로젝트 | JH Soft Labs</title>")
      .replace(/(<meta name="description" content=")[^"]+/, "$1스타트업부터 대기업까지 경험한 11년 차 개발자 회몬의 프로젝트, 개발 기록과 채널을 소개합니다.")
      .replace(/(<h1 id="intro-title">)[\s\S]*?<\/h1>/, "$1만들고, 실패하고,<br /><span>기록하는 개발자 회몬입니다.</span></h1>")
      .replace(/(<p class="intro-description">)[\s\S]*?<\/p>/, "$1스타트업, 유니콘, 중견기업과 대기업에서 일했습니다.<br />직접 만든 서비스와 커리어 글, 진행을 멈춘 실험까지 남겨둡니다.</p>")
      .replace(/<section class="guide-start[\s\S]*?<\/section>/, '<aside class="data-entry" id="data-guides"><div><h2>CSV·Excel 도구와 가이드를 찾고 있나요?</h2><p>실습 파일과 학습 콘텐츠는 메인에서 바로 이용할 수 있습니다.</p><a href="/">도구·가이드 홈으로 →</a></div></aside>')
      .replace(/<aside class="data-entry" aria-labelledby="data-entry-title">[\s\S]*?<\/aside>/, "")
      .replace(/(rel="canonical" href="https:\/\/jhsoftlabs\.com)\//, "$1/about/")
      .replace(/(property="og:url" content="https:\/\/jhsoftlabs\.com)\//, "$1/about/")
      .replace(/((?:href|src)=")\.\//g, "$1../")
      .replace(/(<main\b)/, '<div class="content-return"><a href="/">← CSV·Excel 도구와 가이드 홈</a><a href="/method">콘텐츠 제작·검증 방법</a></div>$1')
      .replace("</head>", '<link rel="stylesheet" href="/assets/content-shell.css"/></head>');
    files.set("about/index.html", Buffer.from(profile));
    const snapshot = JSON.parse(readFileSync(join(root, "integrations/column-harbor/manifest.json"), "utf8"));
    const home = readFileSync(join(root, "hosting/content-home.html"), "utf8")
      .replaceAll("@@GUIDE_COUNT@@", String(snapshot.counts.guides)).replaceAll("@@LESSON_COUNT@@", String(snapshot.counts.lessons));
    files.set("index.html", Buffer.from(home));
    const profileIds = new Set([...profile.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
    const homeIds = new Set([...home.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
    const imported = contentFiles(root);
    for (const [file, bytes] of imported) {
      if (files.has(file)) throw new Error(`Column Harbor public path collision: ${file}`);
      files.set(file, bytes);
    }
    files.set("sitemap.xml", Buffer.from(integratedSitemap(root, files.get("sitemap.xml").toString("utf8"))));
    const importedPaths = new Set(imported.keys());
    for (const [file, bytes] of files) {
      if (!file.endsWith(".html") || file === "index.html" || importedPaths.has(file)) continue;
      let html = bytes.toString("utf8");
      html = html.replace(/<a\b([^>]*?)href="https:\/\/csv\.jhsoftlabs\.com([^"]*)"([^>]*)>([\s\S]*?)<\/a>/g, (_, before, path, after, label) => {
        const target = path === "/" ? "/csv-checker" : path.startsWith("/#checker") ? "/csv-checker#checker" : path || "/csv-checker";
        return `<a${before}href="${target}"${after.replace(/\s(?:target|rel)="[^"]*"/g, "")}>${label.replace(/ \((?:영문 사이트, )?새 탭\)/g, " (영문)")}</a>`;
      });
      const base = new URL(file, "https://jhsoftlabs.com/");
      html = html.replace(/href="([^"]+)"/g, (attribute, href) => {
        const url = new URL(href.replaceAll("&amp;", "&"), base);
        const legacyTools = { "#compare": "compare-two-lists", "#clean": "clean-csv", "#dedupe": "remove-csv-duplicates", "#convert": "convert-csv", "#columns": "extract-csv-columns", "#split": "split-csv" };
        if (url.origin === base.origin && url.pathname === "/workspace" && legacyTools[url.hash]) return `href="/workspace/${legacyTools[url.hash]}${url.search}"`;
        if (url.origin === base.origin && url.pathname.endsWith("/") && files.has(url.pathname.slice(1, -1) + ".html")) {
          return `href="${url.pathname.slice(0, -1)}${url.search}${url.hash}"`;
        }
        if (url.origin !== base.origin || url.pathname !== "/" || !profileIds.has(url.hash.slice(1))) return attribute;
        if (homeIds.has(url.hash.slice(1)) && !/^#(?:projects|about|fieldnotes|collection|channels)$/.test(url.hash)) return attribute;
        return `href="/about/${url.hash}"`;
      });
      files.set(file, Buffer.from(html));
    }
    files.set("_headers", Buffer.from("https://jhsoftlabs.pages.dev/*\n  X-Robots-Tag: noindex\n\nhttps://:version.jhsoftlabs.pages.dev/*\n  X-Robots-Tag: noindex\n"));
  }
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
