(function () {
  const WHATSAPP_NUMBER = '';

  const NAV_ITEMS = [
    { href: '/', label: 'Home', id: 'home' },
    { href: '/about', label: 'About', id: 'about' },
    { href: '/services', label: 'Services', id: 'services' },
    { href: '/blog', label: 'Blog', id: 'blog' },
    { href: '/contact', label: 'Contact', id: 'contact' },
  ];

  const CONTACT_HREF = '/contact';

  const LOGO = {
    header: encodeURI('/attached_assets/logo/Lizaz Logo Final-01.png'),
    footer: encodeURI('/attached_assets/logo/Lizaz Logo Final-03.png'),
    alt: 'Lizaz',
  };

  function buildLogo(variant) {
    const src = variant === 'footer' ? LOGO.footer : LOGO.header;

    return `<a href="/" class="logo logo--${variant}" aria-label="Lizaz Home">
        <img
          src="${src}"
          alt="${LOGO.alt}"
          class="logo__img"
          width="300"
          height="64"
          decoding="async"
          onerror="this.closest('.logo').classList.add('logo--text')"
        >
        <span class="logo__text">Lizaz</span>
      </a>`;
  }

  function getCurrentPage() {
    return document.body.dataset.page || '';
  }

  function navLink(item, current) {
    const active = current === item.id ? ' nav__link--active' : '';
    return `<a href="${item.href}" class="nav__link${active}">${item.label}</a>`;
  }

  function buildTopBar() {
    return `<div class="topbar">
    <div class="container topbar__inner">
      <div class="topbar__contact">
        <a href="tel:+1234567890">+1 234 567 890</a>
        <a href="mailto:Info@lizaz.ae">Info@lizaz.ae</a>
      </div>
    </div>
  </div>`;
  }

  function buildHeader(current) {
    const navLinks = NAV_ITEMS.map((item) => navLink(item, current)).join('');
    const ctaActive = current === 'contact' ? ' nav__cta--active' : '';

    return `${buildTopBar()}<header class="header" id="header">
    <div class="container header__inner">
      ${buildLogo('header')}
      <nav class="nav" aria-label="Main navigation">${navLinks}</nav>
      <div class="header__actions">
        <a href="${CONTACT_HREF}" class="nav__cta${ctaActive}">Get in Touch</a>
        <button class="menu-toggle" id="menuToggle" aria-label="Open menu" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>
  </header>
  <nav class="mobile-nav" id="mobileNav" hidden aria-label="Mobile navigation">
    ${navLinks}
    <a href="${CONTACT_HREF}" class="nav__cta nav__cta--mobile${ctaActive}">Get in Touch</a>
  </nav>`;
  }

  function buildFooter() {
    return `<footer class="footer">
    <div class="container footer__main">
      <div class="footer__brand">
        ${buildLogo('footer')}
        <p class="footer__desc">Trusted document clearance, visa, immigration, golden visa, and business setup — delivered with care across the UAE.</p>
      </div>
      <div>
        <h3 class="footer__heading">Quick Links</h3>
        <ul class="footer__links">
          <li><a href="/">Home</a></li>
          <li><a href="/about">About Us</a></li>
          <li><a href="/services">Our Services</a></li>
          <li><a href="/blog">Blog</a></li>
        </ul>
      </div>
      <div>
        <h3 class="footer__heading">Our Services</h3>
        <ul class="footer__links">
          <li><a href="/services">Document Clearance</a></li>
          <li><a href="/services">Visa Services</a></li>
          <li><a href="/services">Immigration</a></li>
          <li><a href="/services">Golden Visa</a></li>
          <li><a href="/services">Business Setup</a></li>
          <li><a href="/services">Certificate Attestation</a></li>
        </ul>
      </div>
      <div>
        <h3 class="footer__heading">Contact</h3>
        <ul class="footer__links">
          <li><a href="tel:+1234567890">+1 234 567 890</a></li>
          <li><a href="mailto:support@lizaz.com">support@lizaz.com</a></li>
          <li><a href="/contact">Get in Touch</a></li>
          <li><a href="/contact">Book Appointment</a></li>
        </ul>
      </div>
    </div>
    <div class="footer__bottom">
      <div class="container footer__inner">
        <p class="footer__copy">&copy; ${new Date().getFullYear()} Lizaz. All rights reserved.</p>
      </div>
    </div>
  </footer>`;
  }

  function buildWhatsApp() {
    const href = WHATSAPP_NUMBER
      ? `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}`
      : '#';

    return `<a href="${href}" class="wa-float" id="waFloat" target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp">
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.883 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    </a>`;
  }

  function renderLayout() {
    const current = getCurrentPage();
    const headerEl = document.getElementById('site-header');
    const footerEl = document.getElementById('site-footer');

    if (headerEl) headerEl.outerHTML = buildHeader(current);
    if (footerEl) footerEl.outerHTML = buildFooter();

    if (!document.getElementById('waFloat')) {
      document.body.insertAdjacentHTML('beforeend', buildWhatsApp());
    }
  }

  renderLayout();
})();
