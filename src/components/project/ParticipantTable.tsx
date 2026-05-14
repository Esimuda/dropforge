'use client';

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { Participant } from '@/types';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ParticipantTableProps {
  participants: Participant[];
  onStatusUpdate: (
    userId: string,
    status: 'eligible' | 'ineligible',
    note?: string,
  ) => void;
  isLoading: boolean;
}

type SortKey = 'username' | 'points' | 'tasksCompleted' | 'joinedAt';
type SortDir = 'asc' | 'desc';

type WalletFilter = 'all' | 'submitted' | 'not_submitted';
type TaskFilter = 'all' | 'completed' | 'incomplete';
type StatusFilter = 'all' | 'eligible' | 'ineligible';

const PAGE_SIZE = 20;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function truncateAddress(addr: string) {
  return addr.slice(0, 6) + '…' + addr.slice(-4);
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// ─── Proof Modal ─────────────────────────────────────────────────────────────

interface ProofModalProps {
  participant: Participant;
  onClose: () => void;
  onStatusUpdate: (userId: string, status: 'eligible' | 'ineligible', note?: string) => void;
}

function ProofModal({ participant, onClose, onStatusUpdate }: ProofModalProps) {
  const [note, setNote] = useState('');
  const [showNote, setShowNote] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-2xl border border-[#2A2A2A] bg-[#141414] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-white text-lg">Verify Participant</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#666] hover:bg-[#242424] hover:text-white transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4.5 4.5l9 9M13.5 4.5l-9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Participant info */}
        <div className="flex items-center gap-3 mb-5 p-3 rounded-xl bg-[#1A1A1A] border border-[#242424]">
          <img
            src={participant.avatar}
            alt={participant.username}
            className="h-10 w-10 rounded-full bg-[#2A2A2A]"
          />
          <div>
            <p className="font-semibold text-white text-sm">{participant.username}</p>
            <p className="text-xs text-[#666]">
              {participant.tasksCompleted}/{participant.totalTasks} tasks · {participant.points} pts
            </p>
          </div>
        </div>

        {/* Task completions */}
        <div className="mb-5 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#555]">
            Task Completion
          </p>
          <div className="rounded-xl border border-[#242424] bg-[#111] p-3">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-[#999]">Progress</span>
              <span className="font-bold text-white">
                {participant.tasksCompleted}/{participant.totalTasks}
              </span>
            </div>
            <div className="h-2 rounded-full bg-[#222] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#FF5C00]"
                style={{
                  width: `${(participant.tasksCompleted / participant.totalTasks) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Wallet */}
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#555] mb-2">
            Wallet
          </p>
          {participant.walletSubmitted && participant.walletAddress ? (
            <div className="flex items-center gap-2 rounded-xl border border-[#242424] bg-[#111] px-3 py-2.5">
              <span className="rounded-md bg-[#FF5C00]/15 px-1.5 py-0.5 text-xs font-bold text-[#FF5C00]">
                {participant.walletChain}
              </span>
              <span className="font-mono text-sm text-[#ccc]">{participant.walletAddress}</span>
            </div>
          ) : (
            <div className="rounded-xl border border-[#242424] bg-[#111] px-3 py-2.5 text-sm text-[#555]">
              No wallet submitted
            </div>
          )}
        </div>

        {/* Note field */}
        {showNote && (
          <div className="mb-4">
            <label className="block text-xs font-semibold uppercase tracking-widest text-[#555] mb-2">
              Rejection Note
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Reason for rejection..."
              className="w-full rounded-lg border border-[#333] bg-[#111] px-3 py-2.5 text-sm text-white placeholder-[#444] focus:border-red-500 focus:outline-none resize-none"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => {
              onStatusUpdate(participant.userId, 'eligible');
              onClose();
            }}
            className="flex-1 rounded-lg bg-[#22c55e] py-2.5 text-sm font-bold text-white hover:bg-[#16a34a] transition-colors"
          >
            ✓ Approve
          </button>
          <button
            onClick={() => {
              if (!showNote) {
                setShowNote(true);
              } else {
                onStatusUpdate(participant.userId, 'ineligible', note);
                onClose();
              }
            }}
            className="flex-1 rounded-lg bg-red-500/10 border border-red-500/30 py-2.5 text-sm font-bold text-red-400 hover:bg-red-500/20 transition-colors"
          >
            {showNote ? '✕ Confirm Reject' : '✕ Reject'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ParticipantTable({
  participants,
  onStatusUpdate,
  isLoading,
}: ParticipantTableProps) {
  const [search, setSearch] = useState('');
  const [walletFilter, setWalletFilter] = useState<WalletFilter>('all');
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('joinedAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [proofParticipant, setProofParticipant] = useState<Participant | null>(null);

  // Filter + sort
  const filtered = useMemo(() => {
    let result = [...participants];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.username.toLowerCase().includes(q) ||
          (p.walletAddress ?? '').toLowerCase().includes(q),
      );
    }

    if (walletFilter === 'submitted') result = result.filter((p) => p.walletSubmitted);
    if (walletFilter === 'not_submitted') result = result.filter((p) => !p.walletSubmitted);

    if (taskFilter === 'completed')
      result = result.filter((p) => p.tasksCompleted === p.totalTasks);
    if (taskFilter === 'incomplete')
      result = result.filter((p) => p.tasksCompleted < p.totalTasks);

    if (statusFilter === 'eligible') result = result.filter((p) => p.status === 'eligible');
    if (statusFilter === 'ineligible') result = result.filter((p) => p.status === 'ineligible');

    result.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'username') cmp = a.username.localeCompare(b.username);
      else if (sortKey === 'points') cmp = a.points - b.points;
      else if (sortKey === 'tasksCompleted') cmp = a.tasksCompleted - b.tasksCompleted;
      else if (sortKey === 'joinedAt')
        cmp = new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [participants, search, walletFilter, taskFilter, statusFilter, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('desc');
    }
    setPage(1);
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === paginated.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paginated.map((p) => p.userId)));
    }
  }

  function bulkUpdate(status: 'eligible' | 'ineligible') {
    selected.forEach((id) => onStatusUpdate(id, status));
    setSelected(new Set());
  }

  function SortIcon({ col }: { col: SortKey }) {
    const active = sortKey === col;
    return (
      <svg
        width="10"
        height="14"
        viewBox="0 0 10 14"
        fill="none"
        className={cn('ml-1 inline-block', active ? 'text-[#FF5C00]' : 'text-[#444]')}
      >
        <path
          d="M5 1v12M1 5l4-4 4 4"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={active && sortDir === 'asc' ? 1 : 0.4}
        />
        <path
          d="M1 9l4 4 4-4"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={active && sortDir === 'desc' ? 1 : 0.4}
        />
      </svg>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters row */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]"
            width="15"
            height="15"
            viewBox="0 0 15 15"
            fill="none"
          >
            <path
              d="M6.5 11a4.5 4.5 0 100-9 4.5 4.5 0 000 9zM13 13l-2.5-2.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <input
            type="text"
            placeholder="Search username or wallet..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-[#2A2A2A] bg-[#111] py-2 pl-9 pr-3 text-sm text-white placeholder-[#444] focus:border-[#FF5C00]/40 focus:outline-none transition-colors"
          />
        </div>

        {/* Wallet filter */}
        <select
          value={walletFilter}
          onChange={(e) => { setWalletFilter(e.target.value as WalletFilter); setPage(1); }}
          className="rounded-lg border border-[#2A2A2A] bg-[#111] px-3 py-2 text-sm text-[#ccc] focus:border-[#FF5C00]/40 focus:outline-none"
        >
          <option value="all">All Wallets</option>
          <option value="submitted">Submitted</option>
          <option value="not_submitted">Not Submitted</option>
        </select>

        {/* Task filter */}
        <select
          value={taskFilter}
          onChange={(e) => { setTaskFilter(e.target.value as TaskFilter); setPage(1); }}
          className="rounded-lg border border-[#2A2A2A] bg-[#111] px-3 py-2 text-sm text-[#ccc] focus:border-[#FF5C00]/40 focus:outline-none"
        >
          <option value="all">All Tasks</option>
          <option value="completed">Completed All</option>
          <option value="incomplete">Incomplete</option>
        </select>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as StatusFilter); setPage(1); }}
          className="rounded-lg border border-[#2A2A2A] bg-[#111] px-3 py-2 text-sm text-[#ccc] focus:border-[#FF5C00]/40 focus:outline-none"
        >
          <option value="all">All Status</option>
          <option value="eligible">Eligible</option>
          <option value="ineligible">Ineligible</option>
        </select>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-[#FF5C00]/30 bg-[#FF5C00]/5 px-4 py-3">
          <span className="text-sm font-semibold text-[#FF5C00]">
            {selected.size} selected
          </span>
          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => bulkUpdate('eligible')}
              className="rounded-lg bg-[#22c55e]/10 border border-[#22c55e]/30 px-3 py-1.5 text-xs font-bold text-[#22c55e] hover:bg-[#22c55e]/20 transition-colors"
            >
              Mark Eligible
            </button>
            <button
              onClick={() => bulkUpdate('ineligible')}
              className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/20 transition-colors"
            >
              Mark Ineligible
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="rounded-lg border border-[#333] px-3 py-1.5 text-xs font-semibold text-[#777] hover:text-white transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-[#1E1E1E] bg-[#0E0E0E] overflow-x-auto">
        {isLoading ? (
          <div className="py-20 text-center text-[#555] text-sm">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[#333] border-t-[#FF5C00]" />
            Loading participants...
          </div>
        ) : (
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-[#1E1E1E]">
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selected.size === paginated.length && paginated.length > 0}
                    onChange={toggleAll}
                    className="rounded border-[#333] bg-[#111] accent-[#FF5C00]"
                  />
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('username')}
                    className="font-semibold uppercase tracking-widest text-xs text-[#555] hover:text-[#FF5C00] transition-colors"
                  >
                    User <SortIcon col="username" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-[#555]">
                  Wallet
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('tasksCompleted')}
                    className="font-semibold uppercase tracking-widest text-xs text-[#555] hover:text-[#FF5C00] transition-colors"
                  >
                    Tasks <SortIcon col="tasksCompleted" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('points')}
                    className="font-semibold uppercase tracking-widest text-xs text-[#555] hover:text-[#FF5C00] transition-colors"
                  >
                    Points <SortIcon col="points" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-[#555]">
                  Status
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('joinedAt')}
                    className="font-semibold uppercase tracking-widest text-xs text-[#555] hover:text-[#FF5C00] transition-colors"
                  >
                    Joined <SortIcon col="joinedAt" />
                  </button>
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-[#555]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#141414]">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-sm text-[#555]">
                    No participants match current filters
                  </td>
                </tr>
              ) : (
                paginated.map((participant) => (
                  <tr
                    key={participant.id}
                    className={cn(
                      'hover:bg-[#111] transition-colors',
                      selected.has(participant.userId) && 'bg-[#FF5C00]/5',
                    )}
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(participant.userId)}
                        onChange={() => toggleSelect(participant.userId)}
                        className="rounded border-[#333] bg-[#111] accent-[#FF5C00]"
                      />
                    </td>

                    {/* User */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={participant.avatar}
                          alt={participant.username}
                          className="h-8 w-8 rounded-full bg-[#1A1A1A] shrink-0"
                        />
                        <span className="font-medium text-white">{participant.username}</span>
                      </div>
                    </td>

                    {/* Wallet */}
                    <td className="px-4 py-3">
                      {participant.walletSubmitted && participant.walletAddress ? (
                        <div className="flex items-center gap-1.5">
                          <span className="rounded bg-[#FF5C00]/15 px-1.5 py-0.5 text-xs font-bold text-[#FF5C00]">
                            {participant.walletChain}
                          </span>
                          <span className="font-mono text-xs text-[#999]">
                            {truncateAddress(participant.walletAddress)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-[#444]">Not submitted</span>
                      )}
                    </td>

                    {/* Tasks */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">
                          {participant.tasksCompleted}
                          <span className="text-[#444]">/{participant.totalTasks}</span>
                        </span>
                        <div className="w-16 h-1.5 rounded-full bg-[#1E1E1E] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#FF5C00]"
                            style={{
                              width: `${(participant.tasksCompleted / participant.totalTasks) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Points */}
                    <td className="px-4 py-3">
                      <span className="font-bold text-[#FF5C00]">
                        {participant.points.toLocaleString()}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'rounded-full px-2.5 py-1 text-xs font-bold',
                          participant.status === 'eligible'
                            ? 'bg-[#22c55e]/10 text-[#22c55e]'
                            : 'bg-red-500/10 text-red-400',
                        )}
                      >
                        {participant.status === 'eligible' ? '● Eligible' : '● Ineligible'}
                      </span>
                    </td>

                    {/* Joined */}
                    <td className="px-4 py-3 text-xs text-[#666]">
                      {relativeTime(participant.joinedAt)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <ActionDropdown
                        participant={participant}
                        onStatusUpdate={onStatusUpdate}
                        onViewProof={() => setProofParticipant(participant)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#555]">
            Showing {(page - 1) * PAGE_SIZE + 1}–
            {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-[#2A2A2A] px-3 py-1.5 text-sm text-[#999] hover:text-white hover:border-[#444] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ← Prev
            </button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p = i + 1;
                if (totalPages > 5) {
                  if (page <= 3) p = i + 1;
                  else if (page >= totalPages - 2) p = totalPages - 4 + i;
                  else p = page - 2 + i;
                }
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={cn(
                      'rounded-lg w-8 h-8 text-sm font-medium transition-colors',
                      p === page
                        ? 'bg-[#FF5C00] text-white'
                        : 'border border-[#2A2A2A] text-[#999] hover:text-white hover:border-[#444]',
                    )}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-lg border border-[#2A2A2A] px-3 py-1.5 text-sm text-[#999] hover:text-white hover:border-[#444] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Proof Modal */}
      {proofParticipant && (
        <ProofModal
          participant={proofParticipant}
          onClose={() => setProofParticipant(null)}
          onStatusUpdate={onStatusUpdate}
        />
      )}
    </div>
  );
}

// ─── Action Dropdown ──────────────────────────────────────────────────────────

function ActionDropdown({
  participant,
  onStatusUpdate,
  onViewProof,
}: {
  participant: Participant;
  onStatusUpdate: (userId: string, status: 'eligible' | 'ineligible') => void;
  onViewProof: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="rounded-lg border border-[#2A2A2A] px-2.5 py-1.5 text-xs font-semibold text-[#777] hover:border-[#444] hover:text-white transition-colors"
      >
        ···
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-36 rounded-xl border border-[#2A2A2A] bg-[#141414] p-1 shadow-2xl">
          <button
            onClick={() => { onStatusUpdate(participant.userId, 'eligible'); setOpen(false); }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-[#22c55e] hover:bg-[#22c55e]/10 transition-colors"
          >
            ✓ Approve
          </button>
          <button
            onClick={() => { onStatusUpdate(participant.userId, 'ineligible'); setOpen(false); }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
          >
            ✕ Reject
          </button>
          <div className="my-1 h-px bg-[#1E1E1E]" />
          <button
            onClick={() => { onViewProof(); setOpen(false); }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-[#999] hover:text-white hover:bg-[#1A1A1A] transition-colors"
          >
            👁 View Proof
          </button>
        </div>
      )}
    </div>
  );
}
