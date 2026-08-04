import { randomBytes } from "crypto";
import type { IncomingMessage, ServerResponse } from "http";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { users, type User } from "../shared/schema";
import { comparePasswords } from "./password";

const SESSION_COOKIE = "lizaz_admin_session";
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

type SessionRecord = {
  userId: string;
  expiresAt: number;
};

const sessions = new Map<string, SessionRecord>();

export type PublicUser = {
  id: string;
  username: string;
  email: string | null;
  name: string | null;
  role: string;
  isAdmin: boolean;
  canManageBlogs: boolean;
  canViewLeads: boolean;
};

function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    name: user.name,
    role: user.role,
    isAdmin: user.isAdmin,
    canManageBlogs: user.canManageBlogs,
    canViewLeads: user.canViewLeads,
  };
}

function parseCookies(req: IncomingMessage): Record<string, string> {
  const header = req.headers.cookie;
  if (!header) return {};

  return header.split(";").reduce<Record<string, string>>((acc, part) => {
    const separator = part.indexOf("=");
    if (separator === -1) return acc;
    const key = part.slice(0, separator).trim();
    const value = decodeURIComponent(part.slice(separator + 1).trim());
    if (key) acc[key] = value;
    return acc;
  }, {});
}

function pruneExpiredSessions() {
  const now = Date.now();
  for (const [token, session] of sessions) {
    if (session.expiresAt <= now) sessions.delete(token);
  }
}

export function setSessionCookie(res: ServerResponse, token: string) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${Math.floor(SESSION_MAX_AGE_MS / 1000)}${secure}`
  );
}

export function clearSessionCookie(res: ServerResponse) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${secure}`
  );
}

export async function getUserByUsername(username: string) {
  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  return row ?? null;
}

export async function getUserById(id: string) {
  const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return row ?? null;
}

export async function authenticateUser(username: string, password: string) {
  const user = await getUserByUsername(username.trim());
  if (!user) return null;
  const valid = await comparePasswords(password, user.password);
  if (!valid) return null;
  return user;
}

export function createSession(userId: string) {
  pruneExpiredSessions();
  const token = randomBytes(32).toString("hex");
  sessions.set(token, {
    userId,
    expiresAt: Date.now() + SESSION_MAX_AGE_MS,
  });
  return token;
}

export function destroySession(token: string | null | undefined) {
  if (!token) return;
  sessions.delete(token);
}

export function getSessionToken(req: IncomingMessage) {
  return parseCookies(req)[SESSION_COOKIE] || null;
}

export async function getSessionUser(req: IncomingMessage): Promise<PublicUser | null> {
  pruneExpiredSessions();
  const token = getSessionToken(req);
  if (!token) return null;

  const session = sessions.get(token);
  if (!session || session.expiresAt <= Date.now()) {
    if (session) sessions.delete(token);
    return null;
  }

  const user = await getUserById(session.userId);
  if (!user) {
    sessions.delete(token);
    return null;
  }

  return toPublicUser(user);
}

export function canManageBlogs(user: PublicUser | null) {
  return Boolean(user && (user.isAdmin || user.canManageBlogs));
}

export function canViewLeads(user: PublicUser | null) {
  return Boolean(user && (user.isAdmin || user.canViewLeads));
}

export { toPublicUser };
