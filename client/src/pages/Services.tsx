import { useEffect } from "react";
import { Link } from "wouter";
import { CountUp } from "@/components/CountUp";
import { SiteLayout } from "@/components/SiteLayout";

const SERVICES = [
  {
    img: "/attached_assets/images/business.jpg",
    icon: "🏢",
    title: "Business Formation & Trade Licensing",
    text: "Mainland, free zone, and offshore company setup, along with DED services including name reservation, initial approval, and license renewal or cancellation, plus MOA drafting and court agreement assistance.",
  },
  {
    img: "/attached_assets/images/visa.jpg",
    icon: "💳",
    title: "Visa & Immigration Services",
    text: "Employment, investor, and partner visas, family visa and dependent sponsorship, entry permits, status changes, visa renewals, and medical and Emirates ID coordination.",
  },
  {
    img: "/attached_assets/images/uae.jpg",
    icon: "💼",
    title: "PRO & Government Liaison",
    text: "Outsourced PRO services for companies, Labour and Immigration department coordination, Ejari and tenancy contract registration, and NOC and clearance certificates.",
  },
  {
    img: "/attached_assets/images/attestation.jpg",
    icon: "📄",
    title: "Document Attestation & Legal Translation",
    text: "MOFA, embassy, and notary attestations, power of attorney and legal documentation, certified Arabic-English translations, and legalization of educational, marriage, and birth certificates.",
  },
  {
    img: "/attached_assets/images/tax.jpg",
    icon: "📈",
    title: "Corporate Support",
    text: "VAT registration and compliance assistance, trade license modification and activity addition, local sponsor and service agent arrangements, and corporate banking assistance.",
  },
];

export default function Services() {
  useEffect(() => {
    document.title = "Services | UAE Visa, Document Clearance & Business Setup — Lizaz";
  }, []);

  return (
    <SiteLayout page="services">
      <header className="page-hero page-hero--split" aria-labelledby="services-page-title">
        <div className="container page-hero--split__grid">
          <div className="page-hero--split__main">
            <p className="section-label">Our Services</p>
            <h1 id="services-page-title" className="page__title">
              <span className="page-hero--split__title-line">Document Clearance &amp; Visa Processing</span>
              <span className="page-hero--split__title-accent">Business Setup Services in the UAE</span>
            </h1>
          </div>
          <aside className="page-hero--split__aside" aria-label="Services highlight">
            <CountUp className="page-hero--split__stat" value="5" />
            <span className="page-hero--split__stat-label">Core Services</span>
          </aside>
        </div>
      </header>

      <section className="page about-intro services-intro reveal" aria-labelledby="services-intro-title">
        <div className="container about-intro__grid">
          <div className="about-intro__media">
            <img
              className="services-intro__img"
              src="/attached_assets/images/doc_clearance.jpg"
              alt="Document clearance services in the UAE"
              width={300}
              height={400}
              loading="lazy"
            />
          </div>
          <div className="about-intro__content">
            <p className="section-label">What We Offer</p>
            <h2 id="services-intro-title" className="section-title">
              Trusted UAE Visa &amp; Document Clearance Experts
            </h2>
            <p className="section-text">
              Government processes in the UAE can involve several different departments, attestation, visas,
              immigration, and licensing. Instead of dealing with each one separately, Lizaz manages it all for you,
              under one roof, with one point of contact who knows your file from start to finish.
            </p>
            <ul className="about-checklist">
              <li>A single dedicated consultant, from your first call to final approval</li>
              <li>Direct relationships with MOFA, embassies, and licensing authorities</li>
              <li>Applications reviewed for errors before they&apos;re ever submitted</li>
              <li>One quote, one timeline, no surprises along the way</li>
            </ul>
            <Link href="/contact" className="btn btn--primary">
              Request a Quote
            </Link>
          </div>
        </div>
      </section>

      <section className="about-stats reveal" aria-label="Service highlights">
        <div className="container about-stats__grid">
          {[
            ["5", "Core Service Areas"],
            ["10K+", "Documents Cleared"],
            ["5–10", "Day Avg. Visa Processing"],
            ["100%", "Compliance Focused"],
          ].map(([value, label]) => (
            <div className="about-stat" key={label}>
              <CountUp className="about-stat__value" value={value} />
              <span className="about-stat__label">{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="page page-services reveal" aria-labelledby="services-list-title">
        <div className="container">
          <div className="section-header section-header--center">
            <p className="section-label">Services</p>
            <h2 id="services-list-title" className="section-title">
              Services We Provide
            </h2>
            <p className="section-lead">5 Core Service Areas Covering Every Government Process</p>
          </div>
          <div className="page-services__grid">
            {SERVICES.map((service) => (
              <article className="page-service-card" key={service.title}>
                <div className="page-service-card__media">
                  <img src={service.img} alt="" width={400} height={220} loading="lazy" />
                  <span className="page-service-card__icon" aria-hidden="true">
                    {service.icon}
                  </span>
                </div>
                <div className="page-service-card__body">
                  <h3 className="page-service-card__title">{service.title}</h3>
                  <p>{service.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="page about-values reveal" aria-labelledby="benefits-title">
        <div className="container">
          <div className="section-header section-header--center">
            <p className="section-label">Why Lizaz</p>
            <h2 id="benefits-title" className="section-title">
              Why Choose Lizaz for UAE Document Clearance &amp; Visa Services
            </h2>
            <p className="section-lead">
              Trusted UAE document clearance and visa services, delivered with speed, transparency, and expert support.
            </p>
          </div>
          <div className="about-values__grid about-values__grid--three">
            {[
              ["⚡", "Fast Turnaround", "Streamlined workflows and direct government channels mean your documents and visas are processed without unnecessary delay."],
              ["👥", "Expert Consultants", "Every application is reviewed by immigration and attestation specialists before submission."],
              ["💰", "Transparent Pricing", "No hidden fees. You receive a clear upfront quote covering government charges and service fees."],
              ["📞", "Dedicated Support", "A single point of contact tracks your file from consultation through to final clearance."],
              ["🏛", "Government Liaison", "We manage all interactions with MOFA, embassies, immigration authorities, and licensing departments on your behalf."],
              ["🏆", "Proven Track Record", "A large and growing base of satisfied clients across the UAE trust Lizaz for reliable, compliant document and visa services."],
            ].map(([icon, title, text]) => (
              <article className="about-value-card" key={title}>
                <span className="about-value-card__icon" aria-hidden="true">
                  {icon}
                </span>
                <h3 className="about-value-card__title">{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="page about-commitment reveal" aria-labelledby="services-process-title">
        <div className="container about-commitment__grid">
          <div className="about-commitment__content">
            <p className="section-label">Our Process</p>
            <h2 id="services-process-title" className="section-title">
              Start Your Visa &amp; Document Clearance Process with Lizaz
            </h2>
            <p className="section-text">
              We start with a free consultation to understand your situation, then collect and verify your documents
              before submitting to the relevant government authority. From there, we track your application until
              it&apos;s approved and delivered. You&apos;ll always know where things stand with regular updates from
              your dedicated consultant, not a support inbox.
            </p>
            <Link href="/contact" className="btn btn--primary">
              Book Free Consultation
            </Link>
          </div>
          <div className="about-commitment__media services-process__media">
            <img
              className="services-process__img"
              src="/attached_assets/images/visa_stamp.jpg"
              alt="Visa and document clearance process"
              width={480}
              height={360}
              loading="lazy"
            />
          </div>
        </div>
      </section>

      <section className="about-cta reveal" aria-labelledby="services-cta-title">
        <div className="container about-cta__inner">
          <h2 id="services-cta-title" className="about-cta__title">
            Not Sure Where to Start?
          </h2>
          <p className="about-cta__text">
            Every situation is different. Talk to one of our specialists and walk away with a clear plan. What you need,
            how long it&apos;ll take, and what it&apos;ll cost.
          </p>
          <div className="about-cta__actions">
            <Link href="/about" className="btn btn--outline-light">
              Learn About Lizaz
            </Link>
            <Link href="/contact" className="btn btn--primary">
              Talk to a Specialist
            </Link>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
