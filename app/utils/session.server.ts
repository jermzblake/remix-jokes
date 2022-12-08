import bcrypt from 'bcryptjs'
import { createCookieSessionStorage, redirect } from "@remix-run/node";
import { db } from "~/utils/db.server";

export const login = async (username: string, password: string) => {
  const existingUser = await db.user.findUnique({
    where: { username: username}
  })
  if (!existingUser) return null

  const isValidPassword = await bcrypt.compare(password, existingUser.passwordHash)
  if (!isValidPassword) return null

  existingUser.passwordHash = '' // remove password hash when returning user
  return existingUser
}


export const logout = async (request: Request) => {
  const session = await getUserSession(request)
  return redirect("/login", {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  })
}

export const register = async (username: string, password: string) => {
  const SALT_ROUNDS = 6
  const hash = await bcrypt.hash(password, SALT_ROUNDS)
  const user = await db.user.create({
    data: { username, passwordHash: hash }
  })
  return { id: user?.id, username }
}

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error("SESSION_SECRET must be set");
}

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage({
    // a Cookie from `createCookie` or the same CookieOptions to create one
    cookie: {
      name: "JOKE__session",
      // normally you want this to be `secure: true`
      // but that doesn't work on localhost for Safari
      // https://web.dev/when-to-use-local-https/
      secure: process.env.NODE_ENV === "production",
      secrets: [sessionSecret],
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: true,
    },
  });

export const createUserSession = async (userId: string, redirectTo: string) => {
  const session = await getSession()
  session.set("userId", userId)
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  })
}

export const getUserSession = (request: Request) => {
  return getSession(request.headers.get("Cookie"))
}

export const getUserId = async (request: Request) => {
  const session = await getUserSession(request)
  const userId = session.get("userId")
  if (!userId || typeof userId !== "string") return null
  return userId
}

export const requireUserId = async (
  request: Request,
  redirectTo: string = new URL(request.url).pathname
) => {
  const session = await getUserSession(request);
  const userId = session.get("userId");
  if (!userId || typeof userId !== "string") {
    const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
    throw redirect(`/login?${searchParams}`);
  }
  return userId;
}

export const getUser = async (request: Request) => {
  const userId = await getUserId(request);
  if (typeof userId !== "string") {
    return null;
  }

  try {
  const user = await db.user.findUnique({
    where: {id: userId},
    select: { id: true, username: true }
  })
    return user
  } catch {
    throw logout(request)
  }
}