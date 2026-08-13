import { useEffect } from "react";
import { Link } from "wouter";
import { CountUp } from "@/components/CountUp";
import { SiteLayout } from "@/components/SiteLayout";

export default function About() {
  useEffect(() => {
    document.title = "About Us | Lizaz Document Clearance & Visa Services";
  }, []);

  return (
    <SiteLayout page="about">
      <header className="page-hero page-hero--split" aria-labelledby="about-page-title">
        <div className="container page-hero--split__grid">
          <div className="page-hero--split__main">
            <p className="section-label">About Us</p>
            <h1 id="about-page-title" className="page__title">
              <span className="page-hero--split__title-line">Your Trusted UAE Partner for</span>
              <span className="page-hero--split__title-accent">Document Clearance &amp; Visa Services</span>
            </h1>
          </div>
          <aside className="page-hero--split__aside" aria-label="Experience highlight">
            <CountUp className="page-hero--split__stat" value="8+" />
            <span className="page-hero--split__stat-label">Years of Trust</span>
          </aside>
        </div>
      </header>

      <section className="page about-intro reveal" aria-labelledby="intro-title">
        <div className="container about-intro__grid">
          <div className="about-intro__media">
            <figure className="about-media">
              <img
                className="about-media__img"
                src="/attached_assets/images/embassy.jpg"
                alt="Embassy document attestation and clearance in the UAE"
                width={340}
                height={450}
                loading="lazy"
              />
            </figure>
          </div>
          <div className="about-intro__content">
            <h2 id="intro-title" className="section-title">
              A Legacy of Trust and Results
            </h2>
            <p className="section-text">
              At Lizaz, we understand that UAE government procedures like MOFA attestation, embassy legalization, visa
              applications, and licensing can feel complex and time-consuming. That&apos;s why we built our business
              around simplifying the entire journey for you.
            </p>
            <p className="section-text">
              Our specialists personally manage every step of your document clearance and visa process, so you can avoid
              delays, rejections, and unnecessary paperwork. Whether you&apos;re an individual relocating to the UAE, a
              family applying for residency, or a business expanding into the region, we act as your dedicated
              government liaison. We verify, attest, and deliver your documents correctly the first time, so you can
              move forward with confidence.
            </p>
          </div>
        </div>
      </section>

      <section className="about-stats reveal" aria-label="Company highlights">
        <div className="container about-stats__grid">
          {[
            ["8+", "Years of Experience"],
            ["10,000+", "Documents Cleared"],
            ["98%", "Client Satisfaction"],
            ["24h", "Average Response Time"],
          ].map(([value, label]) => (
            <div className="about-stat" key={label}>
              <CountUp className="about-stat__value" value={value} />
              <span className="about-stat__label">{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="page about-values reveal" aria-labelledby="values-title">
        <div className="container">
          <div className="section-header section-header--center about-values__header">
            <p className="section-label">What We Stand For</p>
            <h2 id="values-title" className="about-subtitle">
              Our Core Values
            </h2>
            <p className="section-lead">
              The values that shape how we treat every client, every document, and every application we handle.
            </p>
          </div>
          <div className="about-values__grid">
            {[
              ["⚖", "Compliance", "Every file we handle meets UAE government standards, so there are no shortcuts, no errors, and no rejections due to incomplete documents."],
              ["📄", "Accuracy", "We carefully review every form, stamp, and submission so your clearance and visa applications move forward without delays."],
              ["👥", "Transparency", "Clear timelines, honest pricing, and regular updates, so you always know exactly where your application stands."],
              ["🙌", "Client Focus", "From a single certificate to a full business setup, you get dedicated, personal support from start to finish."],
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

      <section className="page about-commitment reveal" aria-labelledby="commitment-title">
        <div className="container about-commitment__grid">
          <div className="about-commitment__content">
            <p className="section-label">Our Commitment</p>
            <h2 id="commitment-title" className="about-subtitle">
              A Commitment Beyond the Paperwork
            </h2>
            <p className="section-text">At Lizaz, we open doors.</p>
            <p className="section-text">
              A new job in Dubai, a reunited family, a business launch, long-term residency through the Golden Visa UAE
              programme — whatever it is, we handle the complexity of attestation, immigration, and business setup so
              you don&apos;t have to.
            </p>
            <p className="section-text">From your first consultation to final approval, we&apos;re with you at every step.</p>
            <Link href="/contact" className="btn btn--primary">
              Book an Appointment
            </Link>
          </div>
          <div className="about-commitment__media">
            <img
              src="/attached_assets/images/doc2.jpg"
              alt="UAE government document processing"
              width={600}
              height={500}
              loading="lazy"
            />
          </div>
        </div>
      </section>

      <section className="about-cta reveal" aria-labelledby="cta-title">
        <div className="container about-cta__inner">
          <h2 id="cta-title" className="about-cta__title">
            Let&apos;s Get Your Application Moving
          </h2>
          <p className="about-cta__text">
            From a single certificate to a full business setup, our specialists are ready to guide you through the
            process, start to finish.
          </p>
          <div className="about-cta__actions">
            <Link href="/contact" className="btn btn--primary">
              Get In Touch
            </Link>
            <Link href="/services" className="btn btn--outline-light">
              Explore Our Services
            </Link>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
