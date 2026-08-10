import { ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { WhatsAppFloat } from "./WhatsAppFloat";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export function SiteLayout({ children, page }: { children: ReactNode; page: string }) {
  const [location] = useLocation();
  useScrollReveal([location, page]);

  useEffect(() => {
    document.body.dataset.page = page;
    window.scrollTo(0, 0);
    return () => {
      delete document.body.dataset.page;
    };
  }, [page, location]);

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
      <WhatsAppFloat />
    </>
  );
}
