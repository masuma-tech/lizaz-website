import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import path from "path";
import express from "express";
import { z } from "zod";
import { sendContactNotificationEmail } from "./email";
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
} from "./storage";
import { insertBlogPostSchema } from "@shared/schema";
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
} from "./auth";
import { ADMIN_API_BASE, ADMIN_PATHNAME } from "./adminPath";

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

function slugify(value: string) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

async function ensureUniqueSlug(baseSlug: string, excludeId: string | null = null) {
  let slug = baseSlug || `post-${Date.now()}`;
  let attempt = 1;

  while (true) {
    const existing = await getBlogPostBySlug(slug);
    if (!existing || (excludeId && existing.id === excludeId)) return slug;
    attempt += 1;
    slug = `${baseSlug}-${attempt}`;
  }
}

function requireManageBlogs(req: Request, res: Response, next: NextFunction) {
  void getSessionUser(req).then((user) => {
    if (!canManageBlogs(user)) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    next();
  });
}

function requireViewLeads(req: Request, res: Response, next: NextFunction) {
  void getSessionUser(req).then((user) => {
    if (!canViewLeads(user)) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    next();
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  const root = path.resolve(import.meta.dirname, "..");

  // Static assets used by CSS background urls and blog images
  app.use("/attached_assets", express.static(path.join(root, "attached_assets")));
  app.use("/Blog", express.static(path.join(root, "Blog")));
  app.use("/blog-images", express.static(path.join(root, "Blog")));

  app.get("/api/config", (_req, res) => {
    res.json({
      adminPath: ADMIN_PATHNAME,
      adminApiBase: ADMIN_API_BASE,
    });
  });

  app.options("/api/contact", (_req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.sendStatus(204);
  });

  app.post("/api/contact", async (req, res) => {
    try {
      const validated = contactSchema.parse(req.body);
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

      res.status(201).json({ ok: true, emailSent });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid contact data", details: error.errors });
        return;
      }
      console.error("Failed to submit contact form:", error);
      res.status(500).json({ error: "Failed to submit inquiry" });
    }
  });

  app.get("/api/blogs", async (req, res) => {
    try {
      const slug = typeof req.query.slug === "string" ? req.query.slug : "";
      if (slug) {
        const post = await getBlogPostBySlug(slug);
        if (!post || !post.published) {
          res.status(404).json({ error: "Blog post not found" });
          return;
        }
        res.json({ post });
        return;
      }

      const posts = await listPublishedBlogPosts();
      res.json({ posts });
    } catch (error) {
      console.error("Failed to fetch blog posts:", error);
      res.status(500).json({ error: "Failed to load blog posts" });
    }
  });

  // Block guessable admin API paths
  app.use("/api/auth", (_req, res) => {
    res.status(404).json({ error: "Not found" });
  });
  app.use("/api/admin", (_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  app.post(`${ADMIN_API_BASE}/auth/login`, async (req, res) => {
    try {
      const validated = loginSchema.parse(req.body);
      const user = await authenticateUser(validated.username, validated.password);

      if (!user || (!user.isAdmin && !user.canManageBlogs && !user.canViewLeads)) {
        res.status(401).json({ error: "Invalid username or password" });
        return;
      }

      const token = createSession(user.id);
      setSessionCookie(res, token);
      res.json({ user: toPublicUser(user) });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid login data", details: error.errors });
        return;
      }
      console.error("Auth API error:", error);
      res.status(500).json({ error: "Authentication failed" });
    }
  });

  app.post(`${ADMIN_API_BASE}/auth/logout`, (req, res) => {
    destroySession(getSessionToken(req));
    clearSessionCookie(res);
    res.json({ ok: true });
  });

  app.get(`${ADMIN_API_BASE}/auth/check`, async (req, res) => {
    const user = await getSessionUser(req);
    if (!user) {
      res.status(401).json({ authenticated: false });
      return;
    }
    res.json({ authenticated: true, user });
  });

  app.get(`${ADMIN_API_BASE}/blogs`, requireManageBlogs, async (_req, res) => {
    try {
      const posts = await listAllBlogPosts();
      res.json({ posts });
    } catch (error) {
      console.error("Admin blogs API error:", error);
      res.status(500).json({ error: "Failed to manage blog posts" });
    }
  });

  app.post(`${ADMIN_API_BASE}/blogs`, requireManageBlogs, async (req, res) => {
    try {
      const body = req.body;
      const validated = insertBlogPostSchema.parse({
        ...body,
        slug: body.slug?.trim() || slugify(body.title),
        author: body.author?.trim() || "Lizaz Team",
        date: body.date?.trim() || new Date().toISOString().slice(0, 10),
        published: body.published ?? true,
      });

      validated.slug = await ensureUniqueSlug(slugify(validated.slug) || slugify(validated.title));
      const post = await createBlogPost(validated);
      res.status(201).json({ post });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid blog data", details: error.errors });
        return;
      }
      console.error("Admin blogs API error:", error);
      res.status(500).json({ error: "Failed to manage blog posts" });
    }
  });

  app.get(`${ADMIN_API_BASE}/blogs/:id`, requireManageBlogs, async (req, res) => {
    try {
      const post = await getBlogPostById(req.params.id);
      if (!post) {
        res.status(404).json({ error: "Blog post not found" });
        return;
      }
      res.json({ post });
    } catch (error) {
      console.error("Admin blogs API error:", error);
      res.status(500).json({ error: "Failed to manage blog posts" });
    }
  });

  app.put(`${ADMIN_API_BASE}/blogs/:id`, requireManageBlogs, async (req, res) => {
    try {
      const existing = await getBlogPostById(req.params.id);
      if (!existing) {
        res.status(404).json({ error: "Blog post not found" });
        return;
      }

      const validated = insertBlogPostSchema.partial().parse(req.body);

      if (validated.slug || validated.title) {
        const nextSlug = slugify(validated.slug || validated.title || existing.slug);
        validated.slug = await ensureUniqueSlug(nextSlug, req.params.id);
      }

      const post = await updateBlogPost(req.params.id, validated);
      res.json({ post });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid blog data", details: error.errors });
        return;
      }
      console.error("Admin blogs API error:", error);
      res.status(500).json({ error: "Failed to manage blog posts" });
    }
  });

  app.delete(`${ADMIN_API_BASE}/blogs/:id`, requireManageBlogs, async (req, res) => {
    try {
      const post = await deleteBlogPost(req.params.id);
      if (!post) {
        res.status(404).json({ error: "Blog post not found" });
        return;
      }
      res.json({ ok: true });
    } catch (error) {
      console.error("Admin blogs API error:", error);
      res.status(500).json({ error: "Failed to manage blog posts" });
    }
  });

  app.get(`${ADMIN_API_BASE}/contacts`, requireViewLeads, async (_req, res) => {
    try {
      const contacts = await listContacts();
      res.json({ contacts });
    } catch (error) {
      console.error("Failed to fetch contacts:", error);
      res.status(500).json({ error: "Failed to load inquiries" });
    }
  });

  return createServer(app);
}
