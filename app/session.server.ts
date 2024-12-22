import { createCookieSessionStorage } from "@remix-run/node"

type SessionData = {
  verified: boolean
}
const SECRET_KEY = process.env.SECRET_KEY || "secretkey"

const sessionStorage = createCookieSessionStorage<SessionData>({
  cookie: {
    name: "__session",
    httpOnly: true,
    maxAge: 60,
    path: "/",
    sameSite: "lax",
    secrets: [SECRET_KEY],
    secure: true,
  },
})

export const { getSession, commitSession, destroySession } = sessionStorage
