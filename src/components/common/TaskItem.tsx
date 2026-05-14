import React from 'react';
import type { Task } from '@/types';

const typeIcons: Record<string, string> = {
  twitter_follow: '🐦',
  twitter_retweet: '🔁',
  discord_join: '💬',
  hold_token: '🪙',
  submit_screenshot: '📸',
  custom: '✨',
};

export default function TaskItem({ task }: { task: Task }) {
  return (
    <div className="flex items-center gap-4 bg-[#1A1A1A] rounded-lg p-4 mb-2">
      <div className="h-8 w-8 bg-[#242424] rounded-full flex items-center justify-center text-xl">
        {typeIcons[task.type] || '📝'}
      </div>
      <div className="flex-1">
        <div className="font-semibold">{task.title}</div>
        <div className="text-xs text-gray-400">{task.type.replace('_', ' ')} • {task.points} pts</div>
      </div>
      {task.status === 'completed' ? (
        <div className="text-green-400 font-bold">✔</div>
      ) : task.status === 'pending_verification' ? (
        <div className="text-yellow-400 animate-pulse font-bold">⏳</div>
      ) : (
        <button className="bg-[#FF5C00] text-black font-bold px-4 py-1 rounded-full hover:bg-orange-500 transition text-xs">Complete</button>
      )}
    </div>
  );
}
