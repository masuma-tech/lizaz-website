import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/SiteLayout";
import { fetchPublishedBlogs } from "@/lib/data";
import { encodeAssetUrl } from "@/lib/utils";

export default function Blog() {
  const [activeCategory, setActiveCategory] = useState("All");
  const { data: posts = [], isLoading, isError } = useQuery({
    queryKey: ["blogs", "published"],
    queryFn: fetchPublishedBlogs,
  });

  useEffect(() => {
    document.title = "Blog | UAE Visa, Golden Visa & Business Setup Guides — Lizaz";
  }, []);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(posts.map((p) => p.category).filter(Boolean))).sort()],
    [posts],
  );

  const filtered = activeCategory === "All" ? posts : posts.filter((p) => p.category === activeCategory);
  const featured = posts[0];

  return (
    <SiteLayout page="blog">
      <header className="page-hero page-hero--split" aria-labelledby="blog-page-title">
        <div className="container page-hero--split__grid">
          <div className="page-hero--split__main">
            <p className="section-label">Our Blog</p>
            <h1 id="blog-page-title" className="page__title">
              <span className="page-hero--split__title-line">UAE Visa Updates</span>
              <span className="page-hero--split__title-accent">Guides, Tips &amp; Requirements</span>
            </h1>
          </div>
          <aside className="page-hero--split__aside" aria-label="Blog highlight">
            <span className="page-hero--split__stat">50+</span>
            <span className="page-hero--split__stat-label">Articles</span>
          </aside>
        </div>
      </header>

      <section className="page about-intro blog-featured reveal" aria-labelledby="featured-title">
        <div className="container about-intro__grid">
          <div className="about-intro__media">
            <figure className="about-media">
              <img
                className="about-media__img blog-featured__img"
                src="/attached_assets/images/attestation.jpg"
                alt="Lizaz helps you clear the entire path, from attestation to approval"
                width={340}
                height={450}
                loading="lazy"
              />
            </figure>
          </div>
          <div className="about-intro__content">
            <p className="section-label">Featured Article</p>
            <h2 id="featured-title" className="section-title">
              Lizaz helps you clear the entire path, from attestation to approval
            </h2>
            <p className="section-text">
              This guide walks through each UAE visa type in plain language, the documents required for visa
              applications, and where applicants most often get tripped up during UAE visa processing.
            </p>
            <Link
              className="btn btn--primary"
              href={
                featured
                  ? `/blog/${encodeURIComponent(featured.slug)}`
                  : "/blog/new-uae-visa-rules-you-should-know"
              }
            >
              Read article
            </Link>
          </div>
        </div>
      </section>

      <section className="page page-blog reveal" aria-label="Blog articles">
        <div className="container">
          <div className="page-blog__toolbar">
            <div className="page-blog__toolbar-copy">
              <p className="page-blog__count">Expert Guides by Lizaz</p>
              <p className="page-blog__hint">Browse by topic to find visa, business, and document clearance answers.</p>
            </div>
            <div className="page-blog__filters" role="group" aria-label="Filter articles by topic">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={`page-blog__filter${category === activeCategory ? " is-active" : ""}`}
                  aria-pressed={category === activeCategory}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="page-blog__grid" aria-live="polite">
            {isLoading && <p className="section-text">Loading articles...</p>}
            {isError && <p className="section-text">Unable to load articles right now. Please try again later.</p>}
            {!isLoading && !filtered.length && (
              <p className="section-text">
                {activeCategory === "All"
                  ? "No articles published yet. Check back soon."
                  : `No articles in ${activeCategory} yet. Try another topic.`}
              </p>
            )}
            {filtered.map((post) => (
              <Link key={post.id} className="page-blog-card" href={`/blog/${encodeURIComponent(post.slug)}`}>
                <img
                  src={`/${encodeAssetUrl(post.image)}`}
                  alt={post.title}
                  width={400}
                  height={260}
                  loading="lazy"
                />
                <div className="page-blog-card__body">
                  <span className="page-blog-card__tag">{post.category}</span>
                  <h3 className="page-blog-card__title">{post.title}</h3>
                  <p>{post.excerpt}</p>
                  <div className="page-blog-card__meta">
                    <time>{post.date}</time>
                    <span className="page-blog-card__more">Read more</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
