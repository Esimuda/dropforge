'use client';

import React, { useState, type ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { mainnet, polygon, arbitrum, base, avalanche, bsc, optimism } from 'wagmi/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { queryClient } from '@/lib/queryClient';

import '@rainbow-me/rainbowkit/styles.css';

// ---------------------------------------------------------------------------
// Wagmi config — gracefully handle missing WalletConnect project ID
// ---------------------------------------------------------------------------
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'dropforge-placeholder';

const wagmiConfig = getDefaultConfig({
  appName: 'Dropforge',
  projectId,
  chains: [mainnet, polygon, arbitrum, base, avalanche, bsc, optimism],
  ssr: true,
});

// ---------------------------------------------------------------------------
// RainbowKit custom theme
// ---------------------------------------------------------------------------
const rainbowTheme = darkTheme({
  accentColor: '#FF5C00',
  accentColorForeground: 'white',
  borderRadius: 'medium',
  fontStack: 'system',
  overlayBlur: 'small',
});

// ---------------------------------------------------------------------------
// Providers composition
// ---------------------------------------------------------------------------
interface ProvidersProps {
  children: ReactNode;
  session?: Parameters<typeof SessionProvider>[0]['session'];
}

export function Providers({ children, session }: ProvidersProps) {
  const [client] = useState(() => queryClient);

  return (
    <SessionProvider session={session}>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={client}>
          <RainbowKitProvider theme={rainbowTheme} locale="en-US">
            {children}
            {process.env.NODE_ENV === 'development' && (
              <ReactQueryDevtools initialIsOpen={false} />
            )}
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </SessionProvider>
  );
}
