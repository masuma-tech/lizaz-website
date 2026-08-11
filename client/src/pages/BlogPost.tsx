import { useEffect } from "react";
import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/SiteLayout";
import { fetchBlogBySlug } from "@/lib/data";
import { encodeAssetUrl, formatBlogContent } from "@/lib/utils";

export default function BlogPost() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug || "";

  const {
    data: post,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["blogs", "slug", slug],
    enabled: Boolean(slug),
    queryFn: async () => {
      const result = await fetchBlogBySlug(slug);
      if (!result) throw new Error("Blog post not found");
      return result;
    },
  });

  useEffect(() => {
    document.title = post
      ? `${post.title} | Lizaz Blog`
      : "Blog | UAE Visa, Golden Visa & Business Setup Guides — Lizaz";
  }, [post]);

  return (
    <SiteLayout page="blog">
      <article className="page page-blog-article">
        <Link className="page-blog-article__back" href="/blog" aria-label="Back to all articles">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
            <path
              d="M15.5 5.5 9 12l6.5 6.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
        <div className="container page-blog-article__wrap">
          {isLoading && <p className="section-text">Loading article...</p>}
          {isError && (
            <p className="section-text">Unable to load this article. Please go back and try again.</p>
          )}
          {post && (
            <div>
              <header className="page-blog-article__header">
                <span className="page-blog-card__tag">{post.category}</span>
                <h1 className="page-blog-article__title">{post.title}</h1>
                <div className="page-blog-article__meta">
                  <span>{post.author || "Lizaz Team"}</span>
                  <time dateTime={post.date}>{post.date}</time>
                </div>
              </header>
              <img
                className="page-blog-article__image"
                src={`/${encodeAssetUrl(post.image)}`}
                alt={post.title}
                width={1200}
                height={630}
              />
              <div
                className="page-blog-article__content"
                dangerouslySetInnerHTML={{ __html: formatBlogContent(post.content) }}
              />
            </div>
          )}
        </div>
      </article>
    </SiteLayout>
  );
}
