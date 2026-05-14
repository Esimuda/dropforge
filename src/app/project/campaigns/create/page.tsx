'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/common/Navbar';

export default function LegacyCreateCampaignPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/campaigns/new');
  }, [router]);

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />
      <section className="max-w-3xl mx-auto px-4 py-24 text-center">
        <p className="text-[#777] text-sm mb-2">Campaign creation moved</p>
        <h1 className="font-space-grotesk text-2xl font-bold text-white mb-4">Redirecting…</h1>
        <p className="text-sm text-[#555]">
          Opening the new campaign builder at{' '}
          <span className="text-[#FF5C00]">/campaigns/new</span>
        </p>
      </section>
    </main>
  );
}
