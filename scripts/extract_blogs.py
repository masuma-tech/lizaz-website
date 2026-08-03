"""Extract blog content from Blog/ folder into JSON for seeding."""
from __future__ import annotations

import json
import re
from pathlib import Path

import fitz
from docx import Document

ROOT = Path(__file__).resolve().parents[1]
BLOG_DIR = ROOT / "Blog"
OUT_FILE = ROOT / "scripts" / "blog_posts.json"

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
DOC_EXTS = {".pdf", ".docx"}


def slugify(title: str) -> str:
    s = title.strip().lower()
    s = s.replace("&", " and ")
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"[-\s]+", "-", s).strip("-")
    return s


def clean_title(folder_name: str) -> str:
    t = folder_name.strip()
    t = t.lstrip("_")
    if t.endswith("_"):
        t = t[:-1].rstrip() + "?"
    t = re.sub(r"_\s+", ": ", t)
    t = t.replace("_", " ")
    t = re.sub(r"\s+", " ", t).strip()
    t = re.sub(r"\bdubai\b", "Dubai", t, flags=re.I)
    for ac in ("UAE", "NOC", "NOCs", "PRO", "MOFA", "MOHRE"):
        t = re.sub(rf"\b{re.escape(ac)}\b", ac, t, flags=re.I)
    return t


def extract_pdf(path: Path) -> str:
    doc = fitz.open(path)
    parts = []
    for page in doc:
        parts.append(page.get_text("text"))
    doc.close()
    return "\n".join(parts).strip()


def extract_docx(path: Path) -> str:
    document = Document(path)
    parts = [p.text.strip() for p in document.paragraphs if p.text.strip()]
    return "\n\n".join(parts).strip()


def looks_like_heading(line: str) -> bool:
    s = line.strip()
    if not s:
        return False
    if len(s) > 90:
        return False
    if s.endswith("?"):
        return True
    if re.match(r"^\d+[\.\)]\s+\S", s):
        return True
    if re.match(r"^[-•●▪]\s+\S", s):
        return True
    # Title Case / short section headings without terminal period
    if not s.endswith(".") and not s.endswith(","):
        words = s.split()
        if 1 <= len(words) <= 12:
            # Many words start with capital or are short connectors
            caps = sum(1 for w in words if w[:1].isupper() or w.lower() in {"and", "or", "of", "the", "in", "to", "for", "a", "an", "&"})
            if caps >= max(1, len(words) - 1):
                return True
    return False


def reflow_content(text: str) -> str:
    """Join soft PDF line wraps while preserving headings and paragraphs."""
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    # Remove zero-width / soft-hyphen junk from PDFs
    text = text.replace("\u200b", "").replace("\u200c", "").replace("\u00ad", "")
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    # Join orphaned bullet markers onto the next line
    text = re.sub(r"(^|\n)\s*([-•●▪▪︎○]|●)\s*\n+\s*", r"\1- ", text)

    # Prefer existing blank-line paragraphs when present
    if "\n\n" in text:
        blocks = re.split(r"\n\s*\n", text)
        out = []
        for block in blocks:
            lines = [ln.strip() for ln in block.split("\n") if ln.strip()]
            if not lines:
                continue
            out.append(reflow_lines(lines))
        return "\n\n".join(out).strip()

    lines = [ln.strip() for ln in text.split("\n") if ln.strip()]
    return reflow_lines(lines)


def reflow_lines(lines: list[str]) -> str:
    if not lines:
        return ""

    paragraphs: list[str] = []
    buf: list[str] = []

    def flush() -> None:
        nonlocal buf
        if not buf:
            return
        paragraphs.append(" ".join(buf).strip())
        buf = []

    for line in lines:
        if looks_like_heading(line):
            flush()
            paragraphs.append(line)
            continue

        if not buf:
            buf = [line]
            continue

        prev = buf[-1]
        if prev.endswith("-") and not prev.endswith(" -"):
            buf[-1] = prev[:-1] + line
        elif prev.endswith((".", "!", "?", ":", ";")) and looks_like_heading(line):
            flush()
            paragraphs.append(line)
        else:
            buf.append(line)

    flush()
    return "\n\n".join(paragraphs).strip()


def pick_image(files: list[Path]) -> Path | None:
    images = [f for f in files if f.suffix.lower() in IMAGE_EXTS]
    if not images:
        return None
    banners = [f for f in images if "BANNER" in f.name.upper() or "LIZ-BLOG" in f.name.upper()]
    if banners:
        return sorted(banners, key=lambda p: p.name)[0]
    preferred = [f for f in images if "picture" not in f.name.lower()]
    if preferred:
        return sorted(preferred, key=lambda p: p.name)[0]
    return sorted(images, key=lambda p: p.name)[0]


def pick_doc(files: list[Path]) -> Path | None:
    docs = [f for f in files if f.suffix.lower() in DOC_EXTS]
    if not docs:
        return None
    # Prefer DOCX for cleaner paragraph structure when both exist
    docx_files = [f for f in docs if f.suffix.lower() == ".docx"]
    if docx_files:
        return sorted(docx_files, key=lambda p: p.name)[0]
    return sorted(docs, key=lambda p: p.name)[0]


def infer_category(title: str, content: str) -> str:
    text = f"{title} {content}".lower()
    if any(k in text for k in ["attestation", "mofa", "document clearing", "power of attorney", "transcript", "noc"]):
        if "visa" in title.lower() or "residency" in title.lower():
            return "Visa Services"
        return "Document Clearance"
    if any(k in text for k in ["business", "company setup", "licensing", "free zone", "mainland", "pro service", "trade licence", "trade license"]):
        return "Business Setup"
    if any(k in text for k in ["visa", "residency", "outpass", "mohre", "multi-entry", "expire"]):
        return "Visa Services"
    if any(k in text for k in ["immigration", "expat", "foreign investor"]):
        return "Immigration"
    return "Document Clearance"


def make_excerpt(content: str, title: str, max_len: int = 220) -> str:
    paras = [p.strip() for p in content.split("\n\n") if p.strip()]
    # Prefer first non-heading paragraph
    body_paras = []
    for p in paras:
        if looks_like_heading(p) and len(p) < 90:
            continue
        body_paras.append(p)
        if len(" ".join(body_paras)) > 80:
            break
    body = " ".join(body_paras) if body_paras else " ".join(paras)
    body = re.sub(r"\s+", " ", body).strip()
    if len(body) <= max_len:
        return body
    cut = body[: max_len - 1].rsplit(" ", 1)[0]
    return cut + "…"


def strip_leading_title(content: str, title: str) -> str:
    if not content:
        return content
    paras = [p for p in content.split("\n\n") if p.strip()]
    if not paras:
        return content

    expected = re.sub(r"\s+", " ", title).strip().lower().rstrip("?.")
    title_words = expected.split()

    # Drop leading paragraphs that are title leftovers from PDF line wraps
    # e.g. orphaned "Investment" or "How to Avoid Them)"
    while paras:
        first = re.sub(r"\s+", " ", paras[0]).strip().lower().rstrip("?.")
        first_clean = re.sub(r"[()]", "", first).strip()

        is_full_title = first == expected or (
            len(first) <= len(expected) + 5 and expected.startswith(first)
        )
        is_title_prefix = first.startswith(expected + " ")
        is_orphan_fragment = (
            len(first.split()) <= 6
            and (
                first_clean in expected
                or any(first_clean == w for w in title_words)
                or expected.endswith(first_clean)
            )
        )

        if is_full_title or is_orphan_fragment:
            paras = paras[1:]
            continue

        if is_title_prefix:
            remainder = paras[0]
            # Remove title text from start of paragraph (case-insensitive)
            pattern = re.compile("^" + re.escape(title) + r"[\s?.]*", re.I)
            remainder = pattern.sub("", remainder).strip()
            if remainder:
                paras[0] = remainder
            else:
                paras = paras[1:]
            break

        break

    return "\n\n".join(paras).strip()


def main() -> None:
    posts = []
    folders = sorted([p for p in BLOG_DIR.iterdir() if p.is_dir()], key=lambda p: p.name.lower())

    for folder in folders:
        files = [f for f in folder.iterdir() if f.is_file()]
        doc = pick_doc(files)
        image = pick_image(files)
        title = clean_title(folder.name)

        content = ""
        source = None
        if doc:
            source = str(doc.relative_to(ROOT)).replace("\\", "/")
            if doc.suffix.lower() == ".pdf":
                content = extract_pdf(doc)
            else:
                content = extract_docx(doc)
            content = reflow_content(content)
            content = strip_leading_title(content, title)

        image_path = None
        if image:
            image_path = str(image.relative_to(ROOT)).replace("\\", "/")

        posts.append(
            {
                "folder": folder.name,
                "title": title,
                "slug": slugify(title),
                "excerpt": make_excerpt(content, title) if content else "",
                "content": content,
                "category": infer_category(title, content),
                "author": "Lizaz Team",
                "date": "3, Aug 2025",
                "image": image_path or "attached_assets/images/doc_clearance.jpg",
                "published": True,
                "source": source,
                "has_content": bool(content),
            }
        )

    OUT_FILE.write_text(json.dumps(posts, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(posts)} posts to {OUT_FILE}")
    missing = [p["folder"] for p in posts if not p["has_content"]]
    if missing:
        print("Missing content for:")
        for m in missing:
            print(f"  - {m}")


if __name__ == "__main__":
    main()
