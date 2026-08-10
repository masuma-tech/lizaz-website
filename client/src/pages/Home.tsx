import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/SiteLayout";
import { ContactForm } from "@/components/ContactForm";
import { encodeAssetUrl } from "@/lib/utils";
import type { BlogPost } from "@shared/schema";

const FAQ = [
  {
    q: "Do I need to be in the UAE to use your services?",
    a: "No. Most services can be handled remotely. You share your documents, and we manage the process for you.",
  },
  {
    q: "What is the typical turnaround time?",
    a: "It depends on the service. We share an estimated timeline during your free consultation.",
  },
  {
    q: "Do I currently qualify for the UAE Golden Visa?",
    a: "It depends on your profile. Book a free consultation and we will check your eligibility.",
  },
  {
    q: "What are your service fees?",
    a: "Fees vary by service. After a free consultation, we provide a clear quote with no hidden costs.",
  },
];

const TESTIMONIALS = [
  {
    text: "We needed our company documents attested before a licensing deadline, and honestly, I was dreading the back-and-forth with government offices. The Lizaz team took over everything, kept me updated by WhatsApp almost daily, and got it done two days before our deadline. Would use them again without a second thought.",
    name: "Khalid M.",
    place: "Dubai",
    image: "/attached_assets/images/doc4.jpg",
  },
  {
    text: "I applied for my family's residency visas while still overseas. Lizaz handled medicals, Emirates ID, and all the paperwork remotely. Clear communication, no surprises on fees, and everything approved on the first submission.",
    name: "Sara A.",
    place: "Abu Dhabi",
    image: "/attached_assets/images/doc2.jpg",
  },
];

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  const { data } = useQuery<{ posts: BlogPost[] }>({
    queryKey: ["/api/blogs"],
  });
  const posts = (data?.posts || []).slice(0, 4);

  useEffect(() => {
    document.title = "Lizaz | UAE Document Clearance, Visa & Business Setup";
  }, []);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const heroBg = document.querySelector(".home-hero__bg") as HTMLElement | null;
    if (!heroBg || prefersReducedMotion) return;

    let ticking = false;
    const update = () => {
      const offset = Math.min(window.scrollY * 0.18, 100);
      heroBg.style.transform = `scale(1.01) translate3d(0, ${-offset}px, 0)`;
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <SiteLayout page="home">
      <header className="home-hero" aria-labelledby="hero-title">
        <div className="home-hero__bg" aria-hidden="true"></div>
        <div className="container home-hero__grid">
          <div className="home-hero__content">
            <h1 id="hero-title" className="home-hero__title">
              <span className="home-hero__title-line">Your Trusted Partner for</span>
              <span className="home-hero__title-accent">Document Clearance &amp; Visa Services</span>
              <span className="home-hero__title-line home-hero__title-line--soft">in the UAE</span>
            </h1>
            <p className="home-hero__lead">
              Lizaz is a leading UAE-based consultancy specializing in document clearance, visa processing, immigration
              support, and Golden Visa applications. From certificate attestation to full business setup, our licensed
              specialists handle every government process on your behalf accurately, transparently, and on time.
            </p>
            <div className="home-hero__actions">
              <Link href="/contact" className="btn btn--primary btn--lg">
                Book Free Consultation
              </Link>
              <Link href="/services" className="btn btn--outline-light">
                Explore Services
              </Link>
            </div>
          </div>
          <div className="home-hero__media">
            <div className="home-frame" aria-hidden="true">
              <svg className="home-frame__shape" viewBox="0 0 500 640" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="frameGoldHero" x1="40" y1="0" x2="460" y2="640" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#c9a86a" />
                    <stop offset="48%" stopColor="#a07f45" />
                    <stop offset="100%" stopColor="#7a5f30" />
                  </linearGradient>
                </defs>
                <path
                  d="M96.7255 20.1505C98.6132 8.5339 108.646 0 120.415 0L476 0C489.255 0 500 10.7452 500 24V616C500 629.255 489.255 640 476 640H24.2148C9.42367 640 -1.8469 626.75 0.525545 612.151L96.7255 20.1505Z"
                  fill="url(#frameGoldHero)"
                />
              </svg>
              <div className="home-frame__image">
                <img
                  src="/attached_assets/images/hero.png"
                  alt="Professional UAE document clearance and visa services in Dubai"
                  width={500}
                  height={640}
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="home-section home-about reveal" id="about" aria-labelledby="about-title">
        <div className="container home-about__grid">
          <div className="home-about__media">
            <figure className="about-media about-media--wide">
              <img
                className="about-media__img"
                src="/attached_assets/images/embassy.jpg"
                alt="Embassy document attestation and clearance services"
                width={640}
                height={280}
                loading="lazy"
              />
            </figure>
          </div>
          <div className="home-about__content">
            <p className="section-label">About Us</p>
            <h2 id="about-title" className="home-subtitle">
              UAE Document Clearance Services Made Simple
            </h2>
            <p className="section-text">
              At Lizaz, we understand that UAE government procedures like MOFA attestation, embassy legalization, visa
              applications, and licensing can feel complex and time-consuming. That&apos;s why we built our business
              around simplifying the entire journey for you.
            </p>
            <p className="section-text">
              Our specialists personally manage every step of your document clearance and visa process, so you can avoid
              delays, rejections, and unnecessary paperwork.
            </p>
            <p className="section-text">
              Whether you&apos;re an individual relocating to the UAE, a family applying for residency, or a business
              expanding into the region, we act as your dedicated government liaison. We verify, attest, and deliver
              your documents correctly the first time, so you can move forward with confidence.
            </p>
            <Link href="/about" className="home-about__read-more">
              Read more
            </Link>
          </div>
        </div>
      </section>

      <section className="home-section home-services reveal" id="services" aria-labelledby="services-title">
        <div className="container">
          <div className="home-services__header section-header section-header--center">
            <p className="home-services__label">Services</p>
            <h2 id="services-title" className="home-subtitle home-services__heading">
              Services We Provide
            </h2>
            <p className="section-lead section-lead--light">End-to-end UAE business, visa, and government services</p>
          </div>
          <div className="service-cards">
            {[
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
            ].map((card) => (
              <article className="service-card" key={card.title}>
                <div className="service-card__media">
                  <img src={card.img} alt={card.title} width={400} height={220} loading="lazy" />
                  <span className="service-card__icon" aria-hidden="true">
                    {card.icon}
                  </span>
                </div>
                <div className="service-card__body">
                  <h3 className="service-card__title">{card.title}</h3>
                  <p>{card.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section home-process reveal" id="why-us" aria-labelledby="process-title">
        <div className="container">
          <div className="section-header section-header--center home-process__header">
            <p className="section-label">Our Process</p>
            <h2 id="process-title" className="home-subtitle">
              Start Your Visa &amp; Document Clearance Process With Lizaz
            </h2>
            <p className="section-lead">A transparent, six-step process built for speed, accuracy, and peace of mind.</p>
          </div>
          <div className="process-timeline">
            <div className="process-timeline__col">
              {[
                ["1", "Free Consultation", "We assess your requirements and recommend the right service and document checklist."],
                ["2", "Document Collection", "Submit your documents securely; we verify completeness before processing begins."],
                ["3", "Government Verification", "Your file is checked against MOFA, embassy, and immigration authority requirements."],
              ].map(([num, title, text]) => (
                <article className="process-card" key={num}>
                  <span className="process-card__num">{num}</span>
                  <h3 className="process-card__title">{title}</h3>
                  <ul className="process-card__list">
                    <li>{text}</li>
                  </ul>
                </article>
              ))}
            </div>
            <div className="process-timeline__line" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div className="process-timeline__col">
              {[
                ["4", "International Attestation", "Where required, we manage embassy and consulate legalization abroad."],
                ["5", "Status Tracking", "Get real-time updates as your application moves through each government stage."],
                ["6", "Clearance & Delivery", "Receive your fully cleared, attested, or approved documents, ready to use."],
              ].map(([num, title, text]) => (
                <article className="process-card" key={num}>
                  <span className="process-card__num">{num}</span>
                  <h3 className="process-card__title">{title}</h3>
                  <ul className="process-card__list">
                    <li>{text}</li>
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="home-section home-faq reveal" id="faq" aria-labelledby="faq-title">
        <div className="container">
          <div className="section-header section-header--center home-faq__header">
            <p className="section-label section-label--light">FAQ</p>
            <h2 id="faq-title" className="home-subtitle home-subtitle--light">
              Frequently Asked Questions
            </h2>
            <p className="section-lead section-lead--light">
              Common questions about document clearance, visas, and business setup in the UAE.
            </p>
          </div>
          <div className="faq-accordion">
            {FAQ.map((item, i) => {
              const open = openFaq === i;
              return (
                <div className="faq-accordion__item" key={item.q}>
                  <button
                    className="faq-accordion__trigger"
                    type="button"
                    aria-expanded={open}
                    aria-controls={`faq-panel-${i + 1}`}
                    id={`faq-trigger-${i + 1}`}
                    onClick={() => setOpenFaq(open ? null : i)}
                  >
                    <span className="faq-accordion__question">{item.q}</span>
                    <span className="faq-accordion__icon" aria-hidden="true"></span>
                  </button>
                  <div
                    className="faq-accordion__panel"
                    id={`faq-panel-${i + 1}`}
                    role="region"
                    aria-labelledby={`faq-trigger-${i + 1}`}
                    hidden={!open}
                  >
                    <p>{item.a}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="faq-cta">
            <h3 className="faq-cta__title">Still have questions? Get in touch and we&apos;ll walk you through it.</h3>
            <Link href="/contact" className="btn btn--primary">
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      <section className="home-section home-why reveal" id="why-choose" aria-labelledby="why-title">
        <div className="container">
          <div className="section-header section-header--center home-why__header">
            <p className="section-label">Why Lizaz</p>
            <h2 id="why-title" className="home-subtitle">
              Why Choose Lizaz for UAE Document Clearance &amp; Visa Services
            </h2>
            <p className="section-lead">
              Trusted UAE document clearance and visa services, delivered with speed, transparency, and expert support.
            </p>
          </div>
          <div className="why-grid">
            {[
              ["⚡", "Fast Turnaround", "Streamlined workflows and direct government channels mean your documents and visas are processed without unnecessary delay."],
              ["👥", "Expert Consultants", "Every application is reviewed by immigration and attestation specialists before submission."],
              ["💰", "Transparent Pricing", "No hidden fees. You receive a clear upfront quote covering government charges and service fees."],
              ["📞", "Dedicated Support", "A single point of contact tracks your file from consultation through to final clearance."],
              ["🏛", "Government Liaison", "We manage all interactions with MOFA, embassies, immigration authorities, and licensing departments on your behalf."],
              ["🏆", "Proven Track Record", "A large and growing base of satisfied clients across the UAE trust Lizaz for reliable, compliant document and visa services."],
            ].map(([icon, title, text]) => (
              <article className="why-card" key={title}>
                <span className="why-card__icon" aria-hidden="true">
                  {icon}
                </span>
                <h3 className="why-card__title">{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section home-testimonials reveal" id="testimonials" aria-labelledby="testimonials-title">
        <div className="container">
          <div className="section-header section-header--center home-testimonials__header">
            <p className="section-label">Testimonial</p>
            <h2 id="testimonials-title" className="home-subtitle">
              Client Success Stories
            </h2>
            <p className="section-lead">Real experiences from the individuals and businesses we&apos;ve helped across the UAE.</p>
          </div>
          <div className="testimonial-split">
            <div className="testimonial-split__content">
              <p className="testimonial-split__label">
                <span aria-hidden="true"></span> Testimonial
              </p>
              <div className="testimonial-slider" data-testimonial-slider>
                <div className="testimonial-slider__track">
                  {TESTIMONIALS.map((item, i) => (
                    <article
                      key={item.name}
                      className={`testimonial-slide${i === testimonialIndex ? " is-active" : ""}`}
                      hidden={i !== testimonialIndex}
                    >
                      <p>{item.text}</p>
                      <div className="testimonial-slide__author">
                        <img src={item.image} alt="" width={56} height={56} loading="lazy" />
                        <div>
                          <strong>{item.name}</strong>
                          <span>{item.place}</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
                <div className="testimonial-slider__nav">
                  <button
                    type="button"
                    className="testimonial-slider__btn"
                    aria-label="Previous testimonial"
                    onClick={() =>
                      setTestimonialIndex((i) => (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)
                    }
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    className="testimonial-slider__btn"
                    aria-label="Next testimonial"
                    onClick={() => setTestimonialIndex((i) => (i + 1) % TESTIMONIALS.length)}
                  >
                    →
                  </button>
                </div>
              </div>
            </div>
            <div className="testimonial-split__media">
              <div className="home-frame" aria-hidden="true">
                <svg className="home-frame__shape" viewBox="0 0 500 640" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient
                      id="frameGoldTestimonial"
                      x1="40"
                      y1="0"
                      x2="460"
                      y2="640"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop offset="0%" stopColor="#c9a86a" />
                      <stop offset="48%" stopColor="#a07f45" />
                      <stop offset="100%" stopColor="#7a5f30" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M96.7255 20.1505C98.6132 8.5339 108.646 0 120.415 0L476 0C489.255 0 500 10.7452 500 24V616C500 629.255 489.255 640 476 640H24.2148C9.42367 640 -1.8469 626.75 0.525545 612.151L96.7255 20.1505Z"
                    fill="url(#frameGoldTestimonial)"
                  />
                </svg>
                <div className="home-frame__image">
                  <img
                    src="/attached_assets/images/uae.jpg"
                    alt="Client testimonial"
                    width={500}
                    height={640}
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="home-section home-contact reveal" id="contact" aria-labelledby="contact-title">
        <div className="container home-contact__grid">
          <div className="home-contact__media">
            <div className="home-frame home-frame--flip" aria-hidden="true">
              <svg className="home-frame__shape" viewBox="0 0 500 640" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="frameGoldContact" x1="40" y1="0" x2="460" y2="640" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#c9a86a" />
                    <stop offset="48%" stopColor="#a07f45" />
                    <stop offset="100%" stopColor="#7a5f30" />
                  </linearGradient>
                </defs>
                <path
                  d="M96.7255 20.1505C98.6132 8.5339 108.646 0 120.415 0L476 0C489.255 0 500 10.7452 500 24V616C500 629.255 489.255 640 476 640H24.2148C9.42367 640 -1.8469 626.75 0.525545 612.151L96.7255 20.1505Z"
                  fill="url(#frameGoldContact)"
                />
              </svg>
              <div className="home-frame__image">
                <img
                  src="/attached_assets/images/doc2.jpg"
                  alt="Contact Lizaz"
                  width={500}
                  height={640}
                  loading="lazy"
                />
              </div>
            </div>
          </div>
          <div className="home-contact__form-wrap">
            <h2 id="contact-title" className="section-title section-title--light">
              Contact Us
            </h2>
            <p className="section-lead section-lead--light">
              Have a question about document clearance, visas, or business setup in the UAE? Fill in the form below and
              our team will respond within 24 hours.
            </p>
            <ContactForm />
          </div>
        </div>
      </section>

      <section className="home-section home-blog reveal" aria-labelledby="blog-title">
        <div className="container">
          <div className="section-header section-header--center home-blog__header">
            <p className="section-label">Our Blog</p>
            <h2 id="blog-title" className="home-subtitle">
              Our Latest News
            </h2>
            <p className="section-lead">
              Stay informed with guides, tips, and updates from our document clearance and visa specialists.
            </p>
          </div>
          <div className="home-blog-slider" aria-roledescription="carousel" aria-label="Latest blog posts">
            <div className="home-blog-slider__viewport">
              <div className="home-blog-slider__track" id="home-blog-track">
                {!data && <p className="home-blog-slider__loading">Loading latest articles...</p>}
                {data && !posts.length && (
                  <p className="home-blog-slider__empty">
                    Unable to load articles right now. <Link href="/blog">Visit the blog</Link>.
                  </p>
                )}
                {posts.map((post) => (
                  <Link key={post.id} className="blog-card" href={`/blog/${encodeURIComponent(post.slug)}`}>
                    <img
                      src={`/${encodeAssetUrl(post.image)}`}
                      alt={post.title}
                      width={400}
                      height={240}
                      loading="lazy"
                    />
                    <div className="blog-card__body">
                      <span className="blog-card__tag">{post.category}</span>
                      <h3 className="blog-card__title">{post.title}</h3>
                      <p>{post.excerpt}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
            <div className="home-blog-slider__footer">
              <Link href="/blog" className="btn btn--primary">
                View all articles
              </Link>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
