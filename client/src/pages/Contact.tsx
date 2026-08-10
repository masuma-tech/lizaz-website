import { FormEvent, useEffect, useState } from "react";
import { Link } from "wouter";
import { SiteLayout } from "@/components/SiteLayout";
import { apiRequest } from "@/lib/queryClient";

const SERVICES = [
  "Business Formation & Trade Licensing",
  "Visa & Immigration Services",
  "PRO & Government Liaison",
  "Document Attestation & Legal Translation",
  "Corporate Support",
];

export default function Contact() {
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = "Contact | Lizaz Document Clearance & Visa Services";
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus(null);
    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = {
      firstName: String(data.get("firstName") || "").trim(),
      lastName: String(data.get("lastName") || "").trim(),
      email: String(data.get("email") || "").trim(),
      phone: String(data.get("phone") || "").trim(),
      service: String(data.get("service") || "").trim(),
      message: String(data.get("message") || "").trim(),
    };

    if (!payload.firstName || !payload.lastName || !payload.email || !payload.message || !payload.service) {
      setStatus({ type: "error", message: "Please fill in all required fields." });
      return;
    }

    setSubmitting(true);
    try {
      await apiRequest("POST", "/api/contact", payload);
      setStatus({ type: "success", message: "Thank you. Your inquiry was submitted successfully." });
      form.reset();
    } catch {
      setStatus({
        type: "error",
        message: "Something went wrong. Please try again or email Info@lizaz.ae.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SiteLayout page="contact">
      <header className="page-hero page-hero--split" aria-labelledby="contact-page-title">
        <div className="container page-hero--split__grid">
          <div className="page-hero--split__main">
            <p className="page-hero--split__label">Contact Us</p>
            <h1 id="contact-page-title" className="page__title">
              <span className="page-hero--split__title-line">Contact our specialist for UAE Visa,</span>
              <span className="page-hero--split__title-accent">Document Clearance &amp; Business Setup Services</span>
            </h1>
          </div>
          <aside className="page-hero--split__aside" aria-label="Response time highlight">
            <span className="page-hero--split__stat">24h</span>
            <span className="page-hero--split__stat-label">Response Time</span>
          </aside>
        </div>
      </header>

      <section className="page page-contact-form reveal" aria-labelledby="form-title">
        <div className="container page-contact-form__grid">
          <div className="page-contact-form__intro">
            <p className="section-label">Send a message</p>
            <h2 id="form-title" className="section-title">
              Have a question about document clearance, visas, or business setup in the UAE?
            </h2>
            <p className="section-text">
              Fill in the form and our team will contact you with a clear timeline, document checklist, and quote for
              your service.
            </p>
            <ul className="about-checklist">
              <li>Free consultation for all new enquiries</li>
              <li>Transparent pricing with no hidden fees</li>
              <li>Dedicated specialist assigned to your file</li>
            </ul>
          </div>
          <div className="page-contact-form__wrap">
            <form className="page-contact-form__form" onSubmit={onSubmit} noValidate>
              <div className="page-contact-form__fields">
                <label className="page-contact-form__field">
                  <span>First Name</span>
                  <input type="text" name="firstName" placeholder="Enter your first name" required autoComplete="given-name" />
                </label>
                <label className="page-contact-form__field">
                  <span>Last Name</span>
                  <input type="text" name="lastName" placeholder="Enter your last name" required autoComplete="family-name" />
                </label>
                <label className="page-contact-form__field">
                  <span>Email Address</span>
                  <input type="email" name="email" placeholder="Enter your email address" required autoComplete="email" />
                </label>
                <label className="page-contact-form__field">
                  <span>Phone No.</span>
                  <input type="tel" name="phone" placeholder="Enter your phone number" autoComplete="tel" />
                </label>
                <label className="page-contact-form__field page-contact-form__field--full">
                  <span>Services</span>
                  <select name="service" required defaultValue="">
                    <option value="" disabled>
                      Select a service
                    </option>
                    {SERVICES.map((service) => (
                      <option key={service} value={service}>
                        {service}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="page-contact-form__field page-contact-form__field--full">
                <span>Message</span>
                <textarea name="message" rows={5} placeholder="Describe your requirements" required />
              </label>
              {status && (
                <p className={`contact-form-status contact-form-status--${status.type}`} role="status" aria-live="polite">
                  {status.message}
                </p>
              )}
              <button type="submit" className="btn btn--primary" disabled={submitting}>
                {submitting ? "Submitting…" : "Submit Now"}
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="page about-commitment reveal" aria-labelledby="contact-help-title">
        <div className="container about-commitment__grid">
          <div className="about-commitment__content">
            <p className="section-label">How We Help</p>
            <h2 id="contact-help-title" className="section-title">
              Your First Step Toward a Hassle-Free UAE Application
            </h2>
            <p className="section-text">
              The moment your enquiry lands with us, it goes straight to a specialist who works in your exact area for
              visas, attestation, Golden Visa, or business setup. No call centers, no generic replies. You&apos;ll hear
              back within one business day with a clear next step.
            </p>
            <ul className="about-checklist">
              <li>What we need from you.</li>
              <li>How long it&apos;ll take.</li>
              <li>What it costs.</li>
            </ul>
            <p className="section-text">From there, one person owns your file until it&apos;s done.</p>
            <Link href="/services" className="btn btn--primary">
              Explore Our Services
            </Link>
          </div>
          <div className="about-commitment__media">
            <img
              src="/attached_assets/images/doc2.jpg"
              alt="Contact Lizaz document clearance team"
              width={600}
              height={500}
              loading="lazy"
            />
          </div>
        </div>
      </section>

      <section className="about-cta reveal" aria-labelledby="contact-cta-title">
        <div className="container about-cta__inner">
          <h2 id="contact-cta-title" className="about-cta__title">
            Prefer to Speak Directly to Our Specialists?
          </h2>
          <p className="about-cta__text">
            Skip the form. Drop us an email anytime, and let&apos;s figure out your document clearance, visa, or
            business setup needs together.
          </p>
          <div className="about-cta__actions">
            <a href="mailto:Info@lizaz.ae" className="btn btn--primary">
              Send Email
            </a>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
