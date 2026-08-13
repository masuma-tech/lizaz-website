import { useEffect } from "react";

export function useScrollReveal(deps: unknown[] = []) {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const addReveal = (el: Element | null, variant = "reveal-up", delay: string | null = null) => {
      if (!el) return;
      el.classList.add("reveal", variant);
      if (delay != null) (el as HTMLElement).style.setProperty("--reveal-delay", delay);
    };

    const addStaggerReveal = (elements: NodeListOf<Element>, step = 0.06, variant = "reveal-pop") => {
      elements.forEach((el, i) => {
        el.classList.add("reveal", variant);
        (el as HTMLElement).style.setProperty("--reveal-delay", `${i * step}s`);
      });
    };

    document.querySelectorAll("section.reveal").forEach((section) => {
      section.classList.remove("reveal");
      section.querySelectorAll(".section-header").forEach((el) => addReveal(el, "reveal-up"));
      addReveal(section.querySelector(".home-about__media"), "reveal-left");
      addReveal(section.querySelector(".home-about__content"), "reveal-right");
      addReveal(section.querySelector(".home-contact__media"), "reveal-left");
      addReveal(section.querySelector(".home-contact__form-wrap"), "reveal-right");
      addReveal(section.querySelector(".page-contact-form__intro"), "reveal-left");
      addReveal(section.querySelector(".page-contact-form__wrap"), "reveal-right");
      addReveal(section.querySelector(".testimonial-split__content"), "reveal-up");
      addReveal(section.querySelector(".testimonial-split__media"), "reveal-pop", "0.12s");
      addReveal(section.querySelector(".about-intro__media"), "reveal-left");
      addReveal(section.querySelector(".about-intro__content"), "reveal-right");
      addReveal(section.querySelector(".about-commitment__content"), "reveal-left");
      addReveal(section.querySelector(".about-commitment__media"), "reveal-right");
      addReveal(section.querySelector(".about-cta__inner"), "reveal-pop");
      addStaggerReveal(section.querySelectorAll(".service-card"), 0.08);
      addStaggerReveal(section.querySelectorAll(".page-service-card"), 0.08);
      addStaggerReveal(section.querySelectorAll(".why-card"), 0.07);
      addStaggerReveal(section.querySelectorAll(".process-card"), 0.08);
      addStaggerReveal(section.querySelectorAll(".faq-accordion__item"), 0.06, "reveal-up");
      addStaggerReveal(section.querySelectorAll(".about-stat"), 0.08);
      addStaggerReveal(section.querySelectorAll(".about-value-card"), 0.07);
      addStaggerReveal(section.querySelectorAll(".page-blog-card"), 0.07);
      addStaggerReveal(section.querySelectorAll(".blog-card"), 0.07);
      addReveal(section.querySelector(".page-hero--split__main"), "reveal-up");
      addReveal(section.querySelector(".page-hero--split__aside"), "reveal-pop", "0.1s");
      addReveal(section.querySelector(".home-blog-slider"), "reveal-up");
      addReveal(section.querySelector(".faq-cta"), "reveal-pop", "0.25s");
      addReveal(section.querySelector(".process-timeline__line"), "reveal-fade", "0.15s");
    });

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -48px 0px" },
    );

    document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

    return () => revealObserver.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
