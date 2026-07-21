const menuToggle = document.getElementById('menuToggle');
const mobileNav = document.getElementById('mobileNav');

menuToggle?.addEventListener('click', () => {
  const isOpen = mobileNav.hidden;
  mobileNav.hidden = !isOpen;
  menuToggle.setAttribute('aria-expanded', String(isOpen));
  menuToggle.classList.toggle('is-open', isOpen);
  document.body.classList.toggle('menu-open', isOpen);
});

mobileNav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    mobileNav.hidden = true;
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.classList.remove('is-open');
    document.body.classList.remove('menu-open');
  });
});

window.addEventListener('scroll', () => {
  const header = document.getElementById('header');
  if (header) header.classList.toggle('header--scrolled', window.scrollY > 24);
}, { passive: true });

// FAQ accordion
document.querySelectorAll('.faq-accordion__trigger').forEach((trigger) => {
  trigger.addEventListener('click', () => {
    const item = trigger.closest('.faq-accordion__item');
    const isOpen = item.classList.contains('is-open');

    document.querySelectorAll('.faq-accordion__item').forEach((el) => {
      el.classList.remove('is-open');
      el.querySelector('.faq-accordion__trigger')?.setAttribute('aria-expanded', 'false');
    });

    if (!isOpen) {
      item.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
    }
  });
});

// Testimonial slider
const slider = document.querySelector('[data-testimonial-slider]');
if (slider) {
  const slides = Array.from(slider.querySelectorAll('.testimonial-slide'));
  let index = 0;

  const showSlide = (next) => {
    slides[index].classList.remove('is-active');
    index = (next + slides.length) % slides.length;
    slides[index].classList.add('is-active');
  };

  slider.querySelector('[data-testimonial-prev]')?.addEventListener('click', () => showSlide(index - 1));
  slider.querySelector('[data-testimonial-next]')?.addEventListener('click', () => showSlide(index + 1));
}
