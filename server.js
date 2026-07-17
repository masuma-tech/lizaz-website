const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 3000;
const SITE_PROTECTED = process.env.SITE_PROTECTED === 'true';
const SITE_USER = process.env.SITE_USER || 'lizaz';
const SITE_PASSWORD = process.env.SITE_PASSWORD;

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function sendAuthRequired(res) {
  res.writeHead(401, {
    'WWW-Authenticate': 'Basic realm="Lizaz"',
    'Content-Type': 'text/plain; charset=utf-8',
  });
  res.end('Authentication required');
}

function isAuthorized(req) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Basic ')) return false;

  const encoded = header.slice(6);
  const decoded = Buffer.from(encoded, 'base64').toString('utf8');
  const separator = decoded.indexOf(':');
  if (separator === -1) return false;

  const user = decoded.slice(0, separator);
  const password = decoded.slice(separator + 1);

  return user === SITE_USER && password === SITE_PASSWORD;
}

function resolveFilePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  let clean = decoded.replace(/\\/g, '/').replace(/\/+/g, '/');

  if (clean.length > 1 && clean.endsWith('/')) {
    clean = clean.slice(0, -1);
  }

  if (clean === '/' || clean === '') {
    return path.join(ROOT, 'index.html');
  }

  const relative = clean.replace(/^\//, '');
  const directPath = path.join(ROOT, relative);

  if (fs.existsSync(directPath) && fs.statSync(directPath).isFile()) {
    return directPath;
  }

  const htmlPath = path.join(ROOT, `${relative}.html`);
  if (fs.existsSync(htmlPath) && fs.statSync(htmlPath).isFile()) {
    return htmlPath;
  }

  return null;
}

function isInsideRoot(filePath) {
  const resolvedRoot = path.resolve(ROOT);
  const resolvedFile = path.resolve(filePath);
  return resolvedFile.toLowerCase().startsWith(resolvedRoot.toLowerCase());
}

function serveFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Internal server error');
      return;
    }

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  if (SITE_PROTECTED) {
    if (!SITE_PASSWORD) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('SITE_PASSWORD is not set. Copy .env.example to .env and set a password.');
      return;
    }

    if (!isAuthorized(req)) {
      sendAuthRequired(res);
      return;
    }
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const filePath = resolveFilePath(url.pathname);

  if (!filePath || !isInsideRoot(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }

  serveFile(filePath, res);
});

server.listen(PORT, () => {
  console.log(`Site running at http://localhost:${PORT}`);
  if (SITE_PROTECTED) {
    console.log(`Protected — login with username: ${SITE_USER}`);
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the other server and try again.`);
    process.exit(1);
  }

  console.error(err);
  process.exit(1);
});
