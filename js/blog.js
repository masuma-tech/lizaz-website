(function initBlogPage() {
  const grid = document.getElementById('blog-posts-grid');
  const featured = document.getElementById('blog-featured');
  const listView = document.getElementById('blog-list-view');
  const articleView = document.getElementById('blog-article-view');
  const filtersEl = document.getElementById('blog-filters');
  const countEl = document.getElementById('blog-posts-count');
  if (!grid || !listView || !articleView) return;

  let allPosts = [];
  let activeCategory = 'All';

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function encodeAssetUrl(value) {
    return String(value ?? '')
      .split('/')
      .map((part) => encodeURIComponent(part))
      .join('/');
  }

  function getSlugFromUrl() {
    return new URLSearchParams(window.location.search).get('slug')?.trim() || '';
  }

  function getCategories(posts) {
    return ['All', ...Array.from(new Set(posts.map((post) => post.category).filter(Boolean))).sort()];
  }

  function getFilteredPosts() {
    if (activeCategory === 'All') return allPosts;
    return allPosts.filter((post) => post.category === activeCategory);
  }

  function updateCount() {
    if (!countEl) return;
    countEl.textContent = 'Expert Guides by Lizaz';
  }

  function renderFilters(posts) {
    if (!filtersEl) return;
    const categories = getCategories(posts);
    filtersEl.innerHTML = categories
      .map(
        (category) => `
      <button
        type="button"
        class="page-blog__filter${category === activeCategory ? ' is-active' : ''}"
        data-category="${escapeHtml(category)}"
        aria-pressed="${category === activeCategory ? 'true' : 'false'}"
      >
        ${escapeHtml(category)}
      </button>`
      )
      .join('');
  }

  function applyFilter(category) {
    activeCategory = category;
    const filtered = getFilteredPosts();
    renderFilters(allPosts);
    renderCards(filtered);
    updateCount();
  }

  function looksLikeHeading(paragraph) {
    const text = paragraph.trim();
    if (!text || text.length > 90) return false;
    if (text.endsWith('?')) return true;
    if (/^\d+[\.\)]\s+\S/.test(text)) return true;
    if (/^[-•●▪]\s+\S/.test(text)) return true;
    if (/[.!,;:]$/.test(text)) return false;
    const words = text.split(/\s+/);
    return words.length > 0 && words.length <= 12;
  }

  function formatContent(content) {
    const blocks = String(content ?? '')
      .replaceAll('\r\n', '\n')
      .split(/\n\s*\n/)
      .map((block) => block.trim())
      .filter(Boolean);

    if (!blocks.length) {
      return '<p>No content available for this article.</p>';
    }

    return blocks
      .map((block) => {
        const html = escapeHtml(block).replaceAll('\n', '<br>');
        if (looksLikeHeading(block)) {
          return `<h2>${html}</h2>`;
        }
        if (/^[-•●▪]\s+/.test(block)) {
          return `<p class="page-blog-article__list-item">${html}</p>`;
        }
        return `<p>${html}</p>`;
      })
      .join('');
  }

  function showListView() {
    listView.hidden = false;
    articleView.hidden = true;
    document.title = 'Blog | UAE Visa, Golden Visa & Business Setup Guides — Lizaz';
  }

  function showArticleView() {
    listView.hidden = true;
    articleView.hidden = false;
    window.scrollTo(0, 0);
  }

  function renderFeatured(post) {
    if (!featured || !post) return;

    const image = document.getElementById('blog-featured-image');
    const title = document.getElementById('featured-title');
    const excerpt = document.getElementById('blog-featured-excerpt');
    const link = document.getElementById('blog-featured-link');

    if (image) {
      image.src = encodeAssetUrl(post.image);
      image.alt =
        'Lizaz helps you clear the entire path, from attestation to approval';
    }
    if (title) {
      title.textContent =
        'Lizaz helps you clear the entire path, from attestation to approval';
    }
    if (excerpt) {
      excerpt.textContent =
        'This guide walks through each UAE visa type in plain language, the documents required for visa applications, and where applicants most often get tripped up during UAE visa processing.';
    }
    if (link) link.href = `/blog?slug=${encodeURIComponent(post.slug)}`;
    featured.hidden = false;
  }

  function renderCards(posts) {
    if (!posts.length) {
      grid.innerHTML =
        activeCategory === 'All'
          ? '<p class="section-text">No articles published yet. Check back soon.</p>'
          : `<p class="section-text">No articles in ${escapeHtml(activeCategory)} yet. Try another topic.</p>`;
      return;
    }

    grid.innerHTML = posts
      .map(
        (post) => `
      <a class="page-blog-card" href="/blog?slug=${encodeURIComponent(post.slug)}">
        <img src="${escapeHtml(encodeAssetUrl(post.image))}" alt="${escapeHtml(post.title)}" width="400" height="260" loading="lazy">
        <div class="page-blog-card__body">
          <span class="page-blog-card__tag">${escapeHtml(post.category)}</span>
          <h3 class="page-blog-card__title">${escapeHtml(post.title)}</h3>
          <p>${escapeHtml(post.excerpt)}</p>
          <div class="page-blog-card__meta">
            <time>${escapeHtml(post.date)}</time>
            <span class="page-blog-card__more">Read more</span>
          </div>
        </div>
      </a>`
      )
      .join('');
  }

  function renderArticle(post) {
    const loading = document.getElementById('blog-article-loading');
    const article = document.getElementById('blog-article');
    const error = document.getElementById('blog-article-error');
    const title = document.getElementById('blog-article-title');
    const category = document.getElementById('blog-article-category');
    const author = document.getElementById('blog-article-author');
    const date = document.getElementById('blog-article-date');
    const image = document.getElementById('blog-article-image');
    const content = document.getElementById('blog-article-content');

    if (loading) loading.hidden = true;
    if (error) error.hidden = true;
    if (article) article.hidden = false;

    if (title) title.textContent = post.title;
    if (category) category.textContent = post.category;
    if (author) author.textContent = post.author || 'Lizaz Team';
    if (date) {
      date.textContent = post.date;
      date.dateTime = post.date;
    }
    if (image) {
      image.src = encodeAssetUrl(post.image);
      image.alt = post.title;
    }
    if (content) content.innerHTML = formatContent(post.content);

    document.title = `${post.title} — Lizaz Blog`;
  }

  function renderArticleError() {
    const loading = document.getElementById('blog-article-loading');
    const article = document.getElementById('blog-article');
    const error = document.getElementById('blog-article-error');
    if (loading) loading.hidden = true;
    if (article) article.hidden = true;
    if (error) error.hidden = false;
  }

  async function loadPosts() {
    try {
      const response = await fetch('/api/blogs');
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load articles');
      }

      allPosts = Array.isArray(data.posts) ? data.posts : [];
      activeCategory = 'All';
      renderFeatured(allPosts[0]);
      renderFilters(allPosts);
      renderCards(allPosts);
      updateCount();

      const heroStat = document.querySelector('.page-hero--split__stat');
      if (heroStat && allPosts.length) {
        heroStat.textContent = `${allPosts.length}+`;
      }
    } catch (error) {
      console.error(error);
      grid.innerHTML =
        '<p class="section-text">Unable to load articles right now. Please refresh and try again.</p>';
    }
  }

  if (filtersEl) {
    filtersEl.addEventListener('click', (event) => {
      const button = event.target.closest('[data-category]');
      if (!button) return;
      applyFilter(button.getAttribute('data-category') || 'All');
    });
  }

  async function loadArticle(slug) {
    showArticleView();
    const loading = document.getElementById('blog-article-loading');
    const article = document.getElementById('blog-article');
    const error = document.getElementById('blog-article-error');
    if (loading) loading.hidden = false;
    if (article) article.hidden = true;
    if (error) error.hidden = true;

    try {
      const response = await fetch(`/api/blogs?slug=${encodeURIComponent(slug)}`);
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.post) {
        throw new Error(data.error || 'Article not found');
      }

      renderArticle(data.post);
    } catch (error) {
      console.error(error);
      renderArticleError();
    }
  }

  async function init() {
    const slug = getSlugFromUrl();
    if (slug) {
      await loadArticle(slug);
      return;
    }

    showListView();
    await loadPosts();
  }

  window.addEventListener('popstate', () => {
    init();
  });

  init();
})();
