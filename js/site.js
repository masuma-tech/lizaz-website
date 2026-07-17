(function () {
  const NAV_ITEMS = [
    { href: '/', label: 'Home', id: 'home' },
    { href: '/about', label: 'About Us', id: 'about' },
    { href: '/services', label: 'Our Services', id: 'services' },
    { href: '/blog', label: 'Blog', id: 'blog' },
    { href: '/contact', label: 'Contact Us', id: 'contact' },
  ];

  function getCurrentPage() {
    return document.body.dataset.page || '';
  }

  function navLink(item, current) {
    const active = current === item.id ? ' nav__link--active' : '';
    return `<a href="${item.href}" class="nav__link${active}">${item.label}</a>`;
  }

  function buildHeader(current) {
    const navLinks = NAV_ITEMS.map((item) => navLink(item, current)).join('');

    return `<header class="header" id="header">
    <div class="container header__inner">
      <a href="/" class="logo" aria-label="Lizaz Home">
        <span class="logo__text">Lizaz</span>
      </a>
      <nav class="nav" aria-label="Main navigation">${navLinks}</nav>
      <div class="header__actions">
        <button class="menu-toggle" id="menuToggle" aria-label="Open menu" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>
    <nav class="mobile-nav" id="mobileNav" hidden aria-label="Mobile navigation">
      ${navLinks}
    </nav>
  </header>`;
  }

  function buildFooter() {
    return `<footer class="footer">
    <div class="container footer__inner">
      <a href="/" class="logo" aria-label="Lizaz Home">
        <span class="logo__text">Lizaz</span>
      </a>
      <p class="footer__copy">&copy; ${new Date().getFullYear()} Lizaz</p>
    </div>
  </footer>`;
  }

  function renderLayout() {
    const current = getCurrentPage();
    const headerEl = document.getElementById('site-header');
    const footerEl = document.getElementById('site-footer');

    if (headerEl) headerEl.outerHTML = buildHeader(current);
    if (footerEl) footerEl.outerHTML = buildFooter();
  }

  renderLayout();
})();
