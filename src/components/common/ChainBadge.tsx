import React from 'react';
export default function ChainBadge({ chain }: { chain: string }) {
  return (
    <span className="inline-block bg-[#242424] text-[#FF5C00] font-bold px-2 py-0.5 rounded-full text-xs">
      {chain}
    </span>
  );
}
