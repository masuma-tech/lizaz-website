import "./server/envSetup.ts";
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";
import { sendContactNotificationEmail } from "./server/email.js";
import {
  createContact,
  listPublishedBlogPosts,
  listAllBlogPosts,
  getBlogPostBySlug,
  getBlogPostById,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  listContacts,
} from "./server/storage.ts";
import { insertBlogPostSchema } from "./shared/schema.ts";
import {
  authenticateUser,
  canManageBlogs,
  canViewLeads,
  clearSessionCookie,
  createSession,
  destroySession,
  getSessionToken,
  getSessionUser,
  setSessionCookie,
  toPublicUser,
} from "./server/auth.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 3000;
const SITE_PROTECTED = process.env.SITE_PROTECTED === "true";
const SITE_USER = process.env.SITE_USER || "lizaz";
const SITE_PASSWORD = process.env.SITE_PASSWORD;

/** Secret CMS panel path — set ADMIN_PATH in .env (never use /admin). */
function normalizeAdminPath(raw) {
  const cleaned = String(raw || "")
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .replace(/\/+/g, "/");

  if (!cleaned || cleaned.toLowerCase() === "admin" || cleaned.toLowerCase().startsWith("admin/")) {
    return "lizaz-admin-portal-9k2m7xq";
  }

  return cleaned;
}

const ADMIN_PATH = normalizeAdminPath(process.env.ADMIN_PATH);
const ADMIN_PATHNAME = `/${ADMIN_PATH}`;
const ADMIN_API_BASE = `/api/${ADMIN_PATH}`;
const ADMIN_HTML_FILE = path.join(ROOT, "server", "cms-panel.html");
const NOT_FOUND_HTML_FILE = path.join(ROOT, "404.html");

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

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
  ".pdf": "application/pdf",
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

const loginSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
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
  if (!res.getHeader("Content-Type")) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
  }
  if (!res.getHeader("Access-Control-Allow-Origin")) {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.writeHead(statusCode);
  res.end(JSON.stringify(payload));
}

function sendCorsOptions(res, methods = "GET, POST, PUT, DELETE, OPTIONS") {
  res.writeHead(204, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Credentials": "true",
  });
  res.end();
}

function readJsonBody(req, maxBytes = 64 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;

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

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

async function ensureUniqueSlug(baseSlug, excludeId = null) {
  let slug = baseSlug || `post-${Date.now()}`;
  let attempt = 1;

  while (true) {
    const existing = await getBlogPostBySlug(slug);
    if (!existing || (excludeId && existing.id === excludeId)) return slug;
    attempt += 1;
    slug = `${baseSlug}-${attempt}`;
  }
}

async function handleContactApi(req, res) {
  if (req.method === "OPTIONS") {
    sendCorsOptions(res, "POST, OPTIONS");
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

    await createContact(contact);

    let emailSent = true;
    try {
      await sendContactNotificationEmail(contact);
    } catch (emailError) {
      emailSent = false;
      console.error("Failed to send contact notification email:", emailError);
    }

    sendJson(res, 201, { ok: true, emailSent });
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

async function handleBlogsApi(req, res, url) {
  if (req.method === "OPTIONS") {
    sendCorsOptions(res, "GET, OPTIONS");
    return;
  }

  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  try {
    const slug = url.searchParams.get("slug");
    if (slug) {
      const post = await getBlogPostBySlug(slug);
      if (!post || !post.published) {
        sendJson(res, 404, { error: "Blog post not found" });
        return;
      }
      sendJson(res, 200, { post });
      return;
    }

    const posts = await listPublishedBlogPosts();
    sendJson(res, 200, { posts });
  } catch (error) {
    console.error("Failed to fetch blog posts:", error);
    sendJson(res, 500, { error: "Failed to load blog posts" });
  }
}

async function handleAuthApi(req, res, url) {
  if (req.method === "OPTIONS") {
    sendCorsOptions(res, "GET, POST, OPTIONS");
    return;
  }

  const action = url.pathname
    .replace(new RegExp(`^${escapeRegExp(ADMIN_API_BASE)}/auth/?`), "")
    .replace(/\/$/, "");

  try {
    if (action === "login" && req.method === "POST") {
      const body = await readJsonBody(req);
      const validated = loginSchema.parse(body);
      const user = await authenticateUser(validated.username, validated.password);

      if (!user || (!user.isAdmin && !user.canManageBlogs && !user.canViewLeads)) {
        sendJson(res, 401, { error: "Invalid username or password" });
        return;
      }

      const token = createSession(user.id);
      setSessionCookie(res, token);
      sendJson(res, 200, { user: toPublicUser(user) });
      return;
    }

    if (action === "logout" && req.method === "POST") {
      destroySession(getSessionToken(req));
      clearSessionCookie(res);
      sendJson(res, 200, { ok: true });
      return;
    }

    if (action === "check" && req.method === "GET") {
      const user = await getSessionUser(req);
      if (!user) {
        sendJson(res, 401, { authenticated: false });
        return;
      }
      sendJson(res, 200, { authenticated: true, user });
      return;
    }

    sendJson(res, 404, { error: "Not found" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      sendJson(res, 400, { error: "Invalid login data", details: error.errors });
      return;
    }

    if (error.message === "Request body too large" || error.message === "Invalid JSON body") {
      sendJson(res, 400, { error: error.message });
      return;
    }

    console.error("Auth API error:", error);
    sendJson(res, 500, { error: "Authentication failed" });
  }
}

async function handleAdminBlogsApi(req, res, url) {
  if (req.method === "OPTIONS") {
    sendCorsOptions(res, "GET, POST, PUT, DELETE, OPTIONS");
    return;
  }

  const user = await getSessionUser(req);
  if (!canManageBlogs(user)) {
    sendJson(res, 401, { error: "Unauthorized" });
    return;
  }

  const rest = url.pathname
    .replace(new RegExp(`^${escapeRegExp(ADMIN_API_BASE)}/blogs/?`), "")
    .replace(/\/$/, "");
  const postId = rest || null;

  try {
    if (!postId && req.method === "GET") {
      const posts = await listAllBlogPosts();
      sendJson(res, 200, { posts });
      return;
    }

    if (!postId && req.method === "POST") {
      const body = await readJsonBody(req, 1024 * 1024);
      const validated = insertBlogPostSchema.parse({
        ...body,
        slug: body.slug?.trim() || slugify(body.title),
        author: body.author?.trim() || "Lizaz Team",
        date: body.date?.trim() || new Date().toISOString().slice(0, 10),
        published: body.published ?? true,
      });

      validated.slug = await ensureUniqueSlug(slugify(validated.slug) || slugify(validated.title));
      const post = await createBlogPost(validated);
      sendJson(res, 201, { post });
      return;
    }

    if (postId && req.method === "GET") {
      const post = await getBlogPostById(postId);
      if (!post) {
        sendJson(res, 404, { error: "Blog post not found" });
        return;
      }
      sendJson(res, 200, { post });
      return;
    }

    if (postId && req.method === "PUT") {
      const existing = await getBlogPostById(postId);
      if (!existing) {
        sendJson(res, 404, { error: "Blog post not found" });
        return;
      }

      const body = await readJsonBody(req, 1024 * 1024);
      const validated = insertBlogPostSchema.partial().parse(body);

      if (validated.slug || validated.title) {
        const nextSlug = slugify(validated.slug || validated.title || existing.slug);
        validated.slug = await ensureUniqueSlug(nextSlug, postId);
      }

      const post = await updateBlogPost(postId, validated);
      sendJson(res, 200, { post });
      return;
    }

    if (postId && req.method === "DELETE") {
      const post = await deleteBlogPost(postId);
      if (!post) {
        sendJson(res, 404, { error: "Blog post not found" });
        return;
      }
      sendJson(res, 200, { ok: true });
      return;
    }

    sendJson(res, 405, { error: "Method not allowed" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      sendJson(res, 400, {
        error: "Invalid blog data",
        details: error.errors,
      });
      return;
    }

    if (error.message === "Request body too large" || error.message === "Invalid JSON body") {
      sendJson(res, 400, { error: error.message });
      return;
    }

    console.error("Admin blogs API error:", error);
    sendJson(res, 500, { error: "Failed to manage blog posts" });
  }
}

async function handleAdminContactsApi(req, res) {
  if (req.method === "OPTIONS") {
    sendCorsOptions(res, "GET, OPTIONS");
    return;
  }

  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  const user = await getSessionUser(req);
  if (!canViewLeads(user)) {
    sendJson(res, 401, { error: "Unauthorized" });
    return;
  }

  try {
    const contacts = await listContacts();
    sendJson(res, 200, { contacts });
  } catch (error) {
    console.error("Failed to fetch contacts:", error);
    sendJson(res, 500, { error: "Failed to load inquiries" });
  }
}

function isSecretAdminPath(clean) {
  return clean === ADMIN_PATHNAME || clean.startsWith(`${ADMIN_PATHNAME}/`);
}

function isBlockedAdminProbe(clean) {
  const lower = clean.toLowerCase();
  return (
    lower === "/admin" ||
    lower.startsWith("/admin/") ||
    lower === "/admin.html" ||
    lower === "/admin.htm"
  );
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

  // Guessable admin URLs always 404
  if (isBlockedAdminProbe(clean)) {
    return null;
  }

  // Secret CMS path is handled by serveAdminPanel — never via static file serve
  if (isSecretAdminPath(clean)) {
    return null;
  }

  const relative = clean.replace(/^\//, "");
  const directPath = path.join(ROOT, relative);

  // Never expose private/server files or the 404 template as a normal page
  const resolvedDirect = path.resolve(directPath);
  const blockedFiles = [
    path.resolve(ADMIN_HTML_FILE),
    path.resolve(NOT_FOUND_HTML_FILE),
  ];
  if (blockedFiles.some((blocked) => resolvedDirect.toLowerCase() === blocked.toLowerCase())) {
    return null;
  }
  if (relative === "server" || relative.startsWith("server/") || relative.startsWith("server\\")) {
    return null;
  }

  if (fs.existsSync(directPath) && fs.statSync(directPath).isFile()) {
    return directPath;
  }

  const htmlPath = path.join(ROOT, `${relative}.html`);
  const resolvedHtml = path.resolve(htmlPath);
  if (blockedFiles.some((blocked) => resolvedHtml.toLowerCase() === blocked.toLowerCase())) {
    return null;
  }

  if (fs.existsSync(htmlPath) && fs.statSync(htmlPath).isFile()) {
    return htmlPath;
  }

  return null;
}

function serveAdminPanel(res) {
  fs.readFile(ADMIN_HTML_FILE, "utf8", (err, html) => {
    if (err) {
      serveNotFound(res);
      return;
    }

    const configScript = `<script>window.__LIZAZ_CMS__=${JSON.stringify({
      apiBase: ADMIN_API_BASE,
      panelPath: ADMIN_PATHNAME,
    })};</script>`;

    const injected = html.includes("<!-- CMS_CONFIG -->")
      ? html.replace("<!-- CMS_CONFIG -->", configScript)
      : html.replace(/<\/head>/i, `${configScript}</head>`);

    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow",
      "Cache-Control": "no-store",
    });
    res.end(injected);
  });
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

function serveNotFound(res, asJson = false) {
  if (asJson) {
    sendJson(res, 404, { error: "Not found" });
    return;
  }

  fs.readFile(NOT_FOUND_HTML_FILE, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      res.end(
        "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Page not found</title></head><body><h1>Page not found</h1><p><a href='/'>Back to home</a></p></body></html>"
      );
      return;
    }

    res.writeHead(404, {
      "Content-Type": "text/html; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow",
      "Cache-Control": "no-store",
    });
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

  if (url.pathname === "/api/blogs") {
    handleBlogsApi(req, res, url);
    return;
  }

  const cmsAuthPrefix = `${ADMIN_API_BASE}/auth`;
  const cmsBlogsPrefix = `${ADMIN_API_BASE}/blogs`;
  const cmsContactsPath = `${ADMIN_API_BASE}/contacts`;

  if (url.pathname === cmsAuthPrefix || url.pathname.startsWith(`${cmsAuthPrefix}/`)) {
    handleAuthApi(req, res, url);
    return;
  }

  if (url.pathname === cmsBlogsPrefix || url.pathname.startsWith(`${cmsBlogsPrefix}/`)) {
    handleAdminBlogsApi(req, res, url);
    return;
  }

  if (url.pathname === cmsContactsPath) {
    handleAdminContactsApi(req, res);
    return;
  }

  // Old/guessable admin API paths — hard 404
  if (
    url.pathname.startsWith("/api/auth") ||
    url.pathname.startsWith("/api/admin")
  ) {
    serveNotFound(res, true);
    return;
  }

  // Guessable /admin URLs look like a normal missing page
  if (isBlockedAdminProbe(url.pathname.replace(/\/+$/, "") || "/")) {
    serveNotFound(res);
    return;
  }

  if (isSecretAdminPath(url.pathname.replace(/\/+$/, "") || "/")) {
    serveAdminPanel(res);
    return;
  }

  const filePath = resolveFilePath(url.pathname);

  if (!filePath || !isInsideRoot(filePath)) {
    serveNotFound(res, url.pathname.startsWith("/api/"));
    return;
  }

  serveFile(filePath, res);
});

server.listen(PORT, () => {
  console.log(`Site running at http://localhost:${PORT}`);
  console.log(`CMS panel (keep private): http://localhost:${PORT}${ADMIN_PATHNAME}`);
  if (!process.env.ADMIN_PATH) {
    console.log(`Tip: set ADMIN_PATH in .env to customize the secret URL`);
  }
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
