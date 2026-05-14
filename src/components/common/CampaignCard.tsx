import React from 'react';
import type { Campaign } from '@/types';
import ChainBadge from './ChainBadge';

function getCountdown(endDate: string): string {
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return 'Ended';
  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  return `${d}d ${h}h`;
}

export default function CampaignCard({ campaign }: { campaign: Campaign }) {
  return (
    <a href={`/campaigns/${campaign.id}`} className="bg-[#1A1A1A] rounded-xl p-5 flex flex-col gap-3 shadow hover:scale-105 transition cursor-pointer group">
      <div className="flex items-center gap-3 mb-2">
        <img src={campaign.projectLogo} alt={campaign.projectName} className="h-12 w-12 rounded-full bg-[#242424] object-cover" />
        <div>
          <h3 className="font-bold text-lg group-hover:text-[#FF5C00] transition">{campaign.name}</h3>
          <div className="text-xs text-gray-400">by {campaign.projectName}</div>
        </div>
      </div>
      <div className="flex gap-2 items-center text-xs">
        <ChainBadge chain={campaign.chain} />
        <span className="bg-[#242424] px-2 py-0.5 rounded text-[#FF5C00] font-semibold">{campaign.rewardType.charAt(0).toUpperCase() + campaign.rewardType.slice(1)}</span>
      </div>
      <div className="flex gap-2 text-xs text-gray-400">
        <span>{campaign.taskCount} Tasks</span>
        <span>{campaign.participantCount} Participants</span>
      </div>
      <div className="flex gap-2 items-center mt-auto">
        <span className="text-xs text-gray-400">Ends in {getCountdown(campaign.endDate)}</span>
        <span className="ml-auto font-bold text-[#FF5C00]">{campaign.pointsAvailable} pts</span>
      </div>
    </a>
  );
}
