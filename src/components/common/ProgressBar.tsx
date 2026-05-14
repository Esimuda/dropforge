import React from 'react';
export default function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="w-full bg-[#242424] rounded-full h-3 mt-2">
      <div
        className="h-3 rounded-full bg-[#FF5C00] transition-all"
        style={{ width: pct + '%' }}
      />
    </div>
  );
}
