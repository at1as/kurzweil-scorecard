import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
const exported = process.argv.includes("--export");
const settings = exported
  ? JSON.parse(
      await fs.readFile(
        new URL("../config/public-site.json", import.meta.url),
        "utf8",
      ),
    )
  : null;
const root = path.resolve(exported ? "work/public-build" : "out");
const basePath = settings?.basePath ?? "";
const port = Number(process.env.PORT || (exported ? 3100 : 3000));
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".csv": "text/csv; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
};
http
  .createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      );
      if (basePath && pathname === basePath) {
        res.writeHead(308, { Location: `${basePath}/` }).end();
        return;
      }
      if (basePath && !pathname.startsWith(`${basePath}/`)) {
        res.writeHead(404).end("Outside this site");
        return;
      }
      let file = path.resolve(
        root,
        "." + (pathname.slice(basePath.length) || "/"),
      );
      if (!file.startsWith(root + path.sep) && file !== root) {
        res.writeHead(403).end();
        return;
      }
      try {
        if ((await fs.stat(file)).isDirectory())
          file = path.join(file, "index.html");
      } catch {}
      const data = await fs.readFile(file);
      res.writeHead(200, {
        "Content-Type": types[path.extname(file)] || "application/octet-stream",
      });
      res.end(data);
    } catch {
      try {
        res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
        res.end(await fs.readFile(path.join(root, "404.html")));
      } catch {
        res.writeHead(404);
        res.end("Not found");
      }
    }
  })
  .listen(port, "127.0.0.1", () =>
    console.log(`Local: http://127.0.0.1:${port}${basePath}/`),
  );
