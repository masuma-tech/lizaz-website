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

  window.addEventListener('scroll', () => {
    const offset = Math.min(window.scrollY * 0.22, 120);
    heroBg.style.transform = `scale(1.01) translateY(${-offset}px)`;
  }, { passive: true });
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
