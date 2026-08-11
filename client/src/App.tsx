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
const ADMIN_PATH = import.meta.env.VITE_ADMIN_PATH || "/lizaz-admin-portal-9k2m7xq";
const ADMIN_API = import.meta.env.VITE_ADMIN_API_BASE || "/api/lizaz-admin-portal-9k2m7xq";

function Router() {
  const [location] = useLocation();

  // Admin CMS still uses the Node API when available (auth + Resend stay server-side).
  if (location === ADMIN_PATH || location.startsWith(`${ADMIN_PATH}/`)) {
    return <Admin apiBase={ADMIN_API} />;
  }

  // Public pages fetch blogs/contacts via Supabase — no Node server required.
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
  return (
    <QueryClientProvider client={queryClient}>
      <ScrollToTop />
      <Router />
    </QueryClientProvider>
  );
}
