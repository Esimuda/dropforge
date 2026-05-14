import React from 'react';
export default function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <div className="text-5xl mb-4">🪂</div>
      <div className="text-lg font-semibold">{message}</div>
    </div>
  );
}
