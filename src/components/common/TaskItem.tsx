'use client';

import React, { useState } from 'react';
import { Loader2, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { useAccount } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import type { Task, TaskStatus } from '@/types';
import { verifyOnchainTask, type OnchainVerifyResult } from '@/lib/onchainVerify';
import { useAppStore } from '@/store';

const typeIcons: Record<string, string> = {
  twitter_follow: '🐦',
  twitter_retweet: '🔁',
  discord_join: '💬',
  hold_token: '🪙',
  hold_nft: '🖼️',
  submit_screenshot: '📸',
  custom: '✨',
};

const EXPLORERS: Record<string, string> = {
  ETH: 'https://etherscan.io/address/',
  BASE: 'https://basescan.org/address/',
  ARB: 'https://arbiscan.io/address/',
  MATIC: 'https://polygonscan.com/address/',
  BNB: 'https://bscscan.com/address/',
  AVAX: 'https://snowtrace.io/address/',
};

export default function TaskItem({ task }: { task: Task }) {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const resolveTask = useAppStore((s) => s.resolveTask);

  const [verifyState, setVerifyState] = useState<
    | { kind: 'idle' }
    | { kind: 'verifying' }
    | { kind: 'success'; result: Extract<OnchainVerifyResult, { ok: true }> }
    | { kind: 'failed'; reason: string }
  >({ kind: 'idle' });

  const isOnchain = task.type === 'hold_token' || task.type === 'hold_nft';
  const effectiveStatus: TaskStatus =
    verifyState.kind === 'success' ? 'completed' : task.status;

  const onVerify = async () => {
    if (!isOnchain) return;
    if (!isConnected || !address) {
      openConnectModal?.();
      return;
    }
    setVerifyState({ kind: 'verifying' });
    const result = await verifyOnchainTask(task, address);
    if (result.ok) {
      setVerifyState({ kind: 'success', result });
      resolveTask?.(task.id, true);
    } else {
      setVerifyState({ kind: 'failed', reason: result.reason });
    }
  };

  const explorerHref =
    task.onchain && EXPLORERS[task.onchain.chain]
      ? `${EXPLORERS[task.onchain.chain]}${task.onchain.contractAddress}`
      : undefined;

  return (
    <div className="rounded-xl border border-[#222] bg-[#141414] hover:border-[#FF5C00]/30 transition-colors p-4">
      <div className="flex items-start gap-4">
        <div className="h-9 w-9 bg-[#1E1E1E] rounded-lg flex items-center justify-center text-lg flex-shrink-0">
          {typeIcons[task.type] || '📝'}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-1">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">{task.title}</p>
              <p className="text-xs text-[#666] mt-0.5">
                {task.type.replace(/_/g, ' ')} · {task.points} pts
              </p>
            </div>
            <StatusBadge status={effectiveStatus} verifyState={verifyState} />
          </div>

          {task.description && (
            <p className="text-xs text-[#888] mt-1.5 leading-relaxed">
              {task.description}
            </p>
          )}

          {isOnchain && task.onchain && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono border border-[#2A2A2A] bg-[#1A1A1A] text-[#AAA]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF5C00]" />
                {task.onchain.chain}
              </span>
              <span className="text-[10px] text-[#666] font-mono">
                Need {task.onchain.minBalance} {task.onchain.symbol ?? 'units'}
              </span>
              {explorerHref && (
                <a
                  href={explorerHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] text-[#FF5C00] hover:text-[#FF8040] font-mono"
                >
                  {task.onchain.contractAddress.slice(0, 6)}…
                  {task.onchain.contractAddress.slice(-4)}
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}

          {verifyState.kind === 'failed' && (
            <p className="mt-2 text-xs text-red-400">{verifyState.reason}</p>
          )}
          {verifyState.kind === 'success' && (
            <p className="mt-2 text-xs text-emerald-400">
              ✓ Holding {verifyState.result.held.toLocaleString()}{' '}
              {verifyState.result.symbol ?? ''} on {verifyState.result.chain}
            </p>
          )}

          {effectiveStatus !== 'completed' && effectiveStatus !== 'pending_verification' && (
            <div className="mt-3">
              {isOnchain ? (
                <button
                  onClick={onVerify}
                  disabled={verifyState.kind === 'verifying'}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[#FF5C00] hover:bg-[#E54E00] text-white text-xs font-semibold disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {verifyState.kind === 'verifying' ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Checking onchain…
                    </>
                  ) : !isConnected ? (
                    'Connect wallet to verify'
                  ) : (
                    'Verify onchain'
                  )}
                </button>
              ) : (
                <button className="px-4 py-1.5 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] text-[#888] text-xs font-semibold cursor-not-allowed">
                  Verification coming soon
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({
  status,
  verifyState,
}: {
  status: TaskStatus;
  verifyState: { kind: string };
}) {
  if (status === 'completed' || verifyState.kind === 'success') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex-shrink-0">
        <CheckCircle2 className="w-3 h-3" />
        Done
      </span>
    );
  }
  if (status === 'pending_verification') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex-shrink-0">
        <Loader2 className="w-3 h-3 animate-spin" />
        Pending
      </span>
    );
  }
  if (status === 'locked') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#1A1A1A] text-[#666] border border-[#2A2A2A] flex-shrink-0">
        Locked
      </span>
    );
  }
  if (verifyState.kind === 'failed') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20 flex-shrink-0">
        <XCircle className="w-3 h-3" />
        Failed
      </span>
    );
  }
  return null;
}
