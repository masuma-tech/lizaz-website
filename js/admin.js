const BLOG_CATEGORIES = [
  "Business Setup",
  "Document Clearance",
  "Visa Services",
  "PRO Services",
  "Government Fees",
  "Company Formation",
  "Licensing",
  "General",
];

const CMS = window.__LIZAZ_CMS__ || {};
const API_BASE = CMS.apiBase || "";

/** If CMS config is missing, always show the public 404 page — never a CMS hint. */
function showPageNotFound() {
  window.location.replace(`/page-not-found?t=${Date.now()}`);
}

const state = {
  user: null,
  posts: [],
  contacts: [],
  selectedIds: new Set(),
  editingPost: null,
  slugTouched: false,
};

const els = {
  loginView: document.getElementById("login-view"),
  dashboardView: document.getElementById("dashboard-view"),
  loginForm: document.getElementById("login-form"),
  loginError: document.getElementById("login-error"),
  loginSubmit: document.getElementById("login-submit"),
  logoutBtn: document.getElementById("logout-btn"),
  userName: document.getElementById("user-name"),
  userRole: document.getElementById("user-role"),
  userAvatar: document.getElementById("user-avatar"),
  blogsView: document.getElementById("blogs-view"),
  inquiriesView: document.getElementById("inquiries-view"),
  blogsTbody: document.getElementById("blogs-tbody"),
  inquiriesTbody: document.getElementById("inquiries-tbody"),
  blogSearch: document.getElementById("blog-search"),
  categoryFilter: document.getElementById("blog-category-filter"),
  statusFilter: document.getElementById("blog-status-filter"),
  selectAll: document.getElementById("select-all-blogs"),
  selectedCount: document.getElementById("selected-count"),
  bulkDeleteBtn: document.getElementById("bulk-delete-btn"),
  dialog: document.getElementById("blog-dialog"),
  blogForm: document.getElementById("blog-form"),
  blogFormError: document.getElementById("blog-form-error"),
  dialogTitle: document.getElementById("blog-dialog-title"),
  dialogSubtitle: document.getElementById("blog-dialog-subtitle"),
  blogId: document.getElementById("blog-id"),
  blogTitle: document.getElementById("blog-title"),
  blogSlug: document.getElementById("blog-slug"),
  blogCategory: document.getElementById("blog-category"),
  blogAuthor: document.getElementById("blog-author"),
  blogDate: document.getElementById("blog-date"),
  blogImage: document.getElementById("blog-image"),
  blogExcerpt: document.getElementById("blog-excerpt"),
  blogContent: document.getElementById("blog-content"),
  blogPublished: document.getElementById("blog-published"),
  blogSaveBtn: document.getElementById("blog-save-btn"),
  toastRoot: document.getElementById("toast-root"),
  sidebar: document.getElementById("admin-sidebar"),
  shell: document.getElementById("dashboard-view"),
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function encodeAssetUrl(value) {
  return String(value ?? "")
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
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

function toast(message, type = "success") {
  const item = document.createElement("div");
  item.className = `admin-toast admin-toast--${type}`;
  item.textContent = message;
  els.toastRoot.appendChild(item);
  setTimeout(() => item.remove(), 3200);
}

function cmsUrl(path) {
  if (!API_BASE) {
    throw new Error("CMS is misconfigured. Reload the secret panel URL.");
  }
  return `${API_BASE}${path}`;
}

async function api(path, options = {}) {
  const { headers, ...rest } = options;
  const response = await fetch(path, {
    credentials: "include",
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(headers || {}),
    },
  });

  let data = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
  }

  if (!response.ok) {
    const error = new Error(data?.error || "Request failed");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

function showLogin() {
  els.loginView.hidden = false;
  els.dashboardView.hidden = true;
}

function showDashboard() {
  els.loginView.hidden = true;
  els.dashboardView.hidden = false;
}

function fillCategorySelects() {
  const options = BLOG_CATEGORIES.map(
    (category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`
  ).join("");
  els.blogCategory.innerHTML = options;
  refreshCategoryFilter();
}

function refreshCategoryFilter() {
  const current = els.categoryFilter.value || "all";
  const fromPosts = state.posts.map((post) => post.category).filter(Boolean);
  const categories = [...new Set([...BLOG_CATEGORIES, ...fromPosts])].sort();
  els.categoryFilter.innerHTML = [
    '<option value="all">All Categories</option>',
    ...categories.map(
      (category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`
    ),
  ].join("");
  els.categoryFilter.value = categories.includes(current) || current === "all" ? current : "all";
}

function updateUserUi() {
  const user = state.user;
  if (!user) return;

  const displayName = user.name || user.username;
  els.userName.textContent = displayName;
  els.userRole.textContent = user.isAdmin ? "Administrator" : "Editor";
  els.userAvatar.textContent = displayName.charAt(0).toUpperCase();

  document.querySelectorAll('[data-requires="leads"]').forEach((el) => {
    el.hidden = !(user.isAdmin || user.canViewLeads);
  });
}

function getFilteredPosts() {
  const query = els.blogSearch.value.trim().toLowerCase();
  const category = els.categoryFilter.value;
  const status = els.statusFilter.value;

  return state.posts.filter((post) => {
    const matchesQuery =
      !query ||
      post.title.toLowerCase().includes(query) ||
      post.excerpt.toLowerCase().includes(query) ||
      post.author.toLowerCase().includes(query) ||
      post.slug.toLowerCase().includes(query);

    const matchesCategory = category === "all" || post.category === category;
    const matchesStatus =
      status === "all" ||
      (status === "published" && post.published) ||
      (status === "draft" && !post.published);

    return matchesQuery && matchesCategory && matchesStatus;
  });
}

function updateStats() {
  const now = new Date();
  const published = state.posts.filter((p) => p.published).length;
  const categories = new Set(state.posts.map((p) => p.category)).size;
  const thisMonth = state.posts.filter((p) => {
    const date = new Date(p.date);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  document.getElementById("stat-total").textContent = String(state.posts.length);
  document.getElementById("stat-published").textContent = String(published);
  document.getElementById("stat-categories").textContent = String(categories);
  document.getElementById("stat-month").textContent = String(thisMonth);
}

function updateSelectionUi() {
  const count = state.selectedIds.size;
  els.selectedCount.hidden = count === 0;
  els.bulkDeleteBtn.hidden = count === 0;
  els.selectedCount.textContent = `${count} selected`;

  const filtered = getFilteredPosts();
  els.selectAll.checked =
    filtered.length > 0 && filtered.every((post) => state.selectedIds.has(post.id));
}

function renderBlogs() {
  const posts = getFilteredPosts();
  updateStats();
  updateSelectionUi();

  if (!posts.length) {
    els.blogsTbody.innerHTML = `
      <tr>
        <td colspan="7" class="admin-empty">
          No blog posts found.
          <div style="margin-top:0.75rem">
            <button type="button" class="admin-btn admin-btn--primary" id="empty-new-post">Create your first post</button>
          </div>
        </td>
      </tr>`;
    document.getElementById("empty-new-post")?.addEventListener("click", openCreateDialog);
    return;
  }

  els.blogsTbody.innerHTML = posts
    .map((post) => {
      const imageSrc = post.image?.startsWith("http")
        ? post.image
        : `/${encodeAssetUrl(post.image)}`;

      return `
      <tr data-id="${escapeHtml(post.id)}">
        <td class="admin-table__check">
          <input type="checkbox" class="row-select" data-id="${escapeHtml(post.id)}" ${
            state.selectedIds.has(post.id) ? "checked" : ""
          } />
        </td>
        <td>
          <div class="admin-post-cell">
            <img class="admin-post-thumb" src="${escapeHtml(imageSrc)}" alt="" onerror="this.style.opacity='0.25'" />
            <div>
              <strong title="${escapeHtml(post.title)}">${escapeHtml(post.title)}</strong>
              <span title="${escapeHtml(post.excerpt)}">${escapeHtml(post.excerpt)}</span>
            </div>
          </div>
        </td>
        <td><span class="admin-badge">${escapeHtml(post.category)}</span></td>
        <td>${escapeHtml(post.author)}</td>
        <td>${escapeHtml(post.date)}</td>
        <td>
          <span class="admin-badge ${post.published ? "admin-badge--published" : "admin-badge--draft"}">
            ${post.published ? "Published" : "Draft"}
          </span>
        </td>
        <td class="admin-table__actions">
          <div class="admin-row-actions">
            <a class="admin-btn admin-btn--outline" href="/blog?slug=${encodeURIComponent(post.slug)}" target="_blank" rel="noopener">View</a>
            <button type="button" class="admin-btn admin-btn--outline edit-post" data-id="${escapeHtml(post.id)}">Edit</button>
            <button type="button" class="admin-btn admin-btn--danger delete-post" data-id="${escapeHtml(post.id)}">Delete</button>
          </div>
        </td>
      </tr>`;
    })
    .join("");
}

function renderInquiries() {
  if (!state.contacts.length) {
    els.inquiriesTbody.innerHTML =
      '<tr><td colspan="6" class="admin-empty">No inquiries yet.</td></tr>';
    return;
  }

  els.inquiriesTbody.innerHTML = state.contacts
    .map((contact) => {
      const name = `${contact.firstName || ""} ${contact.lastName || ""}`.trim();
      const created = contact.createdAt
        ? new Date(contact.createdAt).toLocaleString()
        : "—";
      return `
      <tr>
        <td>${escapeHtml(name)}</td>
        <td><a href="mailto:${escapeHtml(contact.email)}">${escapeHtml(contact.email)}</a></td>
        <td>${escapeHtml(contact.phone || "—")}</td>
        <td>${escapeHtml(contact.service || "—")}</td>
        <td title="${escapeHtml(contact.message)}">${escapeHtml(
          String(contact.message || "").slice(0, 90)
        )}${String(contact.message || "").length > 90 ? "…" : ""}</td>
        <td>${escapeHtml(created)}</td>
      </tr>`;
    })
    .join("");
}

async function loadBlogs() {
  const data = await api(cmsUrl("/blogs"));
  state.posts = data.posts || [];
  state.selectedIds.clear();
  refreshCategoryFilter();
  renderBlogs();
}

async function loadInquiries() {
  if (!(state.user?.isAdmin || state.user?.canViewLeads)) return;
  const data = await api(cmsUrl("/contacts"));
  state.contacts = data.contacts || [];
  renderInquiries();
}

function switchView(view) {
  document.querySelectorAll(".admin-nav-card").forEach((link) => {
    link.classList.toggle("is-active", link.dataset.view === view);
  });
  els.blogsView.hidden = view !== "blogs";
  els.inquiriesView.hidden = view !== "inquiries";
  els.shell?.classList.remove("sidebar-open");

  if (view === "inquiries") loadInquiries().catch((err) => toast(err.message, "error"));
}

function openCreateDialog() {
  state.editingPost = null;
  state.slugTouched = false;
  els.dialogTitle.textContent = "New Blog Post";
  els.dialogSubtitle.textContent = "Fill in the details for your article";
  els.blogForm.reset();
  els.blogId.value = "";
  els.blogAuthor.value = "Lizaz Team";
  els.blogDate.value = new Date().toISOString().slice(0, 10);
  els.blogPublished.checked = true;
  els.blogFormError.hidden = true;
  els.dialog.hidden = false;
}

function openEditDialog(post) {
  state.editingPost = post;
  state.slugTouched = true;
  els.dialogTitle.textContent = "Edit Blog Post";
  els.dialogSubtitle.textContent = "Update the article details";
  els.blogId.value = post.id;
  els.blogTitle.value = post.title || "";
  els.blogSlug.value = post.slug || "";
  els.blogCategory.value = BLOG_CATEGORIES.includes(post.category)
    ? post.category
    : BLOG_CATEGORIES[0];
  if (!BLOG_CATEGORIES.includes(post.category) && post.category) {
    const option = document.createElement("option");
    option.value = post.category;
    option.textContent = post.category;
    els.blogCategory.appendChild(option);
    els.blogCategory.value = post.category;
  }
  els.blogAuthor.value = post.author || "Lizaz Team";
  els.blogDate.value = (post.date || "").slice(0, 10);
  els.blogImage.value = post.image || "";
  els.blogExcerpt.value = post.excerpt || "";
  els.blogContent.value = post.content || "";
  els.blogPublished.checked = Boolean(post.published);
  els.blogFormError.hidden = true;
  els.dialog.hidden = false;
}

function closeDialog() {
  els.dialog.hidden = true;
  state.editingPost = null;
}

async function saveBlog(event) {
  event.preventDefault();
  els.blogFormError.hidden = true;
  els.blogSaveBtn.disabled = true;
  els.blogSaveBtn.textContent = "Saving...";

  const payload = {
    title: els.blogTitle.value.trim(),
    slug: els.blogSlug.value.trim() || slugify(els.blogTitle.value),
    category: els.blogCategory.value,
    author: els.blogAuthor.value.trim() || "Lizaz Team",
    date: els.blogDate.value,
    image: els.blogImage.value.trim(),
    excerpt: els.blogExcerpt.value.trim(),
    content: els.blogContent.value.trim(),
    published: els.blogPublished.checked,
  };

  try {
    if (state.editingPost) {
      await api(cmsUrl(`/blogs/${state.editingPost.id}`), {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      toast("Blog post updated");
    } else {
      await api(cmsUrl("/blogs"), {
        method: "POST",
        body: JSON.stringify(payload),
      });
      toast("Blog post created");
    }
    closeDialog();
    await loadBlogs();
  } catch (error) {
    els.blogFormError.hidden = false;
    els.blogFormError.textContent = error.message || "Failed to save post";
  } finally {
    els.blogSaveBtn.disabled = false;
    els.blogSaveBtn.textContent = "Save Post";
  }
}

async function deletePost(id) {
  if (!confirm("Delete this blog post? This cannot be undone.")) return;
  try {
    await api(cmsUrl(`/blogs/${id}`), { method: "DELETE" });
    toast("Blog post deleted");
    await loadBlogs();
  } catch (error) {
    toast(error.message || "Failed to delete post", "error");
  }
}

async function bulkDelete() {
  const ids = [...state.selectedIds];
  if (!ids.length) return;
  if (!confirm(`Delete ${ids.length} selected posts? This cannot be undone.`)) return;

  try {
    await Promise.all(ids.map((id) => api(cmsUrl(`/blogs/${id}`), { method: "DELETE" })));
    toast(`${ids.length} posts deleted`);
    await loadBlogs();
  } catch (error) {
    toast(error.message || "Bulk delete failed", "error");
  }
}

function exportCsv() {
  if (!state.posts.length) {
    toast("No posts to export", "error");
    return;
  }

  const headers = ["ID", "Title", "Slug", "Category", "Author", "Date", "Published", "Excerpt"];
  const rows = state.posts.map((post) =>
    [
      post.id,
      `"${String(post.title).replaceAll('"', '""')}"`,
      post.slug,
      post.category,
      post.author,
      post.date,
      post.published ? "yes" : "no",
      `"${String(post.excerpt).replaceAll('"', '""').slice(0, 120)}"`,
    ].join(",")
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
  toast("Export complete");
}

async function handleLogin(event) {
  event.preventDefault();
  els.loginError.hidden = true;
  els.loginSubmit.disabled = true;
  els.loginSubmit.textContent = "Signing in...";

  const formData = new FormData(els.loginForm);
  try {
    const data = await api(cmsUrl("/auth/login"), {
      method: "POST",
      body: JSON.stringify({
        username: String(formData.get("username") || ""),
        password: String(formData.get("password") || ""),
      }),
    });
    state.user = data.user;
    updateUserUi();
    showDashboard();
    await loadBlogs();
    toast("Welcome to the admin panel");
  } catch (error) {
    els.loginError.hidden = false;
    els.loginError.textContent = error.message || "Invalid username or password";
  } finally {
    els.loginSubmit.disabled = false;
    els.loginSubmit.textContent = "Sign In";
  }
}

async function handleLogout() {
  try {
    await api(cmsUrl("/auth/logout"), { method: "POST" });
  } catch {
    // still clear local session UI
  }
  state.user = null;
  state.posts = [];
  state.contacts = [];
  showLogin();
}

async function bootstrap() {
  if (!API_BASE) {
    showPageNotFound();
    return;
  }

  fillCategorySelects();

  try {
    const data = await api(cmsUrl("/auth/check"));
    state.user = data.user;
    updateUserUi();
    showDashboard();
    await loadBlogs();
  } catch {
    showLogin();
  }
}

function bindEvents() {
  if (!API_BASE || !els.loginForm) return;

  els.loginForm.addEventListener("submit", handleLogin);
  els.logoutBtn.addEventListener("click", handleLogout);
  document.getElementById("new-post-btn").addEventListener("click", openCreateDialog);
  document.getElementById("refresh-blogs").addEventListener("click", () => {
    loadBlogs()
      .then(() => toast("Blog list refreshed"))
      .catch((err) => toast(err.message, "error"));
  });
  document.getElementById("export-blogs").addEventListener("click", exportCsv);
  document.getElementById("refresh-inquiries").addEventListener("click", () => {
    loadInquiries()
      .then(() => toast("Inquiries refreshed"))
      .catch((err) => toast(err.message, "error"));
  });
  document.getElementById("bulk-delete-btn").addEventListener("click", bulkDelete);
  document.getElementById("sidebar-toggle").addEventListener("click", () => {
    els.shell.classList.toggle("sidebar-open");
  });

  els.blogSearch.addEventListener("input", renderBlogs);
  els.categoryFilter.addEventListener("change", renderBlogs);
  els.statusFilter.addEventListener("change", renderBlogs);

  els.selectAll.addEventListener("change", () => {
    const filtered = getFilteredPosts();
    if (els.selectAll.checked) {
      filtered.forEach((post) => state.selectedIds.add(post.id));
    } else {
      filtered.forEach((post) => state.selectedIds.delete(post.id));
    }
    renderBlogs();
  });

  els.blogsTbody.addEventListener("click", (event) => {
    const editBtn = event.target.closest(".edit-post");
    if (editBtn) {
      const post = state.posts.find((item) => item.id === editBtn.dataset.id);
      if (post) openEditDialog(post);
      return;
    }

    const deleteBtn = event.target.closest(".delete-post");
    if (deleteBtn) {
      deletePost(deleteBtn.dataset.id);
    }
  });

  els.blogsTbody.addEventListener("change", (event) => {
    const checkbox = event.target.closest(".row-select");
    if (!checkbox) return;
    if (checkbox.checked) state.selectedIds.add(checkbox.dataset.id);
    else state.selectedIds.delete(checkbox.dataset.id);
    updateSelectionUi();
  });

  document.querySelectorAll(".admin-nav-card").forEach((link) => {
    link.addEventListener("click", () => switchView(link.dataset.view));
  });

  els.blogForm.addEventListener("submit", saveBlog);
  els.dialog.querySelectorAll("[data-close-dialog]").forEach((el) => {
    el.addEventListener("click", closeDialog);
  });

  els.blogTitle.addEventListener("input", () => {
    if (!state.slugTouched) {
      els.blogSlug.value = slugify(els.blogTitle.value);
    }
  });

  els.blogSlug.addEventListener("input", () => {
    state.slugTouched = Boolean(els.blogSlug.value.trim());
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !els.dialog.hidden) closeDialog();
  });
}

if (API_BASE) {
  bindEvents();
  bootstrap();
} else {
  showPageNotFound();
}
