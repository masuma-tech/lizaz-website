/** Secret CMS panel path — set ADMIN_PATH in .env (never use /admin). */
export function normalizeAdminPath(raw: string | undefined): string {
  const cleaned = String(raw || "")
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .replace(/\/+/g, "/");

  if (!cleaned || cleaned.toLowerCase() === "admin" || cleaned.toLowerCase().startsWith("admin/")) {
    return "lizaz-admin-portal-9k2m7xq";
  }

  return cleaned;
}

export const ADMIN_PATH = normalizeAdminPath(process.env.ADMIN_PATH);
export const ADMIN_PATHNAME = `/${ADMIN_PATH}`;
export const ADMIN_API_BASE = `/api/${ADMIN_PATH}`;
