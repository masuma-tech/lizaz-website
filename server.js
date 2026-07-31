import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";
import { sendContactNotificationEmail } from "./server/email.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 3000;
const SITE_PROTECTED = process.env.SITE_PROTECTED === "true";
const SITE_USER = process.env.SITE_USER || "lizaz";
const SITE_PASSWORD = process.env.SITE_PASSWORD;

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

const contactSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().email("Valid email is required"),
  phone: z.string().trim().optional().or(z.literal("")),
  service: z.string().trim().optional().or(z.literal("")),
  subject: z.string().trim().optional().or(z.literal("")),
  message: z.string().trim().min(1, "Message is required"),
});

function sendAuthRequired(res) {
  res.writeHead(401, {
    "WWW-Authenticate": 'Basic realm="Lizaz"',
    "Content-Type": "text/plain; charset=utf-8",
  });
  res.end("Authentication required");
}

function isAuthorized(req) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Basic ")) return false;

  const encoded = header.slice(6);
  const decoded = Buffer.from(encoded, "base64").toString("utf8");
  const separator = decoded.indexOf(":");
  if (separator === -1) return false;

  const user = decoded.slice(0, separator);
  const password = decoded.slice(separator + 1);

  return user === SITE_USER && password === SITE_PASSWORD;
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    const maxBytes = 64 * 1024;

    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error("Request body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });

    req.on("error", reject);
  });
}

async function handleContactApi(req, res) {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const validated = contactSchema.parse(body);

    const contact = {
      firstName: validated.firstName,
      lastName: validated.lastName,
      email: validated.email,
      phone: validated.phone || "",
      service: validated.service || "",
      subject: validated.subject || "",
      message: validated.message,
    };

    try {
      await sendContactNotificationEmail(contact);
    } catch (emailError) {
      console.error("Failed to send contact notification email:", emailError);
      sendJson(res, 502, {
        error: "Failed to send message. Please try again later.",
      });
      return;
    }

    sendJson(res, 201, { ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      sendJson(res, 400, {
        error: "Invalid contact data",
        details: error.errors,
      });
      return;
    }

    if (error.message === "Request body too large" || error.message === "Invalid JSON body") {
      sendJson(res, 400, { error: error.message });
      return;
    }

    console.error("Failed to submit contact form:", error);
    sendJson(res, 500, { error: "Failed to submit inquiry" });
  }
}

function resolveFilePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  let clean = decoded.replace(/\\/g, "/").replace(/\/+/g, "/");

  if (clean.length > 1 && clean.endsWith("/")) {
    clean = clean.slice(0, -1);
  }

  if (clean === "/" || clean === "") {
    return path.join(ROOT, "index.html");
  }

  const relative = clean.replace(/^\//, "");
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
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Internal server error");
      return;
    }

    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  if (SITE_PROTECTED) {
    if (!SITE_PASSWORD) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("SITE_PASSWORD is not set. Copy .env.example to .env and set a password.");
      return;
    }

    if (!isAuthorized(req)) {
      sendAuthRequired(res);
      return;
    }
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/api/contact") {
    handleContactApi(req, res);
    return;
  }

  const filePath = resolveFilePath(url.pathname);

  if (!filePath || !isInsideRoot(filePath)) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
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

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Stop the other server and try again.`);
    process.exit(1);
  }

  console.error(err);
  process.exit(1);
});
