'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAuthActions } from '@/hooks/useAuth';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

// In static / mock mode the NextAuth API route doesn't exist (GitHub Pages
// can't serve server routes). Disable social login and prompt wallet connect.
const STATIC_MODE = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

export default function LoginModal({ open, onClose }: LoginModalProps) {
  const { loginWithTwitter, loginWithDiscord } = useAuthActions();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md rounded-2xl border border-[#222] bg-[#141414] shadow-2xl overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#FF5C00]/10 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-[#888] hover:text-white hover:border-[#FF5C00]/40 transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative p-7 pt-8">
          <div className="mb-6">
            <p className="text-[#FF5C00] text-xs font-mono uppercase tracking-widest mb-2">
              Sign in to Dropforge
            </p>
            <h2
              className="text-2xl font-bold text-white"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              Join the quest
            </h2>
            <p className="text-[#888] text-sm mt-1.5">
              Connect to track tasks, earn points, and claim airdrops.
            </p>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={() => !STATIC_MODE && loginWithTwitter()}
              disabled={STATIC_MODE}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] hover:border-[#FF5C00]/40 hover:bg-[#1E1E1E] transition-colors text-left group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-[#2A2A2A] disabled:hover:bg-[#1A1A1A]"
            >
              <span className="w-9 h-9 rounded-md bg-black flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.733-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">Continue with X</p>
                <p className="text-xs text-[#666]">
                  {STATIC_MODE ? 'Available on full deploy' : 'Connect your Twitter / X account'}
                </p>
              </div>
            </button>

            <button
              onClick={() => !STATIC_MODE && loginWithDiscord()}
              disabled={STATIC_MODE}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] hover:border-[#FF5C00]/40 hover:bg-[#1E1E1E] transition-colors text-left group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-[#2A2A2A] disabled:hover:bg-[#1A1A1A]"
            >
              <span className="w-9 h-9 rounded-md bg-[#5865F2] flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057c.001.024.014.05.033.067a19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z" />
                </svg>
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">Continue with Discord</p>
                <p className="text-xs text-[#666]">
                  {STATIC_MODE ? 'Available on full deploy' : 'Verify your server memberships'}
                </p>
              </div>
            </button>

            <div className="flex items-center gap-3 py-2">
              <div className="h-px flex-1 bg-[#222]" />
              <span className="text-xs text-[#555] font-mono">OR</span>
              <div className="h-px flex-1 bg-[#222]" />
            </div>

            <ConnectButton.Custom>
              {({ openConnectModal, account, openAccountModal, mounted }) => {
                const ready = mounted;
                const connected = ready && account;
                return (
                  <button
                    onClick={() => {
                      if (connected) {
                        openAccountModal();
                      } else {
                        openConnectModal();
                      }
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-[#FF5C00] hover:bg-[#E54E00] transition-colors text-left"
                  >
                    <span className="w-9 h-9 rounded-md bg-black/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        />
                      </svg>
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">
                        {connected ? `Connected: ${account.displayName}` : 'Connect Wallet'}
                      </p>
                      <p className="text-xs text-white/70">
                        {connected ? 'Tap to manage account' : 'ETH, Base, Arbitrum, Polygon & more'}
                      </p>
                    </div>
                  </button>
                );
              }}
            </ConnectButton.Custom>
          </div>

          <p className="text-[#555] text-[11px] text-center mt-6 leading-relaxed">
            By signing in you agree to our terms. We never post on your behalf.
          </p>
        </div>
      </div>
    </div>
  );
}
