/** Public CMS panel path. Not read from ADMIN_PATH, so a server .env cannot point it elsewhere. */
export const ADMIN_PATH = "admin/login";
export const ADMIN_PATHNAME = `/${ADMIN_PATH}`;
export const ADMIN_API_BASE = `/api/${ADMIN_PATH}`;
