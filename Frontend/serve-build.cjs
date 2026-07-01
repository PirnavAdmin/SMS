const http = require("http");
const fs = require("fs");
const path = require("path");

const buildDir = path.join(__dirname, "build");
const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 3000);

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
};

function sendFile(response, filePath) {
  const stream = fs.createReadStream(filePath);
  response.writeHead(200, {
    "Content-Type": contentTypes[path.extname(filePath)] || "application/octet-stream",
  });
  stream.pipe(response);
  stream.on("error", () => {
    response.writeHead(500);
    response.end("Server error");
  });
}

const server = http.createServer((request, response) => {
  const urlPath = decodeURIComponent(new URL(request.url, `http://${host}:${port}`).pathname);
  const requestedPath = path.normalize(path.join(buildDir, urlPath));

  if (!requestedPath.startsWith(buildDir)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.stat(requestedPath, (error, stats) => {
    if (!error && stats.isFile()) {
      sendFile(response, requestedPath);
      return;
    }

    sendFile(response, path.join(buildDir, "index.html"));
  });
});

server.listen(port, host, () => {
  console.log(`Serving ${buildDir} at http://${host}:${port}`);
});
