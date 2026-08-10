export function encodeAssetUrl(value: string | null | undefined) {
  return String(value ?? "")
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

export function slugify(value: string) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function formatBlogContent(content: string | null | undefined) {
  const looksLikeHeading = (paragraph: string) => {
    const text = paragraph.trim();
    if (!text || text.length > 90) return false;
    if (text.endsWith("?")) return true;
    if (/^\d+[\.\)]\s+\S/.test(text)) return true;
    if (/^[-•●▪]\s+\S/.test(text)) return true;
    if (/[.!,;:]$/.test(text)) return false;
    const words = text.split(/\s+/);
    return words.length > 0 && words.length <= 12;
  };

  const escapeHtml = (value: string) =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  const blocks = String(content ?? "")
    .replaceAll("\r\n", "\n")
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (!blocks.length) {
    return "<p>No content available for this article.</p>";
  }

  return blocks
    .map((block) => {
      const html = escapeHtml(block).replaceAll("\n", "<br>");
      if (looksLikeHeading(block)) return `<h2>${html}</h2>`;
      if (/^[-•●▪]\s+/.test(block)) {
        return `<p class="page-blog-article__list-item">${html}</p>`;
      }
      return `<p>${html}</p>`;
    })
    .join("");
}
