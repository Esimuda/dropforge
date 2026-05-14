import NextAuth, { type NextAuthOptions } from 'next-auth';
import type { Provider } from 'next-auth/providers';

const providers: Provider[] = [];

// Twitter / X provider — only if env vars are set
if (
  process.env.TWITTER_CLIENT_ID &&
  process.env.TWITTER_CLIENT_SECRET &&
  process.env.TWITTER_CLIENT_ID.length > 0 &&
  process.env.TWITTER_CLIENT_SECRET.length > 0
) {
  const TwitterProvider = (await import('next-auth/providers/twitter')).default;
  providers.push(
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
      version: '2.0',
    })
  );
}

// Discord provider — only if env vars are set
if (
  process.env.DISCORD_CLIENT_ID &&
  process.env.DISCORD_CLIENT_SECRET &&
  process.env.DISCORD_CLIENT_ID.length > 0 &&
  process.env.DISCORD_CLIENT_SECRET.length > 0
) {
  const DiscordProvider = (await import('next-auth/providers/discord')).default;
  providers.push(
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
    })
  );
}

const authOptions: NextAuthOptions = {
  providers,
  secret: process.env.NEXTAUTH_SECRET || 'dropforge-fallback-secret',
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        token.userId = token.sub;
        token.provider = account.provider;
      }
      if (profile) {
        // Twitter v2 profile
        const twitterProfile = profile as Record<string, unknown>;
        if (twitterProfile.data) {
          const data = twitterProfile.data as Record<string, unknown>;
          token.twitterHandle = data.username as string;
        }
        // Discord profile
        if (twitterProfile.username) {
          token.discordHandle = twitterProfile.username as string;
        }
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        accessToken: token.accessToken as string | undefined,
        user: {
          ...session.user,
          id: token.userId as string | undefined,
          twitterHandle: token.twitterHandle as string | undefined,
          discordHandle: token.discordHandle as string | undefined,
        },
      };
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
