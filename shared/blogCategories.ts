export const BLOG_CATEGORIES = [
  "Business Setup",
  "Document Clearance",
  "Visa Services",
  "PRO Services",
  "Government Fees",
  "Company Formation",
  "Licensing",
  "General",
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];
