import NextAuth, { type DefaultSession } from 'next-auth'
import GitHub from 'next-auth/providers/github'
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
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID || '',
      clientSecret: process.env.AUTH_GITHUB_SECRET || ''
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || '',
      clientSecret: process.env.AUTH_GOOGLE_SECRET || ''
    })
  ],
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
      // console.log("Token ID:"+JSON.stringify(token.id))
      return token
    },
    session: async ({ session, token }) => {
      if (session?.user && token?.id) {
        session.user.id = String(token.id)
      }
      // console.log("Session:"+JSON.stringify(session))
      return session
    },
    authorized({ auth }) {
      const authInfo = String(JSON.stringify(auth))
      // console.log("Info Auth: "+authInfo)
      return !!auth?.user // this ensures there is a logged in user for -every- request
    }
  },
  pages: {
    signIn: '/sign-in' // overrides the next-auth default signin page https://authjs.dev/guides/basics/pages
  }
})
