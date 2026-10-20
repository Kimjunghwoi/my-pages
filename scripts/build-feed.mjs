import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const feedArticles = [
  "data-guides/csv-one-column.html", "data-guides/excel-leading-zeros.html",
  "data-guides/power-query-merge-rows.html", "data-guides/excel-filter-spill.html",
  "data-guides/excel-trim-spaces.html", "data-guides/excel-long-identifiers.html",
  "stories/column-harbor.html", "stories/salon-publishing.html", "stories/guides-that-work.html",
  "stories/ai-retry-safety.html", "stories/excel-native-checks.html", "stories/ai-answer-fidelity.html",
  "stories/guest-trial-funnel.html", "stories/shorts-release-pipeline.html",
  "stories/homepage-information-order.html", "stories/deep-constellation-retrospective.html",
];
const repository = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const origin = "https://jhsoftlabs.com";
const xml = value => String(value).replace(/[<>&"']/g, char => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[char]);
const decode = value => value.replace(/&(?:amp|quot|apos|lt|gt);/g, text => ({ "&amp;": "&", "&quot;": '"', "&apos;": "'", "&lt;": "<", "&gt;": ">" })[text]);
const date = value => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`Invalid article date: ${value}`);
  const parsed = new Date(`${value}T00:00:00+09:00`);
  if (!Number.isFinite(parsed.valueOf())) throw new Error(`Invalid article date: ${value}`);
  return parsed.toUTCString();
};
const cdata = value => `<![CDATA[${value.replaceAll("]]>", "]]]]><![CDATA[>")}]]>`;

export function createFeed(root = repository) {
  const entries = feedArticles.map(file => {
    const source = readFileSync(join(root, file), "utf8");
    const data = JSON.parse(source.match(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1] || "null");
    if (!["BlogPosting", "TechArticle"].includes(data?.["@type"])) throw new Error(`Not an approved article: ${file}`);
    const base = new URL(file, `${origin}/`);
    function absolute(value) {
      const url = new URL(decode(value), base);
      if (!["http:", "https:"].includes(url.protocol)) throw new Error(`Unsafe feed URL in ${file}`);
      if (url.origin === origin) url.pathname = url.pathname.replace(/\.html$/, "");
      return xml(url.href);
    }
    const canonical = decode(absolute(data.mainEntityOfPage));
    if (!canonical.startsWith(`${origin}/`) || canonical !== decode(absolute(file.split("/").at(-1)))) throw new Error(`Unexpected article URL: ${file}`);
    let body = source.match(/<article(?:\s[^>]*)?>([\s\S]*?)<\/article>/)?.[1];
    if (!body) throw new Error(`Missing full article: ${file}`);
    body = body.replace(/<(script|style|form)\b[^>]*>[\s\S]*?<\/\1>/gi, "");
    if (/\son\w+\s*=|<(?:input|textarea|iframe)\b/i.test(body)) throw new Error(`Unexpected active content in ${file}`);
    body = body.replace(/\b(href|src)="([^"]+)"/g, (_, attribute, value) => `${attribute}="${absolute(value)}"`).replace(/\r\n/g, "\n");
    date(data.datePublished);
    date(data.dateModified);
    return { title: data.headline, url: canonical, published: data.datePublished, modified: data.dateModified, body };
  }).sort((a, b) => b.published.localeCompare(a.published) || a.url.localeCompare(b.url));
  const latest = entries.reduce((value, entry) => entry.modified > value ? entry.modified : value, entries[0].modified);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n  <channel>\n    <title>회몬 · JH Soft Labs</title>\n    <link>${origin}/</link>\n    <description>CSV·Excel 실무 가이드와 직접 만들며 겪은 개발 기록. 새 글은 실제 게시일 순으로 전합니다.</description>\n    <language>ko-KR</language>\n    <lastBuildDate>${date(latest)}</lastBuildDate>\n    <atom:link href="${origin}/feed.xml" rel="self" type="application/rss+xml" />\n${entries.map(entry => `    <item>\n      <title>${xml(entry.title)}</title>\n      <link>${xml(entry.url)}</link>\n      <guid isPermaLink="true">${xml(entry.url)}</guid>\n      <pubDate>${date(entry.published)}</pubDate>\n      <description>${cdata(entry.body)}</description>\n    </item>`).join("\n")}\n  </channel>\n</rss>\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const feed = createFeed();
  const path = join(repository, "feed.xml");
  if (process.argv.includes("--write")) {
    writeFileSync(path, feed);
    console.log(`RSS generated: ${feedArticles.length} full articles -> ${path}`);
  } else {
    if (readFileSync(path, "utf8").replace(/\r\n/g, "\n") !== feed) throw new Error("Stale feed.xml; run node scripts/build-feed.mjs --write");
    console.log(`RSS verified: ${feedArticles.length} full articles`);
  }
}
