import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";

const NAV_ITEMS = [
  { href: "/", label: "Home", id: "home" },
  { href: "/about", label: "About", id: "about" },
  { href: "/services", label: "Services", id: "services" },
  { href: "/blog", label: "Blog", id: "blog" },
  { href: "/contact", label: "Contact", id: "contact" },
] as const;

function pageFromPath(path: string) {
  if (path === "/") return "home";
  if (path.startsWith("/about")) return "about";
  if (path.startsWith("/services")) return "services";
  if (path.startsWith("/blog")) return "blog";
  if (path.startsWith("/contact")) return "contact";
  return "";
}

export function SiteHeader() {
  const [location] = useLocation();
  const current = pageFromPath(location);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const ctaActive = current === "contact" ? " nav__cta--active" : "";

  return (
    <>
      <div className="topbar">
        <div className="container topbar__inner">
          <div className="topbar__contact">
            <a href="mailto:Info@lizaz.ae">Info@lizaz.ae</a>
          </div>
        </div>
      </div>
      <header className={`header${scrolled ? " header--scrolled" : ""}`} id="header">
        <div className="container header__inner">
          <Link href="/" className="logo logo--header" aria-label="Lizaz Home">
            <img
              src="/attached_assets/logo/Lizaz%20Logo%20Final-01.png"
              alt="Lizaz"
              className="logo__img"
              width={300}
              height={64}
              decoding="async"
              onError={(e) => {
                (e.currentTarget.closest(".logo") as HTMLElement | null)?.classList.add("logo--text");
              }}
            />
            <span className="logo__text">Lizaz</span>
          </Link>
          <nav className="nav" aria-label="Main navigation">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`nav__link${current === item.id ? " nav__link--active" : ""}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="header__actions">
            <Link href="/contact" className={`nav__cta${ctaActive}`}>
              Get in Touch
            </Link>
            <button
              className="menu-toggle"
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </header>
      <nav
        className="mobile-nav"
        id="mobileNav"
        hidden={!menuOpen}
        aria-label="Mobile navigation"
      >
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={`nav__link${current === item.id ? " nav__link--active" : ""}`}
          >
            {item.label}
          </Link>
        ))}
        <Link href="/contact" className={`nav__cta nav__cta--mobile${ctaActive}`}>
          Get in Touch
        </Link>
      </nav>
    </>
  );
}
