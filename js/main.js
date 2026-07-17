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
