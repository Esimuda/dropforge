import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    user: {
      id?: string;
      twitterHandle?: string;
      discordHandle?: string;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    userId?: string;
    provider?: string;
    twitterHandle?: string;
    discordHandle?: string;
  }
}

export {};
