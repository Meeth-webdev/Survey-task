// api/src/routes/auth.ts

import { googleAuth } from '@hono/oauth-providers/google'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { Hono } from 'hono'
import { setCookie } from 'hono/cookie'
import { users } from '../db/schema'

// We define our Cloudflare Bindings here so TypeScript knows they exist
type Bindings = {
  DB: D1Database
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
}

const auth = new Hono<{ Bindings: Bindings }>()

// Notice we now use `c.env` instead of `process.env`
auth.use('/google', async (c, next) => {
  return googleAuth({
    client_id: c.env.GOOGLE_CLIENT_ID,
    client_secret: c.env.GOOGLE_CLIENT_SECRET,
    scope: ['openid', 'email', 'profile'],
  })(c, next)
})

auth.get('/google', async (c) => {
  const token = c.get('token')
  const user = c.get('user-google')

  if (!user?.id || !user.email || !user.name || !token?.token) {
    return c.json({ error: 'Authentication failed: Missing required user data' }, 401)
  }

  // 1. Initialize Drizzle with the Cloudflare D1 binding
  const db = drizzle(c.env.DB)

  // 2. Check if the user already exists in the database
  const existingUser = await db.select().from(users).where(eq(users.email, user.email)).get()

  // 3. If they don't exist, create a new record!
  if (!existingUser) {
    await db.insert(users).values({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: new Date(),
    })
  }

  setCookie(c, 'userId', user.id, {
    path: '/',
    secure: false, // Set to true when you deploy to production
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7,
  })

  return c.redirect('http://localhost:5173/dashboard')
})

export default auth
