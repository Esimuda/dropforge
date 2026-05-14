// Participant manager: /project/campaigns/[id]/participants
import React from 'react';
import Navbar from '../../../../../components/common/Navbar';
import ParticipantTable from '../../../../../components/project/ParticipantTable';

export default function ParticipantsPage() {
  // TODO: Fetch participants, filters, bulk actions
  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />
      <section className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="font-space-grotesk text-3xl font-bold mb-8">Participants</h1>
        {/* TODO: ParticipantTable, filters, bulk actions */}
      </section>
    </main>
  );
}
