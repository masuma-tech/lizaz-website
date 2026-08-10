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

/** Must match server/adminPath.ts default when ADMIN_PATH is unset. */
const DEFAULT_ADMIN_PATH = "/lizaz-admin-portal-9k2m7xq";
const DEFAULT_ADMIN_API = "/api/lizaz-admin-portal-9k2m7xq";

type SiteConfig = {
  adminPath: string;
  adminApiBase: string;
};

function Router({ config }: { config: SiteConfig }) {
  const [location] = useLocation();

  if (location === config.adminPath || location.startsWith(`${config.adminPath}/`)) {
    return <Admin apiBase={config.adminApiBase} />;
  }

  // Same pattern as RealEstate — public pages work with no Node/API
  return (
    <Switch>
      <Route path="/about" component={About} />
      <Route path="/services" component={Services} />
      <Route path="/contact" component={Contact} />
      <Route path="/blog/:slug" component={BlogPost} />
      <Route path="/blog" component={Blog} />
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  const [config, setConfig] = useState<SiteConfig>({
    adminPath: DEFAULT_ADMIN_PATH,
    adminApiBase: DEFAULT_ADMIN_API,
  });

  useEffect(() => {
    // Optional: override from Node when available (Apache static hosting ignores this)
    fetch("/api/config")
      .then(async (res) => {
        const type = res.headers.get("content-type") || "";
        if (!res.ok || !type.includes("application/json")) return null;
        return res.json();
      })
      .then((data) => {
        if (data?.adminPath && data?.adminApiBase) {
          setConfig({
            adminPath: data.adminPath,
            adminApiBase: data.adminApiBase,
          });
        }
      })
      .catch(() => {
        /* keep defaults — pages still work without Node */
      });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ScrollToTop />
      <Router config={config} />
    </QueryClientProvider>
  );
}
