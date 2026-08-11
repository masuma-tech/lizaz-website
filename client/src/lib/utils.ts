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

type BlogBlock =
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "ol"; items: string[] }
  | { type: "ul"; items: string[] };

const BULLET_RE = /^[-•●▪◦*]\s+/;
const NUMBERED_RE = /^(\d+)[\.\)]\s+/;

function escapeHtml(value: string) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function stripPrefix(text: string) {
  return text.replace(BULLET_RE, "").replace(NUMBERED_RE, "").trim();
}

function endsSentence(text: string) {
  return /[.!?]"?$/.test(text.trim());
}

function looksLikeSectionHeading(text: string) {
  const value = text.trim();
  if (!value || BULLET_RE.test(value) || NUMBERED_RE.test(value)) return false;
  if (value.length > 90) return false;
  if (value.endsWith("?")) return true;
  // Intro lines like "…include the following:" are not section titles.
  if (/[.!,;:]$/.test(value)) return false;
  const words = value.split(/\s+/).filter(Boolean);
  return words.length > 0 && words.length <= 12;
}

function looksLikeNumberedSubheading(text: string) {
  if (!NUMBERED_RE.test(text)) return false;
  const body = stripPrefix(text);
  if (!body) return false;
  const words = body.split(/\s+/).filter(Boolean);
  if (words.length > 14 || body.length > 100) return false;
  // Full sentences belong in lists, not as subheadings.
  if (endsSentence(body) && words.length > 6) return false;
  // Title-style numbered points (often followed by a description paragraph).
  if (!endsSentence(body)) return true;
  if (body.endsWith(":")) return true;
  return words.length <= 8 && !/[;,]/.test(body);
}

function isOrphanContinuation(text: string) {
  const value = text.trim();
  if (!value || BULLET_RE.test(value) || NUMBERED_RE.test(value)) return false;
  const words = value.split(/\s+/).filter(Boolean);
  if (/^[a-z]/.test(value)) return true;
  if (words.length <= 2 && /[.!?]$/.test(value)) return true;
  return false;
}

function isIncompleteLine(text: string) {
  const value = stripPrefix(text.trim());
  if (!value) return false;
  // Labels / broken PDF lines that should continue into the next block.
  if (/[,;:]$/.test(value)) return true;
  if (/[-–]$/.test(value)) return true;
  return false;
}

function canMergeWithPrevious(previous: string, current: string) {
  if (!previous || !current) return false;

  const prev = previous.trim();
  const curr = current.trim();

  // Never glue a new list item or bullet onto the previous block.
  if (BULLET_RE.test(curr) || NUMBERED_RE.test(curr)) return false;

  // Join broken list lines like "...universities" + "worldwide."
  if (
    (BULLET_RE.test(prev) || NUMBERED_RE.test(prev)) &&
    isOrphanContinuation(curr) &&
    !endsSentence(stripPrefix(prev))
  ) {
    return true;
  }

  // "Incorrect:" + "The Documents..." or "Information," + "The Application Forms"
  if (isIncompleteLine(prev)) return true;

  // Lowercase continuations always belong to the previous sentence/fragment.
  if (/^[a-z]/.test(curr) && !endsSentence(stripPrefix(prev))) return true;

  if (endsSentence(prev)) return false;
  return isOrphanContinuation(curr);
}

function splitMultiNumbered(block: string) {
  const trimmed = block.trim();
  if (!/(?:^|(?<=[.!?:]))\s*\d+[\.\)]\s+\S/.test(trimmed)) return [trimmed];

  const parts = trimmed
    .split(/(?:(?<=[.!?:])\s+|(?<=^))\s*(?=\d+[\.\)]\s+\S)/)
    .map((part) => part.trim())
    .filter(Boolean);

  return parts.length > 1 ? parts : [trimmed];
}

function normalizeBlocks(content: string) {
  const rough = content
    .replaceAll("\r\n", "\n")
    .split(/\n\s*\n/)
    .map((block) => block.replace(/\n+/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .flatMap(splitMultiNumbered);

  const merged: string[] = [];
  for (const block of rough) {
    const previous = merged[merged.length - 1];
    if (previous && canMergeWithPrevious(previous, block)) {
      merged[merged.length - 1] = `${previous} ${block}`.replace(/\s+/g, " ").trim();
      continue;
    }
    merged.push(block);
  }

  // Re-split after orphan merges so "…documentation. 4. Next item" becomes two blocks.
  return merged.flatMap(splitMultiNumbered);
}

function classifyBlocks(rawBlocks: string[]): BlogBlock[] {
  const blocks: BlogBlock[] = [];
  let i = 0;

  const flushList = (type: "ol" | "ul", items: string[]) => {
    if (!items.length) return;
    blocks.push({ type, items: [...items] });
    items.length = 0;
  };

  const olItems: string[] = [];
  const ulItems: string[] = [];

  while (i < rawBlocks.length) {
    const block = rawBlocks[i];
    const next = rawBlocks[i + 1];

    if (BULLET_RE.test(block)) {
      flushList("ol", olItems);
      ulItems.push(stripPrefix(block));
      i += 1;
      continue;
    }

    if (NUMBERED_RE.test(block)) {
      flushList("ul", ulItems);

      const nextIsBody =
        Boolean(next) &&
        !BULLET_RE.test(next) &&
        !NUMBERED_RE.test(next) &&
        !looksLikeSectionHeading(next);

      // Numbered title + description paragraph => subtopic heading.
      // Skip when already inside a numbered list (e.g. "1. Al Barsha", "2. Mirdif",
      // "3. Dubai Hills Estate" followed by a closing sentence).
      if (looksLikeNumberedSubheading(block) && nextIsBody && olItems.length === 0) {
        blocks.push({ type: "h3", text: block.trim() });
        i += 1;
        continue;
      }

      olItems.push(stripPrefix(block));
      i += 1;
      continue;
    }

    flushList("ol", olItems);
    flushList("ul", ulItems);

    if (looksLikeSectionHeading(block)) {
      const previousBlock = blocks[blocks.length - 1];
      // Keep visual hierarchy when a short title immediately follows another title.
      blocks.push({
        type: previousBlock?.type === "h2" ? "h3" : "h2",
        text: block,
      });
    } else {
      blocks.push({ type: "p", text: block });
    }
    i += 1;
  }

  flushList("ol", olItems);
  flushList("ul", ulItems);
  return blocks;
}

function renderInline(text: string) {
  return escapeHtml(text);
}

export function formatBlogContent(content: string | null | undefined) {
  const raw = String(content ?? "").trim();
  if (!raw) {
    return "<p>No content available for this article.</p>";
  }

  // Allow intentionally authored HTML from admin to pass through.
  if (/<[a-z][\s\S]*>/i.test(raw)) {
    return raw;
  }

  const blocks = classifyBlocks(normalizeBlocks(raw));
  if (!blocks.length) {
    return "<p>No content available for this article.</p>";
  }

  return blocks
    .map((block) => {
      if (block.type === "h2") return `<h2>${renderInline(block.text)}</h2>`;
      if (block.type === "h3") return `<h3>${renderInline(block.text)}</h3>`;
      if (block.type === "p") return `<p>${renderInline(block.text)}</p>`;
      if (block.type === "ol") {
        const items = block.items.map((item) => `<li>${renderInline(item)}</li>`).join("");
        return `<ol>${items}</ol>`;
      }
      const items = block.items.map((item) => `<li>${renderInline(item)}</li>`).join("");
      return `<ul>${items}</ul>`;
    })
    .join("");
}
