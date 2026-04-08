import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'

const providers = []

// Siempre disponible: usuario/contraseña familiar
providers.push(
  Credentials({
    credentials: {
      username: { label: 'Usuario', type: 'text' },
      password: { label: 'Contraseña', type: 'password' },
    },
    authorize(credentials) {
      const validUser = process.env.APP_USERNAME ?? 'familiaGM'
      const validPass = process.env.APP_PASSWORD ?? 'NOAH2026'
      if (
        typeof credentials?.username === 'string' &&
        typeof credentials?.password === 'string' &&
        credentials.username === validUser &&
        credentials.password === validPass
      ) {
        return { id: '1', name: 'Familia GM', email: 'familia@noecare.app' }
      }
      return null
    },
  })
)

// Google OAuth opcional — solo si están configuradas las env vars
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/calendar',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
  )
}

const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isPublic = nextUrl.pathname.startsWith('/login') ||
        nextUrl.pathname.startsWith('/api/auth') ||
        nextUrl.pathname.startsWith('/api/whatsapp') ||
        nextUrl.pathname === '/offline'
      if (isPublic) return true
      if (!isLoggedIn) return Response.redirect(new URL('/login', nextUrl))
      return true
    },
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined
      return session
    },
  },
})

export { handlers, auth, signIn, signOut }
export const { GET, POST } = handlers
