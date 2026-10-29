import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, resolve, sep } from "node:path";
const root = resolve(".pages-dist");
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".json": "application/json", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml", ".csv": "text/csv; charset=utf-8", ".tsv": "text/tab-separated-values; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".woff2": "font/woff2", ".mp4": "video/mp4", ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", ".pdf": "application/pdf" };
const server = createServer((request, response) => {
  const url = new URL(request.url, "http://127.0.0.1");
  if (url.pathname === "/__mobile-preview") {
    const allowed = new Set(["/", "/workspace/csv-to-excel", "/workspace/compare-csv-files", "/learn/excel/workbook-cells-ranges", "/about/"]);
    const page = allowed.has(url.searchParams.get("page")) ? url.searchParams.get("page") : "/";
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    response.end(`<!doctype html><html><head><title>390px local responsive check</title></head><body style="margin:20px;background:#e4e6e1;font-family:sans-serif"><p>Local responsive check · 390 CSS px · not a production page</p><iframe title="390px site preview" src="${page}" width="390" height="844" style="display:block;border:1px solid #b7bdb6;background:white"></iframe></body></html>`);
    return;
  }
  let path;
  try { path = resolve(root, "." + decodeURIComponent(url.pathname)); } catch { response.writeHead(400).end(); return; }
  if (path !== root && !path.startsWith(root + sep)) { response.writeHead(400).end(); return; }
  const candidate = [path, path + ".html", join(path, "index.html")].find(file => existsSync(file) && statSync(file).isFile());
  const file = candidate || join(root, "404.html");
  response.writeHead(candidate ? 200 : 404, { "Content-Type": types[extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
  if (request.method === "HEAD") response.end(); else response.end(readFileSync(file));
});
server.listen(8019, "127.0.0.1", () => console.log("Local: http://127.0.0.1:8019/ (.pages-dist only)"));
