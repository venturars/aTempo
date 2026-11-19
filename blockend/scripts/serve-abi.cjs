const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const root = path.join(__dirname, "..", "sourcify");
const port = Number(process.env.ABI_PORT) || 5555;

function fileFromRequest(urlPath) {
  const relative = decodeURIComponent(urlPath).replace(/^\/+/, "");
  const filePath = path.normalize(path.join(root, relative));
  const insideRoot =
    filePath === root || filePath.startsWith(`${root}${path.sep}`);
  if (!insideRoot) {
    return null;
  }
  return filePath;
}

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }
  const filePath = fileFromRequest(new URL(req.url, "http://127.0.0.1").pathname);
  if (!filePath) {
    res.writeHead(400);
    res.end();
    return;
  }
  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404);
      res.end();
      return;
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(data);
  });
});

fs.mkdirSync(root, { recursive: true });
server.listen(port, "127.0.0.1", () => {
  process.stdout.write(`ABI en http://127.0.0.1:${port}\n`);
});
