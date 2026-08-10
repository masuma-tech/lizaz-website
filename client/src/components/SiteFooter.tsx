import { Link } from "wouter";

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="container footer__main">
        <div className="footer__brand">
          <Link href="/" className="logo logo--footer" aria-label="Lizaz Home">
            <img
              src="/attached_assets/logo/Lizaz%20Logo%20Final-03.png"
              alt="Lizaz"
              className="logo__img"
              width={120}
              height={30}
              decoding="async"
            />
            <span className="logo__text">Lizaz</span>
          </Link>
          <p className="footer__desc">
            Trusted document clearance, visa, immigration, golden visa, and business setup — delivered with care across
            the UAE.
          </p>
        </div>

        <nav className="footer__col" aria-label="Quick links">
          <h3 className="footer__heading">Quick Links</h3>
          <ul className="footer__links">
            <li>
              <Link href="/">Home</Link>
            </li>
            <li>
              <Link href="/about">About Us</Link>
            </li>
            <li>
              <Link href="/services">Our Services</Link>
            </li>
            <li>
              <Link href="/blog">Blog</Link>
            </li>
            <li>
              <Link href="/contact">Contact</Link>
            </li>
          </ul>
        </nav>

        <nav className="footer__col" aria-label="Our services">
          <h3 className="footer__heading">Our Services</h3>
          <ul className="footer__links">
            <li>
              <Link href="/services">Business Formation &amp; Trade Licensing</Link>
            </li>
            <li>
              <Link href="/services">Visa &amp; Immigration Services</Link>
            </li>
            <li>
              <Link href="/services">PRO &amp; Government Liaison</Link>
            </li>
            <li>
              <Link href="/services">Document Attestation &amp; Legal Translation</Link>
            </li>
            <li>
              <Link href="/services">Corporate Support</Link>
            </li>
          </ul>
        </nav>

        <nav className="footer__col" aria-label="Contact">
          <h3 className="footer__heading">Contact</h3>
          <ul className="footer__links">
            <li>
              <a href="mailto:Info@lizaz.ae">Info@lizaz.ae</a>
            </li>
            <li>
              <Link href="/contact">Get in Touch</Link>
            </li>
            <li>
              <Link href="/contact">Book Appointment</Link>
            </li>
          </ul>
        </nav>
      </div>

      <div className="footer__bottom">
        <div className="container footer__inner">
          <p className="footer__copy">&copy; {new Date().getFullYear()} Lizaz. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
