// Leaderboard page: /leaderboard/[campaignId]
import React from 'react';
import Navbar from '../../../components/common/Navbar';

export default function LeaderboardPage() {
  // TODO: Fetch leaderboard data
  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />
      <section className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="font-space-grotesk text-3xl font-bold mb-8">Leaderboard</h1>
        {/* TODO: Leaderboard table, highlight current user */}
      </section>
    </main>
  );
}
