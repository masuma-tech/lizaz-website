import { FormEvent, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { BLOG_CATEGORIES } from "@shared/blogCategories";
import type { BlogPost, Contact } from "@shared/schema";
import { encodeAssetUrl, slugify } from "@/lib/utils";
import "@/styles/admin.css";

type PublicUser = {
  id: string;
  username: string;
  name: string | null;
  isAdmin: boolean;
  canManageBlogs: boolean;
  canViewLeads: boolean;
};

type Props = {
  apiBase: string;
};

async function cmsFetch(url: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });
  const text = await response.text();
  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
  }
  if (!response.ok) {
    throw new Error(data?.error || "Request failed");
  }
  return data;
}

export default function Admin({ apiBase }: Props) {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [booting, setBooting] = useState(true);
  const [view, setView] = useState<"blogs" | "inquiries">("blogs");
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [loginError, setLoginError] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    category: BLOG_CATEGORIES[0] as string,
    author: "Lizaz Team",
    date: new Date().toISOString().slice(0, 10),
    image: "",
    excerpt: "",
    content: "",
    published: true,
  });

  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  }

  async function loadBlogs() {
    const data = await cmsFetch(`${apiBase}/blogs`);
    setPosts(data.posts || []);
    setSelectedIds(new Set());
  }

  async function loadInquiries() {
    if (!(user?.isAdmin || user?.canViewLeads)) return;
    const data = await cmsFetch(`${apiBase}/contacts`);
    setContacts(data.contacts || []);
  }

  useEffect(() => {
    document.title = "Lizaz CMS";
    document.body.classList.add("admin-body");
    return () => document.body.classList.remove("admin-body");
  }, []);

  useEffect(() => {
    if (!apiBase) {
      setLocation("/page-not-found");
      return;
    }
    cmsFetch(`${apiBase}/auth/check`)
      .then(async (data) => {
        setUser(data.user);
        await loadBlogs();
      })
      .catch(() => setUser(null))
      .finally(() => setBooting(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase]);

  const filteredPosts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return posts.filter((post) => {
      const matchesQuery =
        !query ||
        post.title.toLowerCase().includes(query) ||
        post.excerpt.toLowerCase().includes(query) ||
        post.author.toLowerCase().includes(query) ||
        post.slug.toLowerCase().includes(query);
      const matchesCategory = categoryFilter === "all" || post.category === categoryFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "published" && post.published) ||
        (statusFilter === "draft" && !post.published);
      return matchesQuery && matchesCategory && matchesStatus;
    });
  }, [posts, search, categoryFilter, statusFilter]);

  const stats = useMemo(() => {
    const now = new Date();
    return {
      total: posts.length,
      published: posts.filter((p) => p.published).length,
      categories: new Set(posts.map((p) => p.category)).size,
      month: posts.filter((p) => {
        const date = new Date(p.date);
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }).length,
    };
  }, [posts]);

  const categoryOptions = useMemo(() => {
    const fromPosts = posts.map((p) => p.category).filter(Boolean);
    return [...new Set([...BLOG_CATEGORIES, ...fromPosts])].sort();
  }, [posts]);

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoginError("");
    const data = new FormData(e.currentTarget);
    try {
      const result = await cmsFetch(`${apiBase}/auth/login`, {
        method: "POST",
        body: JSON.stringify({
          username: String(data.get("username") || ""),
          password: String(data.get("password") || ""),
        }),
      });
      setUser(result.user);
      await loadBlogs();
      showToast("Welcome to the admin panel");
    } catch (error: any) {
      setLoginError(error.message || "Invalid username or password");
    }
  }

  async function handleLogout() {
    try {
      await cmsFetch(`${apiBase}/auth/logout`, { method: "POST" });
    } catch {
      // ignore
    }
    setUser(null);
    setPosts([]);
    setContacts([]);
  }

  function openCreateDialog() {
    setEditingPost(null);
    setSlugTouched(false);
    setFormError("");
    setForm({
      title: "",
      slug: "",
      category: BLOG_CATEGORIES[0],
      author: "Lizaz Team",
      date: new Date().toISOString().slice(0, 10),
      image: "",
      excerpt: "",
      content: "",
      published: true,
    });
    setDialogOpen(true);
  }

  function openEditDialog(post: BlogPost) {
    setEditingPost(post);
    setSlugTouched(true);
    setFormError("");
    setForm({
      title: post.title || "",
      slug: post.slug || "",
      category: post.category || BLOG_CATEGORIES[0],
      author: post.author || "Lizaz Team",
      date: (post.date || "").slice(0, 10),
      image: post.image || "",
      excerpt: post.excerpt || "",
      content: post.content || "",
      published: Boolean(post.published),
    });
    setDialogOpen(true);
  }

  async function saveBlog(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    const payload = {
      ...form,
      title: form.title.trim(),
      slug: form.slug.trim() || slugify(form.title),
      author: form.author.trim() || "Lizaz Team",
      image: form.image.trim(),
      excerpt: form.excerpt.trim(),
      content: form.content.trim(),
    };
    try {
      if (editingPost) {
        await cmsFetch(`${apiBase}/blogs/${editingPost.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        showToast("Blog post updated");
      } else {
        await cmsFetch(`${apiBase}/blogs`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        showToast("Blog post created");
      }
      setDialogOpen(false);
      await loadBlogs();
    } catch (error: any) {
      setFormError(error.message || "Failed to save post");
    } finally {
      setSaving(false);
    }
  }

  async function deletePost(id: string) {
    if (!confirm("Delete this blog post? This cannot be undone.")) return;
    try {
      await cmsFetch(`${apiBase}/blogs/${id}`, { method: "DELETE" });
      showToast("Blog post deleted");
      await loadBlogs();
    } catch (error: any) {
      showToast(error.message || "Failed to delete post", "error");
    }
  }

  async function bulkDelete() {
    const ids = [...selectedIds];
    if (!ids.length) return;
    if (!confirm(`Delete ${ids.length} selected posts? This cannot be undone.`)) return;
    try {
      await Promise.all(ids.map((id) => cmsFetch(`${apiBase}/blogs/${id}`, { method: "DELETE" })));
      showToast(`${ids.length} posts deleted`);
      await loadBlogs();
    } catch (error: any) {
      showToast(error.message || "Bulk delete failed", "error");
    }
  }

  function exportCsv() {
    if (!posts.length) {
      showToast("No posts to export", "error");
      return;
    }
    const headers = ["ID", "Title", "Slug", "Category", "Author", "Date", "Published", "Excerpt"];
    const rows = posts.map((post) =>
      [
        post.id,
        `"${String(post.title).replaceAll('"', '""')}"`,
        post.slug,
        post.category,
        post.author,
        post.date,
        post.published ? "yes" : "no",
        `"${String(post.excerpt).replaceAll('"', '""').slice(0, 120)}"`,
      ].join(","),
    );
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `lizaz_blog_posts_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Export complete");
  }

  if (booting) {
    return (
      <div className="admin-login">
        <div className="admin-login__card">
          <p>Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <div className="admin-toast-root" aria-live="polite">
          {toast && <div className={`admin-toast admin-toast--${toast.type}`}>{toast.message}</div>}
        </div>
        <section className="admin-login">
          <div className="admin-login__card">
            <div className="admin-login__brand">
              <img
                src="/attached_assets/logo/Lizaz%20Logo%20Final-01.png"
                alt="Lizaz"
                width={200}
                height={64}
              />
            </div>
            <h1>Admin Panel</h1>
            <p>Sign in to manage blog posts and contact inquiries</p>
            <form className="admin-login__form" onSubmit={handleLogin}>
              <div className="admin-field">
                <label htmlFor="login-username">Username</label>
                <input id="login-username" name="username" type="text" autoComplete="username" required />
              </div>
              <div className="admin-field">
                <label htmlFor="login-password">Password</label>
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </div>
              {loginError && <p className="admin-form-error">{loginError}</p>}
              <button type="submit" className="admin-btn admin-btn--primary admin-btn--block">
                Sign In
              </button>
            </form>
          </div>
        </section>
      </>
    );
  }

  const displayName = user.name || user.username;
  const canViewLeads = user.isAdmin || user.canViewLeads;

  return (
    <>
      <div className="admin-toast-root" aria-live="polite">
        {toast && <div className={`admin-toast admin-toast--${toast.type}`}>{toast.message}</div>}
      </div>

      <div className={`admin-shell${sidebarOpen ? " sidebar-open" : ""}`}>
        <aside className="admin-sidebar">
          <div className="admin-sidebar__brand">
            <div className="admin-sidebar__logo-wrap">
              <img
                src="/attached_assets/logo/Lizaz%20Logo%20Final-03.png"
                alt="Lizaz"
                className="admin-sidebar__logo"
              />
            </div>
            <span className="admin-sidebar__label">Admin Panel</span>
          </div>
          <nav className="admin-sidebar__nav" aria-label="Admin">
            <button
              type="button"
              className={`admin-nav-card${view === "blogs" ? " is-active" : ""}`}
              onClick={() => {
                setView("blogs");
                setSidebarOpen(false);
              }}
            >
              <span className="admin-nav-card__text">
                <strong>Blog Posts</strong>
                <span>Articles &amp; updates</span>
              </span>
            </button>
            {canViewLeads && (
              <button
                type="button"
                className={`admin-nav-card${view === "inquiries" ? " is-active" : ""}`}
                onClick={() => {
                  setView("inquiries");
                  setSidebarOpen(false);
                  loadInquiries().catch((err) => showToast(err.message, "error"));
                }}
              >
                <span className="admin-nav-card__text">
                  <strong>Inquiries</strong>
                  <span>Website messages</span>
                </span>
              </button>
            )}
          </nav>
          <div className="admin-sidebar__footer">
            <div className="admin-user">
              <div className="admin-user__avatar">{displayName.charAt(0).toUpperCase()}</div>
              <div>
                <strong>{displayName}</strong>
                <span>{user.isAdmin ? "Administrator" : "Editor"}</span>
              </div>
            </div>
            <button type="button" className="admin-btn admin-btn--ghost admin-btn--block" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        </aside>

        <div className="admin-main">
          <header className="admin-topbar">
            <button
              type="button"
              className="admin-icon-btn"
              aria-label="Toggle menu"
              onClick={() => setSidebarOpen((v) => !v)}
            >
              ☰
            </button>
            <a href="/" className="admin-topbar__link" target="_blank" rel="noopener">
              View site
            </a>
          </header>

          {view === "blogs" && (
            <section className="admin-page">
              <div className="admin-page__header">
                <div>
                  <h1>Blog Posts</h1>
                  <p>Create, edit, and publish articles for the Lizaz website</p>
                </div>
                <div className="admin-page__actions">
                  <button
                    type="button"
                    className="admin-btn admin-btn--outline"
                    onClick={() =>
                      loadBlogs()
                        .then(() => showToast("Blog list refreshed"))
                        .catch((err) => showToast(err.message, "error"))
                    }
                  >
                    Refresh
                  </button>
                  <button type="button" className="admin-btn admin-btn--outline" onClick={exportCsv}>
                    Export
                  </button>
                  <button type="button" className="admin-btn admin-btn--primary" onClick={openCreateDialog}>
                    New Post
                  </button>
                </div>
              </div>

              <div className="admin-stats">
                <article className="admin-stat admin-stat--navy">
                  <span>Total Posts</span>
                  <strong>{stats.total}</strong>
                </article>
                <article className="admin-stat admin-stat--gold">
                  <span>Published</span>
                  <strong>{stats.published}</strong>
                </article>
                <article className="admin-stat admin-stat--blue">
                  <span>Categories</span>
                  <strong>{stats.categories}</strong>
                </article>
                <article className="admin-stat admin-stat--green">
                  <span>This Month</span>
                  <strong>{stats.month}</strong>
                </article>
              </div>

              <div className="admin-toolbar">
                <input
                  type="search"
                  placeholder="Search by title or excerpt…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                  <option value="all">All categories</option>
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">All status</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
                <div className="admin-toolbar__right">
                  {selectedIds.size > 0 && (
                    <>
                      <span className="admin-muted">{selectedIds.size} selected</span>
                      <button type="button" className="admin-btn admin-btn--danger" onClick={bulkDelete}>
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th className="admin-table__check">
                        <input
                          type="checkbox"
                          checked={
                            filteredPosts.length > 0 &&
                            filteredPosts.every((post) => selectedIds.has(post.id))
                          }
                          onChange={(e) => {
                            const next = new Set(selectedIds);
                            if (e.target.checked) filteredPosts.forEach((p) => next.add(p.id));
                            else filteredPosts.forEach((p) => next.delete(p.id));
                            setSelectedIds(next);
                          }}
                        />
                      </th>
                      <th>Post</th>
                      <th>Category</th>
                      <th>Author</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th className="admin-table__actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!filteredPosts.length && (
                      <tr>
                        <td colSpan={7} className="admin-empty">
                          No blog posts found.
                          <div style={{ marginTop: "0.75rem" }}>
                            <button type="button" className="admin-btn admin-btn--primary" onClick={openCreateDialog}>
                              Create your first post
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                    {filteredPosts.map((post) => {
                      const imageSrc = post.image?.startsWith("http")
                        ? post.image
                        : `/${encodeAssetUrl(post.image)}`;
                      return (
                        <tr key={post.id}>
                          <td className="admin-table__check">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(post.id)}
                              onChange={(e) => {
                                const next = new Set(selectedIds);
                                if (e.target.checked) next.add(post.id);
                                else next.delete(post.id);
                                setSelectedIds(next);
                              }}
                            />
                          </td>
                          <td>
                            <div className="admin-post-cell">
                              <img className="admin-post-thumb" src={imageSrc} alt="" />
                              <div>
                                <strong title={post.title}>{post.title}</strong>
                                <span title={post.excerpt}>{post.excerpt}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="admin-badge">{post.category}</span>
                          </td>
                          <td>{post.author}</td>
                          <td>{post.date}</td>
                          <td>
                            <span
                              className={`admin-badge ${
                                post.published ? "admin-badge--published" : "admin-badge--draft"
                              }`}
                            >
                              {post.published ? "Published" : "Draft"}
                            </span>
                          </td>
                          <td className="admin-table__actions">
                            <div className="admin-row-actions">
                              <a
                                className="admin-btn admin-btn--outline"
                                href={`/blog/${encodeURIComponent(post.slug)}`}
                                target="_blank"
                                rel="noopener"
                              >
                                View
                              </a>
                              <button
                                type="button"
                                className="admin-btn admin-btn--outline"
                                onClick={() => openEditDialog(post)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="admin-btn admin-btn--danger"
                                onClick={() => deletePost(post.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {view === "inquiries" && (
            <section className="admin-page">
              <div className="admin-page__header">
                <div>
                  <h1>Inquiries</h1>
                  <p>Messages submitted through the Lizaz contact form</p>
                </div>
                <div className="admin-page__actions">
                  <button
                    type="button"
                    className="admin-btn admin-btn--outline"
                    onClick={() =>
                      loadInquiries()
                        .then(() => showToast("Inquiries refreshed"))
                        .catch((err) => showToast(err.message, "error"))
                    }
                  >
                    Refresh
                  </button>
                </div>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Service</th>
                      <th>Message</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!contacts.length && (
                      <tr>
                        <td colSpan={6} className="admin-empty">
                          No inquiries yet.
                        </td>
                      </tr>
                    )}
                    {contacts.map((contact) => {
                      const name = `${contact.firstName || ""} ${contact.lastName || ""}`.trim();
                      const created = contact.createdAt
                        ? new Date(contact.createdAt).toLocaleString()
                        : "—";
                      const message = String(contact.message || "");
                      return (
                        <tr key={contact.id}>
                          <td>{name}</td>
                          <td>
                            <a href={`mailto:${contact.email}`}>{contact.email}</a>
                          </td>
                          <td>{contact.phone || "—"}</td>
                          <td>{contact.service || "—"}</td>
                          <td title={message}>
                            {message.slice(0, 90)}
                            {message.length > 90 ? "…" : ""}
                          </td>
                          <td>{created}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      </div>

      {dialogOpen && (
        <div className="admin-dialog">
          <div className="admin-dialog__backdrop" onClick={() => setDialogOpen(false)} />
          <div className="admin-dialog__panel" role="dialog" aria-modal="true">
            <div className="admin-dialog__header">
              <div>
                <h2>{editingPost ? "Edit Blog Post" : "New Blog Post"}</h2>
                <p>{editingPost ? "Update the details for this article" : "Add the details for this article"}</p>
              </div>
              <button type="button" className="admin-icon-btn" aria-label="Close" onClick={() => setDialogOpen(false)}>
                ✕
              </button>
            </div>
            <form className="admin-dialog__body" onSubmit={saveBlog}>
              <div className="admin-form-grid">
                <div className="admin-field admin-field--full">
                  <label htmlFor="blog-title">Title *</label>
                  <input
                    id="blog-title"
                    required
                    maxLength={200}
                    value={form.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      setForm((prev) => ({
                        ...prev,
                        title,
                        slug: slugTouched ? prev.slug : slugify(title),
                      }));
                    }}
                  />
                </div>
                <div className="admin-field">
                  <label htmlFor="blog-slug">Slug</label>
                  <input
                    id="blog-slug"
                    value={form.slug}
                    placeholder="auto-generated-from-title"
                    onChange={(e) => {
                      setSlugTouched(Boolean(e.target.value.trim()));
                      setForm((prev) => ({ ...prev, slug: e.target.value }));
                    }}
                  />
                </div>
                <div className="admin-field">
                  <label htmlFor="blog-category">Category *</label>
                  <select
                    id="blog-category"
                    required
                    value={form.category}
                    onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                  >
                    {[...new Set([form.category, ...BLOG_CATEGORIES])].map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="admin-field">
                  <label htmlFor="blog-author">Author</label>
                  <input
                    id="blog-author"
                    value={form.author}
                    onChange={(e) => setForm((prev) => ({ ...prev, author: e.target.value }))}
                  />
                </div>
                <div className="admin-field">
                  <label htmlFor="blog-date">Date *</label>
                  <input
                    id="blog-date"
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div className="admin-field admin-field--full">
                  <label htmlFor="blog-image">Image path or URL *</label>
                  <input
                    id="blog-image"
                    required
                    placeholder="Blog/Article Name/banner.jpg"
                    value={form.image}
                    onChange={(e) => setForm((prev) => ({ ...prev, image: e.target.value }))}
                  />
                </div>
                <div className="admin-field admin-field--full">
                  <label htmlFor="blog-excerpt">Excerpt *</label>
                  <textarea
                    id="blog-excerpt"
                    rows={3}
                    required
                    maxLength={500}
                    value={form.excerpt}
                    onChange={(e) => setForm((prev) => ({ ...prev, excerpt: e.target.value }))}
                  />
                </div>
                <div className="admin-field admin-field--full">
                  <label htmlFor="blog-content">Content *</label>
                  <textarea
                    id="blog-content"
                    rows={12}
                    required
                    value={form.content}
                    onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                  />
                </div>
                <div className="admin-field admin-field--full admin-field--inline">
                  <label className="admin-checkbox">
                    <input
                      type="checkbox"
                      checked={form.published}
                      onChange={(e) => setForm((prev) => ({ ...prev, published: e.target.checked }))}
                    />
                    <span>Published — visible on the public blog</span>
                  </label>
                </div>
              </div>
              {formError && <p className="admin-form-error">{formError}</p>}
              <div className="admin-dialog__footer">
                <button type="button" className="admin-btn admin-btn--outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
                  {saving ? "Saving..." : "Save Post"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
