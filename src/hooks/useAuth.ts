'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useAccount, useDisconnect } from 'wagmi';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useCurrentUser() {
  const { data: session, status } = useSession();
  const { address, isConnected, chain } = useAccount();

  return {
    session,
    status,
    user: session?.user ?? null,
    walletAddress: address,
    isWalletConnected: isConnected,
    walletChain: chain,
    isLoading: status === 'loading',
  };
}

export function useIsAuthenticated() {
  const { data: session } = useSession();
  const { isConnected } = useAccount();
  return !!session || isConnected;
}

export function useAuthRequired(redirectTo = '/login') {
  const { data: session, status } = useSession();
  const { isConnected } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session && !isConnected) {
      router.push(redirectTo);
    }
  }, [session, status, isConnected, router, redirectTo]);

  return { session, isConnected };
}

export function useAuthActions() {
  const { disconnect } = useDisconnect();

  const loginWithTwitter = () => signIn('twitter', { callbackUrl: '/' });
  const loginWithDiscord = () => signIn('discord', { callbackUrl: '/' });
  const logout = async () => {
    await signOut({ redirect: false });
    disconnect();
  };

  return { loginWithTwitter, loginWithDiscord, logout };
}
