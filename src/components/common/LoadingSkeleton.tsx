import React from 'react';
export default function LoadingSkeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-[#242424] rounded ${className}`} />;
}
