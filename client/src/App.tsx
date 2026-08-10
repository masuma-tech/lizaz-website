import { useEffect, useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { ScrollToTop } from "@/components/ScrollToTop";
import Home from "@/pages/Home";
import About from "@/pages/About";
import Services from "@/pages/Services";
import Contact from "@/pages/Contact";
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/BlogPost";
import NotFound from "@/pages/NotFound";
import Admin from "@/pages/Admin";

type SiteConfig = {
  adminPath: string;
  adminApiBase: string;
};

function Router({ config }: { config: SiteConfig | null }) {
  const [location] = useLocation();

  if (config && (location === config.adminPath || location.startsWith(`${config.adminPath}/`))) {
    return <Admin apiBase={config.adminApiBase} />;
  }

  return (
    <Switch>
      <Route path="/about">{() => <About />}</Route>
      <Route path="/services">{() => <Services />}</Route>
      <Route path="/contact">{() => <Contact />}</Route>
      <Route path="/blog/:slug">{() => <BlogPost />}</Route>
      <Route path="/blog">{() => <Blog />}</Route>
      <Route path="/">{() => <Home />}</Route>
      <Route>{() => <NotFound />}</Route>
    </Switch>
  );
}

export default function App() {
  const [config, setConfig] = useState<SiteConfig | null>(null);

  useEffect(() => {
    fetch("/api/config")
      .then(async (res) => {
        const type = res.headers.get("content-type") || "";
        if (!res.ok || !type.includes("application/json")) return null;
        return res.json();
      })
      .then((data) => {
        if (data?.adminPath && data?.adminApiBase) {
          setConfig(data);
        }
      })
      .catch(() => {
        // Static Apache hosting has no API — public pages still render
      });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ScrollToTop />
      <Router config={config} />
    </QueryClientProvider>
  );
}
