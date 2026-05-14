'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Plus, Trash2, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/common/Navbar';
import { useCurrentUser } from '@/hooks/useAuth';
import { createCampaign } from '@/lib/api';
import type { Chain, RewardType, TaskType } from '@/types';

const CHAINS: { value: Chain; label: string; color: string }[] = [
  { value: 'ETH', label: 'Ethereum', color: '#627EEA' },
  { value: 'BASE', label: 'Base', color: '#0052FF' },
  { value: 'ARB', label: 'Arbitrum', color: '#28A0F0' },
  { value: 'MATIC', label: 'Polygon', color: '#8247E5' },
  { value: 'BNB', label: 'BNB Chain', color: '#F3BA2F' },
  { value: 'SOL', label: 'Solana', color: '#9945FF' },
  { value: 'AVAX', label: 'Avalanche', color: '#E84142' },
];

const REWARD_TYPES: { value: RewardType; label: string; desc: string }[] = [
  { value: 'airdrop', label: 'Airdrop', desc: 'Token distribution to eligible wallets' },
  { value: 'whitelist', label: 'Whitelist', desc: 'Reserved mint or allowlist spots' },
  { value: 'both', label: 'Airdrop + WL', desc: 'Both rewards combined' },
];

const TASK_TYPES: { value: TaskType; label: string }[] = [
  { value: 'twitter_follow', label: 'Follow on X / Twitter' },
  { value: 'twitter_retweet', label: 'Retweet / Repost' },
  { value: 'discord_join', label: 'Join Discord server' },
  { value: 'hold_token', label: 'Hold a token / NFT' },
  { value: 'submit_screenshot', label: 'Submit screenshot' },
  { value: 'custom', label: 'Custom task' },
];

interface TaskDraft {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  points: number;
  proofType: 'auto' | 'manual';
}

function newTask(): TaskDraft {
  return {
    id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: '',
    description: '',
    type: 'twitter_follow',
    points: 100,
    proofType: 'auto',
  };
}

function todayPlus(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function CreateCampaignPage() {
  const router = useRouter();
  const { user, isWalletConnected, isLoading: authLoading } = useCurrentUser();
  const isAuthed = !!user || isWalletConnected;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [projectName, setProjectName] = useState('');
  const [chain, setChain] = useState<Chain>('BASE');
  const [rewardType, setRewardType] = useState<RewardType>('airdrop');
  const [startDate, setStartDate] = useState(todayPlus(0));
  const [endDate, setEndDate] = useState(todayPlus(14));
  const [maxParticipants, setMaxParticipants] = useState<string>('');
  const [tasks, setTasks] = useState<TaskDraft[]>([newTask()]);
  const [submitted, setSubmitted] = useState(false);

  const totalPoints = tasks.reduce((s, t) => s + (Number(t.points) || 0), 0);

  const mutation = useMutation({
    mutationFn: () =>
      createCampaign({
        name,
        description,
        projectName: projectName || name,
        chain,
        rewardType,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        maxParticipants: maxParticipants ? Number(maxParticipants) : undefined,
        pointsAvailable: totalPoints,
        taskCount: tasks.length,
      }),
    onSuccess: (campaign) => {
      setSubmitted(true);
      setTimeout(() => router.push(`/campaigns/${campaign.id}`), 1200);
    },
  });

  const updateTask = (id: string, patch: Partial<TaskDraft>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const canSubmit =
    name.trim().length >= 3 &&
    description.trim().length >= 10 &&
    tasks.length > 0 &&
    tasks.every((t) => t.title.trim().length >= 2);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || mutation.isPending) return;
    mutation.mutate();
  };

  if (!authLoading && !isAuthed) {
    return (
      <main className="min-h-screen bg-[#0A0A0A] text-white">
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-24 text-center">
          <p className="text-[#FF5C00] text-xs font-mono uppercase tracking-widest mb-3">
            Sign in required
          </p>
          <h1
            className="text-3xl font-bold mb-3"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            Connect to launch a campaign
          </h1>
          <p className="text-[#888] text-sm mb-6">
            Sign in with X, Discord, or your wallet to create and manage campaigns.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#FF5C00] hover:bg-[#E54E00] text-white text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Back home
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <a
            href="/campaigns"
            className="inline-flex items-center gap-1.5 text-xs text-[#888] hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to campaigns
          </a>
          <p className="text-[#FF5C00] text-xs font-mono uppercase tracking-widest mb-2">
            New campaign
          </p>
          <h1
            className="text-3xl sm:text-4xl font-black tracking-tight"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            Launch a quest
          </h1>
          <p className="text-[#888] text-sm mt-2 max-w-xl">
            Define your campaign, add tasks, and start distributing airdrops or whitelist spots.
          </p>
        </div>

        {submitted ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-10 text-center">
            <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto mb-4" />
            <h2
              className="text-2xl font-bold mb-2"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              Campaign created
            </h2>
            <p className="text-[#888] text-sm">Redirecting you to the campaign page…</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-8">
            <Section title="Basics" subtitle="What is this campaign about?">
              <Field label="Campaign name" required>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Genesis Airdrop Wave 1"
                  className="input"
                  required
                  minLength={3}
                />
              </Field>

              <Field label="Project name" hint="Shown on the campaign card">
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Your project / DAO name"
                  className="input"
                />
              </Field>

              <Field label="Description" required hint="Markdown supported soon">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell participants what they're earning and why it matters."
                  rows={4}
                  className="input resize-none"
                  required
                  minLength={10}
                />
              </Field>
            </Section>

            <Section title="Network & rewards" subtitle="Where will the rewards be distributed?">
              <Field label="Chain" required>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CHAINS.map((c) => {
                    const active = chain === c.value;
                    return (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setChain(c.value)}
                        className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                          active
                            ? 'border-[#FF5C00] bg-[#FF5C00]/10 text-white'
                            : 'border-[#222] bg-[#141414] text-[#AAA] hover:border-[#FF5C00]/40'
                        }`}
                        style={active ? { boxShadow: `0 0 0 1px ${c.color}33` } : undefined}
                      >
                        <span
                          className="inline-block w-2 h-2 rounded-full mr-2"
                          style={{ backgroundColor: c.color }}
                        />
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </Field>

              <Field label="Reward type" required>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {REWARD_TYPES.map((r) => {
                    const active = rewardType === r.value;
                    return (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setRewardType(r.value)}
                        className={`text-left p-3 rounded-lg border transition-colors ${
                          active
                            ? 'border-[#FF5C00] bg-[#FF5C00]/10'
                            : 'border-[#222] bg-[#141414] hover:border-[#FF5C00]/40'
                        }`}
                      >
                        <p className="text-sm font-semibold text-white">{r.label}</p>
                        <p className="text-xs text-[#666] mt-0.5">{r.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </Field>
            </Section>

            <Section title="Schedule" subtitle="When does the campaign run?">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Start date" required>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="input"
                    required
                  />
                </Field>
                <Field label="End date" required>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="input"
                    required
                    min={startDate}
                  />
                </Field>
                <Field label="Max participants" hint="Optional cap">
                  <input
                    type="number"
                    min={0}
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(e.target.value)}
                    placeholder="Unlimited"
                    className="input"
                  />
                </Field>
              </div>
            </Section>

            <Section
              title="Tasks"
              subtitle="What do participants need to do?"
              right={
                <span className="text-xs font-mono text-[#666]">
                  {tasks.length} task{tasks.length === 1 ? '' : 's'} · {totalPoints} pts total
                </span>
              }
            >
              <div className="space-y-3">
                {tasks.map((task, idx) => (
                  <div
                    key={task.id}
                    className="rounded-xl border border-[#222] bg-[#141414] p-4"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-[#FF5C00]/15 border border-[#FF5C00]/20 text-[#FF5C00] text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span
                          className="text-sm font-semibold text-white"
                          style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                        >
                          Task {idx + 1}
                        </span>
                      </div>
                      {tasks.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setTasks((prev) => prev.filter((t) => t.id !== task.id))
                          }
                          className="text-[#666] hover:text-red-400 transition-colors"
                          aria-label="Remove task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          value={task.title}
                          onChange={(e) => updateTask(task.id, { title: e.target.value })}
                          placeholder="Task title (e.g. Follow @project on X)"
                          className="input"
                          required
                          minLength={2}
                        />
                      </div>
                      <div>
                        <select
                          value={task.type}
                          onChange={(e) =>
                            updateTask(task.id, { type: e.target.value as TaskType })
                          }
                          className="input"
                        >
                          {TASK_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <input
                      type="text"
                      value={task.description}
                      onChange={(e) => updateTask(task.id, { description: e.target.value })}
                      placeholder="Optional instructions for participants"
                      className="input mb-3"
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-[#666] uppercase tracking-wider mb-1">
                          Points
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={task.points}
                          onChange={(e) =>
                            updateTask(task.id, { points: Number(e.target.value) })
                          }
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#666] uppercase tracking-wider mb-1">
                          Verification
                        </label>
                        <select
                          value={task.proofType}
                          onChange={(e) =>
                            updateTask(task.id, {
                              proofType: e.target.value as 'auto' | 'manual',
                            })
                          }
                          className="input"
                        >
                          <option value="auto">Automatic</option>
                          <option value="manual">Manual review</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setTasks((prev) => [...prev, newTask()])}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-[#2A2A2A] text-sm text-[#888] hover:border-[#FF5C00]/40 hover:text-[#FF5C00] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add another task
                </button>
              </div>
            </Section>

            {mutation.isError && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {(mutation.error as Error).message || 'Failed to create campaign'}
              </div>
            )}

            <div className="flex items-center justify-between gap-4 pt-2">
              <p className="text-xs text-[#555]">
                Drafts are saved as you go. You can edit details after creation.
              </p>
              <button
                type="submit"
                disabled={!canSubmit || mutation.isPending}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#FF5C00] hover:bg-[#E54E00] text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-[#FF5C00]/30"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>
                    Launch campaign
                    <span className="text-white/80">→</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          padding: 0.625rem 0.875rem;
          border-radius: 0.5rem;
          background-color: #0f0f0f;
          border: 1px solid #222;
          color: #fff;
          font-size: 0.875rem;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .input::placeholder {
          color: #555;
        }
        .input:focus {
          outline: none;
          border-color: rgba(255, 92, 0, 0.6);
          box-shadow: 0 0 0 3px rgba(255, 92, 0, 0.15);
        }
      `}</style>
    </main>
  );
}

function Section({
  title,
  subtitle,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#1E1E1E] bg-[#0F0F0F] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h2
            className="text-lg font-bold text-white"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            {title}
          </h2>
          {subtitle && <p className="text-xs text-[#666] mt-0.5">{subtitle}</p>}
        </div>
        {right}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  children,
  required,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#AAA] mb-1.5">
        {label}
        {required && <span className="text-[#FF5C00] ml-0.5">*</span>}
        {hint && <span className="text-[#555] font-normal ml-2">— {hint}</span>}
      </label>
      {children}
    </div>
  );
}
