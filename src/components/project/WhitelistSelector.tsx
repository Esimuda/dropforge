'use client';

import React, { useMemo, useState } from 'react';
import { Sparkles, Shuffle, Trophy, Loader2 } from 'lucide-react';
import type { Participant } from '@/types';
import {
  WhitelistMode,
  previewWhitelistSelection,
  useSelectWhitelist,
} from '@/hooks/useProject';

interface Props {
  campaignId: string;
  participants: Participant[];
}

const MODES: { id: WhitelistMode; label: string; description: string; Icon: typeof Sparkles }[] = [
  {
    id: 'TOP_PERFORMERS',
    label: 'Top performers',
    description: 'Sort by points descending and take the top N participants.',
    Icon: Trophy,
  },
  {
    id: 'RANDOM',
    label: 'Random',
    description: 'Shuffle the eligible pool and pick N participants at random.',
    Icon: Shuffle,
  },
  {
    id: 'HYBRID',
    label: 'Hybrid',
    description: 'Take the top half by points, then randomly fill the rest.',
    Icon: Sparkles,
  },
];

export default function WhitelistSelector({ campaignId, participants }: Props) {
  const [mode, setMode] = useState<WhitelistMode>('TOP_PERFORMERS');
  const [count, setCount] = useState<number>(Math.min(10, participants.length || 10));
  const [hasWallet, setHasWallet] = useState(true);
  const [completedRequired, setCompletedRequired] = useState(true);
  const [minPoints, setMinPoints] = useState<number | ''>('');
  const [showPreview, setShowPreview] = useState(false);
  const select = useSelectWhitelist();

  const filters = useMemo(
    () => ({
      hasWallet,
      completedRequired,
      minPoints: minPoints === '' ? undefined : Number(minPoints),
    }),
    [hasWallet, completedRequired, minPoints],
  );

  const previewList = useMemo(
    () => previewWhitelistSelection(participants, mode, count, filters),
    [participants, mode, count, filters],
  );

  const onConfirm = async () => {
    await select.mutateAsync({ campaignId, mode, count, filters });
    setShowPreview(false);
  };

  return (
    <section className="rounded-2xl border border-[#222] bg-[#121212] p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="font-space-grotesk text-xl font-semibold">Whitelist selector</h3>
          <p className="text-sm text-[#777]">
            Apply filters, choose a selection mode, and preview before confirming.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {MODES.map(({ id, label, description, Icon }) => {
          const selected = mode === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setMode(id)}
              className={`rounded-xl border p-4 text-left transition-colors ${
                selected
                  ? 'border-[#FF5C00] bg-[#1a0e07]'
                  : 'border-[#2A2A2A] bg-[#0e0e0e] hover:border-[#444]'
              }`}
            >
              <Icon className={`mb-2 h-5 w-5 ${selected ? 'text-[#FF5C00]' : 'text-[#888]'}`} />
              <div className="font-semibold">{label}</div>
              <div className="mt-1 text-xs text-[#888]">{description}</div>
            </button>
          );
        })}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1 text-sm text-[#bbb]">
          Slots
          <input
            type="number"
            min={1}
            value={count}
            onChange={(e) => setCount(Math.max(1, Number(e.target.value) || 1))}
            className="rounded-lg border border-[#2A2A2A] bg-[#0a0a0a] px-3 py-2 text-white focus:border-[#FF5C00] focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-[#bbb]">
          Min points
          <input
            type="number"
            min={0}
            value={minPoints}
            placeholder="None"
            onChange={(e) =>
              setMinPoints(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))
            }
            className="rounded-lg border border-[#2A2A2A] bg-[#0a0a0a] px-3 py-2 text-white focus:border-[#FF5C00] focus:outline-none"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-[#bbb]">
          <input
            type="checkbox"
            checked={hasWallet}
            onChange={(e) => setHasWallet(e.target.checked)}
            className="h-4 w-4 accent-[#FF5C00]"
          />
          Has submitted wallet
        </label>
        <label className="flex items-center gap-2 text-sm text-[#bbb]">
          <input
            type="checkbox"
            checked={completedRequired}
            onChange={(e) => setCompletedRequired(e.target.checked)}
            className="h-4 w-4 accent-[#FF5C00]"
          />
          Completed all required tasks
        </label>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setShowPreview(true)}
          className="rounded-xl border border-[#2A2A2A] px-4 py-2 text-sm font-semibold text-white hover:border-[#444]"
        >
          Preview selection
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={select.isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-[#FF5C00] px-4 py-2 text-sm font-bold text-white hover:bg-[#e05200] disabled:opacity-50"
        >
          {select.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Confirm whitelist ({Math.min(count, previewList.length)})
        </button>
        {select.isSuccess && (
          <span className="self-center text-sm text-green-400">
            Granted {select.data.granted} slot(s).
          </span>
        )}
        {select.isError && (
          <span className="self-center text-sm text-red-400">
            Could not apply selection.
          </span>
        )}
      </div>

      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-[#2A2A2A] bg-[#0e0e0e] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="font-space-grotesk text-lg font-semibold">Preview ({previewList.length})</h4>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="text-sm text-[#888] hover:text-white"
              >
                Close
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {previewList.length === 0 ? (
                <p className="text-sm text-[#777]">
                  No participants match the filters. Loosen filters or lower min points.
                </p>
              ) : (
                <ul className="divide-y divide-[#1f1f1f]">
                  {previewList.map((p) => (
                    <li
                      key={p.userId}
                      className="flex items-center justify-between gap-3 py-2 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-white">{p.username}</span>
                        {p.walletSubmitted && (
                          <span className="rounded-md bg-[#1c2a1c] px-1.5 py-0.5 text-[10px] text-green-300">
                            Wallet
                          </span>
                        )}
                      </div>
                      <div className="text-[#888]">
                        {p.points} pts · {p.tasksCompleted}/{p.totalTasks} tasks
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="rounded-xl border border-[#2A2A2A] px-4 py-2 text-sm font-semibold text-white hover:border-[#444]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={select.isPending || previewList.length === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-[#FF5C00] px-4 py-2 text-sm font-bold text-white hover:bg-[#e05200] disabled:opacity-50"
              >
                {select.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
