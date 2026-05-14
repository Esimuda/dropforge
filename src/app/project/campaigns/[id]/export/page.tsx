// Export page: /project/campaigns/[id]/export
import React from 'react';
import Navbar from '../../../../../components/common/Navbar';

export default function ExportPage() {
  // TODO: Export eligible participants as CSV/JSON, filters
  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />
      <section className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="font-space-grotesk text-3xl font-bold mb-8">Export Participants</h1>
        {/* TODO: Export options, filters, download buttons */}
      </section>
    </main>
  );
}
