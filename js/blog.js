(function initBlogPage() {
  const grid = document.getElementById('blog-posts-grid');
  const featured = document.getElementById('blog-featured');
  if (!grid) return;

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function renderFeatured(post) {
    if (!featured || !post) return;

    const image = document.getElementById('blog-featured-image');
    const title = document.getElementById('featured-title');
    const excerpt = document.getElementById('blog-featured-excerpt');

    if (image) {
      image.src = post.image;
      image.alt = post.title;
    }
    if (title) title.textContent = post.title;
    if (excerpt) excerpt.textContent = post.excerpt || post.content;
    featured.hidden = false;
  }

  function renderCards(posts) {
    if (!posts.length) {
      grid.innerHTML = '<p class="section-text">No articles published yet. Check back soon.</p>';
      return;
    }

    grid.innerHTML = posts
      .map(
        (post) => `
      <article class="page-blog-card" data-slug="${escapeHtml(post.slug)}">
        <img src="${escapeHtml(post.image)}" alt="${escapeHtml(post.title)}" width="400" height="260" loading="lazy">
        <div class="page-blog-card__body">
          <span class="page-blog-card__tag">${escapeHtml(post.category)}</span>
          <h3 class="page-blog-card__title">${escapeHtml(post.title)}</h3>
          <p>${escapeHtml(post.excerpt)}</p>
          <div class="page-blog-card__meta">
            <time>${escapeHtml(post.date)}</time>
          </div>
        </div>
      </article>`
      )
      .join('');
  }

  async function loadPosts() {
    try {
      const response = await fetch('/api/blogs');
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load articles');
      }

      const posts = Array.isArray(data.posts) ? data.posts : [];
      renderFeatured(posts[0]);
      renderCards(posts);
    } catch (error) {
      console.error(error);
      grid.innerHTML =
        '<p class="section-text">Unable to load articles right now. Please refresh and try again.</p>';
    }
  }

  loadPosts();
})();
