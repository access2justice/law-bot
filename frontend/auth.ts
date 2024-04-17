import NextAuth, { type DefaultSession } from 'next-auth'
import Google from 'next-auth/providers/google'

declare module 'next-auth' {
  interface Session {
    user: {
      /** The user's id. */
      id: string
    } & DefaultSession['user']
  }
}

export const {
  handlers: { GET, POST },
  auth
} = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || '',
      clientSecret: process.env.AUTH_GOOGLE_SECRET || '',
      redirectProxyUrl: process.env.NGROK_URL
    })
  ],
  secret: process.env.AUTH_SECRET,
  callbacks: {
    jwt({ token, profile, user }) {
      if (profile) {
        if (profile.id) {
          token.id = profile.id
        }
        if (user.id) {
          token.id = user.id
        }
        token.image = profile.avatar_url || profile.picture
      }
      return token
    },
    session: async ({ session, token }) => {
      if (session?.user && token?.id) {
        session.user.id = String(token.id)
      }
      return session
    },
    authorized({ auth }) {
      return !!auth?.user // this ensures there is a logged in user for -every- request
    }
  },
  pages: {
    signIn: '/sign-in' // overrides the next-auth default signin page https://authjs.dev/guides/basics/pages
  }
})
