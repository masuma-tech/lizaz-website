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
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/services" component={Services} />
      <Route path="/contact" component={Contact} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:slug" component={BlogPost} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("/api/config")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.adminPath && data?.adminApiBase) {
          setConfig(data);
        }
      })
      .catch(() => {
        // Public pages still work without config
      })
      .finally(() => setReady(true));
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ScrollToTop />
      {ready ? <Router config={config} /> : null}
    </QueryClientProvider>
  );
}
