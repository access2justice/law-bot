import NextAuth, { Session, type DefaultSession, Profile } from 'next-auth'
import GitHub from 'next-auth/providers/github'

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
  providers: [GitHub({}) as any],
  callbacks: {
    jwt({ token, profile }: { profile?: Profile; token: any }) {
      if (profile) {
        token.id = profile.id
        token.image = profile.avatar_url || profile.picture
      }
      return token
    },
    session: ({ session, token }: { session: Session; token: any }) => {
      if (session?.user && token?.id) {
        session.user.id = String(token.id)
      }
      return session
    }
  },
  pages: {
    signIn: '/sign-in' // overrides the next-auth default signin page https://authjs.dev/guides/basics/pages
  }
})
