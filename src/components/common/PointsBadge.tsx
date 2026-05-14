import React from 'react';
export default function PointsBadge({ points }: { points: number }) {
  return (
    <span className="inline-block bg-[#FF5C00] text-black font-bold px-3 py-1 rounded-full animate-pulse">
      {points} pts
    </span>
  );
}
