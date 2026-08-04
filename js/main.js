const menuToggle = document.getElementById('menuToggle');
const mobileNav = document.getElementById('mobileNav');

function setMenuOpen(open) {
  if (!menuToggle || !mobileNav) return;
  mobileNav.hidden = !open;
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.classList.toggle('is-open', open);
  menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  document.body.classList.toggle('menu-open', open);
}

menuToggle?.addEventListener('click', (event) => {
  event.stopPropagation();
  setMenuOpen(Boolean(mobileNav?.hidden));
});

mobileNav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => setMenuOpen(false));
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') setMenuOpen(false);
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 960) setMenuOpen(false);
});

window.addEventListener('scroll', () => {
  const header = document.getElementById('header');
  if (header) header.classList.toggle('header--scrolled', window.scrollY > 24);
}, { passive: true });

// FAQ accordion
document.querySelectorAll('.faq-accordion__trigger').forEach((trigger) => {
  trigger.addEventListener('click', () => {
    const item = trigger.closest('.faq-accordion__item');
    const panel = item?.querySelector('.faq-accordion__panel');
    const isOpen = item.classList.contains('is-open');

    document.querySelectorAll('.faq-accordion__item').forEach((el) => {
      el.classList.remove('is-open');
      const elTrigger = el.querySelector('.faq-accordion__trigger');
      const elPanel = el.querySelector('.faq-accordion__panel');
      elTrigger?.setAttribute('aria-expanded', 'false');
      elPanel?.setAttribute('hidden', '');
    });

    if (!isOpen) {
      item.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
      panel?.removeAttribute('hidden');
    }
  });
});

// Testimonial slider
const slider = document.querySelector('[data-testimonial-slider]');
if (slider) {
  const slides = Array.from(slider.querySelectorAll('.testimonial-slide'));
  let index = 0;
  let animating = false;

  const showSlide = (next) => {
    if (animating || slides.length < 2) return;
    animating = true;

    const current = slides[index];
    const target = (next + slides.length) % slides.length;

    current.classList.add('is-leaving');
    current.classList.remove('is-active');

    window.setTimeout(() => {
      index = target;
      slides[index].classList.add('is-active', 'is-entering');
      current.classList.remove('is-leaving');

      window.setTimeout(() => {
        slides[index].classList.remove('is-entering');
        animating = false;
      }, 520);
    }, 180);
  };

  slider.querySelector('[data-testimonial-prev]')?.addEventListener('click', () => showSlide(index - 1));
  slider.querySelector('[data-testimonial-next]')?.addEventListener('click', () => showSlide(index + 1));
}

// Motion system
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function addReveal(el, variant = 'reveal-up', delay = null) {
  if (!el) return;
  el.classList.add('reveal', variant);
  if (delay != null) el.style.setProperty('--reveal-delay', delay);
}

function addStaggerReveal(elements, step = 0.07, variant = 'reveal-pop') {
  elements.forEach((el, i) => {
    el.classList.add('reveal', variant);
    el.style.setProperty('--reveal-delay', `${i * step}s`);
  });
}

function setupSectionMotion() {
  document.querySelectorAll('section.reveal').forEach((section) => {
    section.classList.remove('reveal');

    section.querySelectorAll('.section-header').forEach((el) => addReveal(el, 'reveal-up'));

    addReveal(section.querySelector('.home-about__media'), 'reveal-left');
    addReveal(section.querySelector('.home-about__content'), 'reveal-right');
    addReveal(section.querySelector('.home-quote__media'), 'reveal-left');
    addReveal(section.querySelector('.home-quote__content'), 'reveal-right');
    addReveal(section.querySelector('.home-contact__media'), 'reveal-left');
    addReveal(section.querySelector('.home-contact__form-wrap'), 'reveal-right');
    addReveal(section.querySelector('.page-contact-form__intro'), 'reveal-left');
    addReveal(section.querySelector('.page-contact-form__wrap'), 'reveal-right');
    addReveal(section.querySelector('.testimonial-split__content'), 'reveal-up');
    addReveal(section.querySelector('.testimonial-split__media'), 'reveal-pop', '0.15s');
    addReveal(section.querySelector('.about-intro__media'), 'reveal-left');
    addReveal(section.querySelector('.about-intro__content'), 'reveal-right');
    addReveal(section.querySelector('.about-commitment__content'), 'reveal-left');
    addReveal(section.querySelector('.about-commitment__media'), 'reveal-right');
    addReveal(section.querySelector('.about-cta__inner'), 'reveal-pop');

    addStaggerReveal(section.querySelectorAll('.service-card'), 0.07);
    addStaggerReveal(section.querySelectorAll('.page-service-card'), 0.07);
    addStaggerReveal(section.querySelectorAll('.why-card'), 0.06);
    addStaggerReveal(section.querySelectorAll('.process-card'), 0.08);
    addStaggerReveal(section.querySelectorAll('.home-blog__grid .blog-card'), 0.08);
    addStaggerReveal(section.querySelectorAll('.page-blog__grid .page-blog-card'), 0.08);
    addStaggerReveal(section.querySelectorAll('.faq-accordion__item'), 0.05, 'reveal-up');
    addStaggerReveal(section.querySelectorAll('.about-stat'), 0.08);
    addStaggerReveal(section.querySelectorAll('.about-value-card'), 0.07);
    addStaggerReveal(section.querySelectorAll('.about-team-card'), 0.1);

    addReveal(section.querySelector('.faq-cta'), 'reveal-pop', '0.35s');
    addReveal(section.querySelector('.process-timeline__line'), 'reveal-fade', '0.2s');
  });

  addStaggerReveal(document.querySelectorAll('.home-hero__stats .hero-stat'), 0.12);
}

function initScrollReveal() {
  if (prefersReducedMotion) {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
    return;
  }

  setupSectionMotion();

  document.querySelectorAll('.home-hero__stats .hero-stat.reveal').forEach((el, i) => {
    window.setTimeout(() => el.classList.add('is-visible'), 450 + i * 120);
  });

  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14, rootMargin: '0px 0px -48px 0px' }
  );

  document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));
}

function initHeroParallax() {
  if (prefersReducedMotion) return;

  const heroBg = document.querySelector('.home-hero__bg');
  if (!heroBg) return;

  let ticking = false;

  const update = () => {
    const offset = Math.min(window.scrollY * 0.22, 120);
    heroBg.style.transform = `scale(1.01) translateY(${-offset}px)`;
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });

  update();
}

initScrollReveal();
initHeroParallax();

function parseCountStat(text) {
  const value = text.trim();
  if (!/\d/.test(value)) return null;
  if (/[–-]\d/.test(value)) return null;

  const kMatch = value.match(/^([\d,]+)K(\+)?$/i);
  if (kMatch) {
    const target = parseInt(kMatch[1].replace(/,/g, ''), 10) * 1000;
    const plus = kMatch[2] || '';
    return {
      target,
      format: (n) => {
        if (n >= 1000) return `${Math.round(n / 1000)}K${plus}`;
        return `${n}${plus}`;
      },
    };
  }

  const match = value.match(/^([\d,]+)(.*)$/);
  if (!match) return null;

  const target = parseInt(match[1].replace(/,/g, ''), 10);
  if (Number.isNaN(target)) return null;

  const suffix = match[2];
  const useCommas = match[1].includes(',');

  return {
    target,
    format: (n) => {
      const num = useCommas ? n.toLocaleString('en-US') : String(n);
      return `${num}${suffix}`;
    },
  };
}

function animateCountUp(el, options = {}) {
  const original = el.textContent.trim();
  const parsed = parseCountStat(original);
  if (!parsed) return;

  const { target, format } = parsed;
  if (target <= 1) {
    el.textContent = original;
    return;
  }

  const duration = options.duration ?? Math.min(2200, 900 + target * 8);
  const delay = options.delay ?? 0;
  const startedAt = performance.now();

  el.textContent = format(1);

  function tick(now) {
    if (now - startedAt < delay) {
      requestAnimationFrame(tick);
      return;
    }

    const elapsed = now - startedAt - delay;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - (1 - progress) ** 3;
    const current = Math.max(1, Math.round(eased * target));

    el.textContent = format(current);

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      el.textContent = original;
    }
  }

  requestAnimationFrame(tick);
}

function initCountUpStats() {
  if (prefersReducedMotion) return;

  const runCount = (el, delay = 0) => {
    if (el.dataset.countAnimated === 'true') return;
    el.dataset.countAnimated = 'true';
    animateCountUp(el, { delay });
  };

  document.querySelectorAll('.page-hero--split__stat').forEach((el, i) => {
    runCount(el, 350 + i * 140);
  });

  document.querySelectorAll('.hero-stat__value').forEach((el, i) => {
    runCount(el, 450 + i * 120);
  });

  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.about-stat__value').forEach((el, i) => {
      runCount(el, i * 120);
    });
    return;
  }

  document.querySelectorAll('.about-stat').forEach((stat, i) => {
    const valueEl = stat.querySelector('.about-stat__value');
    if (!valueEl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            runCount(valueEl, i * 140);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.35, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(stat);
  });
}

initCountUpStats();

function setContactFormStatus(form, message, type) {
  const status = form.querySelector('.contact-form-status');
  if (!status) return;

  status.hidden = !message;
  status.textContent = message || '';
  status.classList.toggle('contact-form-status--success', type === 'success');
  status.classList.toggle('contact-form-status--error', type === 'error');
}

function getContactFormPayload(form) {
  const data = new FormData(form);
  return {
    firstName: String(data.get('firstName') || '').trim(),
    lastName: String(data.get('lastName') || '').trim(),
    email: String(data.get('email') || '').trim(),
    phone: String(data.get('phone') || '').trim(),
    service: String(data.get('service') || '').trim(),
    subject: String(data.get('subject') || '').trim(),
    message: String(data.get('message') || '').trim(),
  };
}

function validateContactForm(payload) {
  if (!payload.firstName || !payload.lastName || !payload.email || !payload.message) {
    return 'Please fill in your name, email, and message.';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    return 'Please enter a valid email address.';
  }

  if (!payload.service) {
    return 'Please select a service.';
  }

  return null;
}

function initContactForms() {
  document.querySelectorAll('.js-contact-form').forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const submitButton = form.querySelector('button[type="submit"]');
      const payload = getContactFormPayload(form);
      const validationError = validateContactForm(payload);

      if (validationError) {
        setContactFormStatus(form, validationError, 'error');
        return;
      }

      const originalLabel = submitButton?.textContent;
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Sending...';
      }
      setContactFormStatus(form, '', null);

      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(result.error || 'Failed to send message. Please try again.');
        }

        form.reset();
        setContactFormStatus(
          form,
          'Thank you. Your message has been sent. We will get back to you shortly.',
          'success'
        );
      } catch (error) {
        setContactFormStatus(
          form,
          error instanceof Error ? error.message : 'Failed to send message. Please try again.',
          'error'
        );
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalLabel || 'Submit Now';
        }
      }
    });
  });
}

initContactForms();

function initHomeBlogSlider() {
  const track = document.getElementById('home-blog-track');
  const slider = document.getElementById('home-blog-slider');
  if (!track || !slider) return;

  const AUTO_MS = 4500;
  const VISIBLE = () => {
    if (window.innerWidth <= 720) return 1;
    if (window.innerWidth <= 960) return 2;
    if (window.innerWidth <= 1200) return 3;
    return 4;
  };

  let posts = [];
  let index = 0;
  let timer = null;
  let gapPx = 0;

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

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value || '';
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  function cardHtml(post) {
    const imageSrc = post.image?.startsWith('http')
      ? post.image
      : `/${encodeAssetUrl(post.image)}`;
    const excerpt = String(post.excerpt || '').slice(0, 90);

    return `
      <article class="home-blog-slider__slide">
        <a class="blog-card" href="/blog?slug=${encodeURIComponent(post.slug)}">
          <img src="${escapeHtml(imageSrc)}" alt="${escapeHtml(post.title)}" width="300" height="140" loading="lazy">
          <div class="blog-card__body">
            <span class="blog-card__tag">${escapeHtml(post.category || 'General')}</span>
            <h3 class="blog-card__title">${escapeHtml(post.title)}</h3>
            <p>${escapeHtml(excerpt)}${String(post.excerpt || '').length > 90 ? '…' : ''}</p>
            <div class="blog-card__meta">
              <time datetime="${escapeHtml(post.date || '')}">${escapeHtml(formatDate(post.date))}</time>
            </div>
          </div>
        </a>
      </article>`;
  }

  function measureGap() {
    const styles = getComputedStyle(track);
    gapPx = Number.parseFloat(styles.columnGap || styles.gap || '0') || 0;
  }

  function slideWidth() {
    const slide = track.querySelector('.home-blog-slider__slide');
    return slide ? slide.getBoundingClientRect().width : 0;
  }

  function applyTransform(instant = false) {
    const width = slideWidth();
    if (!width) return;
    track.classList.toggle('is-instant', instant);
    track.style.transform = `translate3d(-${index * (width + gapPx)}px, 0, 0)`;
    if (instant) {
      // Force reflow then re-enable transition
      void track.offsetWidth;
      track.classList.remove('is-instant');
    }
  }

  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function start() {
    stop();
    // Need at least 2 posts to make sliding meaningful
    if (posts.length < 2) return;
    timer = setInterval(() => {
      index += 1;
      applyTransform(false);

      // Loop seamlessly using cloned slides at the end
      if (index >= posts.length) {
        window.setTimeout(() => {
          index = 0;
          applyTransform(true);
        }, 1450);
      }
    }, AUTO_MS);
  }

  function render() {
    if (!posts.length) {
      track.innerHTML = '<p class="home-blog-slider__empty">No articles published yet. Check back soon.</p>';
      return;
    }

    // Clone a full set so the 3 visible cards can rotate slowly in a loop
    const loopClones = posts.length >= 2 ? posts : [];
    track.innerHTML = [...posts, ...loopClones].map(cardHtml).join('');
    index = 0;
    measureGap();
    applyTransform(true);
    start();
  }

  async function load() {
    try {
      const response = await fetch('/api/blogs');
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Failed to load blogs');

      // Latest 4 from the blog page feed
      posts = (data.posts || []).slice(0, 4);
      render();
    } catch (error) {
      console.error(error);
      track.innerHTML =
        '<p class="home-blog-slider__empty">Unable to load articles right now. <a href="/blog">Visit the blog</a>.</p>';
    }
  }

  slider.addEventListener('mouseenter', stop);
  slider.addEventListener('mouseleave', start);
  window.addEventListener(
    'resize',
    () => {
      measureGap();
      applyTransform(true);
      start();
    },
    { passive: true }
  );

  load();
}

initHomeBlogSlider();
