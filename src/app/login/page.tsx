'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import LoginModal from '@/components/common/LoginModal';
import { useCurrentUser, useIsAuthenticated } from '@/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const { isLoading } = useCurrentUser();
  const isAuthenticated = useIsAuthenticated();
  const [open, setOpen] = useState(true);

  const redirectTo = search.get('redirect') || '/dashboard';

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isAuthenticated, isLoading, redirectTo, router]);

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <p className="text-[#FF5C00] text-xs font-mono uppercase tracking-widest mb-3">
          Dropforge
        </p>
        <h1
          className="text-3xl font-bold mb-3"
          style={{ fontFamily: 'Space Grotesk, sans-serif' }}
        >
          Sign in to continue
        </h1>
        <p className="text-[#888] text-sm mb-6">
          Connect your Twitter, Discord, or wallet to track tasks and earn airdrop eligibility.
        </p>
        <button
          onClick={() => setOpen(true)}
          className="px-5 py-2.5 rounded-lg bg-[#FF5C00] hover:bg-[#E54E00] text-white text-sm font-semibold transition-colors"
        >
          Open sign-in
        </button>
        <p className="text-[#555] text-xs mt-6">
          <Link href="/" className="hover:text-[#FF5C00]">
            ← Back to home
          </Link>
        </p>
      </div>
      <LoginModal open={open} onClose={() => setOpen(false)} />
    </main>
  );
}
