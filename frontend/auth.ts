import NextAuth, { Session, type DefaultSession, Profile } from 'next-auth'
import GitHub from 'next-auth/providers/github'
import { JWT } from '@auth/core/jwt'

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
  providers: [GitHub],
  callbacks: {
    jwt({ token, profile }: { profile?: Profile; token: JWT }) {
      if (profile) {
        token.id = profile.id
        token.image = profile.avatar_url || profile.picture
      }
      return token
    },
    session: ({ session, token }: { session: Session; token: JWT }) => {
      if (session?.user && token?.id) {
        session.user.id = String(token.id)
      }
      return session
    },
    authorized({ auth }: { auth: Session | null }) {
      return !!auth?.user // this ensures there is a logged in user for -every- request
    }
  },
  pages: {
    signIn: '/sign-in' // overrides the next-auth default signin page https://authjs.dev/guides/basics/pages
  }
})
