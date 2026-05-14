// Campaign creation: /project/campaigns/create
import React from 'react';
import Navbar from '../../../../components/common/Navbar';
import TaskBuilder from '../../../../components/project/TaskBuilder';

export default function CreateCampaignPage() {
  // TODO: Campaign creation form, task builder
  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />
      <section className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="font-space-grotesk text-3xl font-bold mb-8">Create Campaign</h1>
        {/* TODO: Form fields, TaskBuilder, Save/Publish buttons */}
      </section>
    </main>
  );
}
