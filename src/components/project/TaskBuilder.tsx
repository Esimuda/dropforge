'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import type { TaskType } from '@/types';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TaskInput {
  id: string;
  type: TaskType;
  title: string;
  description: string;
  points: number;
  proofType: 'auto' | 'manual';
  targetUrl?: string;
}

export interface TaskBuilderProps {
  tasks: TaskInput[];
  onChange: (tasks: TaskInput[]) => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TASK_TYPE_OPTIONS: { value: TaskType; label: string; icon: string; color: string }[] = [
  { value: 'twitter_follow', label: 'Follow on Twitter / X', icon: '𝕏', color: '#1DA1F2' },
  { value: 'twitter_retweet', label: 'Retweet / Repost', icon: '🔁', color: '#1DA1F2' },
  { value: 'discord_join', label: 'Join Discord', icon: '💬', color: '#5865F2' },
  { value: 'hold_token', label: 'Hold Token (onchain)', icon: '🪙', color: '#F59E0B' },
  { value: 'hold_nft', label: 'Hold NFT (onchain)', icon: '🖼️', color: '#FF5C00' },
  { value: 'submit_screenshot', label: 'Submit Screenshot', icon: '📸', color: '#8B5CF6' },
  { value: 'custom', label: 'Custom Task', icon: '✦', color: '#FF5C00' },
];

const DEFAULT_TITLES: Record<TaskType, string> = {
  twitter_follow: 'Follow us on X',
  twitter_retweet: 'Retweet our announcement',
  discord_join: 'Join our Discord server',
  hold_token: 'Hold [token] in your wallet',
  hold_nft: 'Hold [collection] NFT in your wallet',
  submit_screenshot: 'Submit proof screenshot',
  custom: 'Custom task',
};

const DEFAULT_PROOF: Record<TaskType, 'auto' | 'manual'> = {
  twitter_follow: 'auto',
  twitter_retweet: 'auto',
  discord_join: 'auto',
  hold_token: 'auto',
  hold_nft: 'auto',
  submit_screenshot: 'manual',
  custom: 'manual',
};

function createEmptyTask(): TaskInput {
  return {
    id: crypto.randomUUID(),
    type: 'twitter_follow',
    title: DEFAULT_TITLES['twitter_follow'],
    description: '',
    points: 100,
    proofType: 'auto',
    targetUrl: '',
  };
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function TaskTypeIcon({ type, size = 20 }: { type: TaskType; size?: number }) {
  const opt = TASK_TYPE_OPTIONS.find((o) => o.value === type);
  return (
    <span
      className="inline-flex items-center justify-center rounded-md font-bold text-xs shrink-0"
      style={{
        width: size,
        height: size,
        background: opt?.color + '22',
        color: opt?.color,
        fontSize: size * 0.55,
      }}
    >
      {opt?.icon}
    </span>
  );
}

interface TaskEditorProps {
  task: TaskInput;
  onSave: (updated: TaskInput) => void;
  onCancel: () => void;
}

function TaskEditor({ task, onSave, onCancel }: TaskEditorProps) {
  const [draft, setDraft] = useState<TaskInput>({ ...task });

  function handleTypeChange(type: TaskType) {
    setDraft((prev) => ({
      ...prev,
      type,
      title: DEFAULT_TITLES[type],
      proofType: DEFAULT_PROOF[type],
    }));
  }

  function handleSave() {
    if (!draft.title.trim()) return;
    if (draft.points < 50 || draft.points > 1000) return;
    onSave(draft);
  }

  return (
    <div className="rounded-xl border border-[#FF5C00]/40 bg-[#1A1A1A] p-5 space-y-4">
      {/* Task Type */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-widest text-[#666] mb-2">
          Task Type
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {TASK_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleTypeChange(opt.value)}
              className={cn(
                'flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm font-medium transition-all duration-150',
                draft.type === opt.value
                  ? 'border-[#FF5C00] bg-[#FF5C00]/10 text-white'
                  : 'border-[#333] bg-[#111] text-[#999] hover:border-[#555] hover:text-white',
              )}
            >
              <span style={{ color: opt.color, fontSize: 14 }}>{opt.icon}</span>
              <span className="truncate text-xs">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-widest text-[#666] mb-2">
          Task Title <span className="text-[#FF5C00]">*</span>
        </label>
        <input
          type="text"
          value={draft.title}
          onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
          className="w-full rounded-lg border border-[#333] bg-[#111] px-3 py-2.5 text-sm text-white placeholder-[#555] focus:border-[#FF5C00] focus:outline-none transition-colors"
          placeholder="Enter task title"
          maxLength={120}
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-widest text-[#666] mb-2">
          Description
        </label>
        <textarea
          value={draft.description}
          onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
          rows={2}
          className="w-full rounded-lg border border-[#333] bg-[#111] px-3 py-2.5 text-sm text-white placeholder-[#555] focus:border-[#FF5C00] focus:outline-none transition-colors resize-none"
          placeholder="Optional task description..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Points */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-[#666] mb-2">
            Points <span className="text-[#FF5C00]">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#FF5C00] text-sm font-bold">
              ✦
            </span>
            <input
              type="number"
              min={50}
              max={1000}
              step={50}
              value={draft.points}
              onChange={(e) => setDraft((p) => ({ ...p, points: Number(e.target.value) }))}
              className="w-full rounded-lg border border-[#333] bg-[#111] py-2.5 pl-8 pr-3 text-sm text-white focus:border-[#FF5C00] focus:outline-none transition-colors"
            />
          </div>
          {(draft.points < 50 || draft.points > 1000) && (
            <p className="mt-1 text-xs text-red-400">Must be 50–1000</p>
          )}
        </div>

        {/* Proof Type */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-[#666] mb-2">
            Verification
          </label>
          <div className="flex rounded-lg border border-[#333] overflow-hidden">
            <button
              type="button"
              onClick={() => setDraft((p) => ({ ...p, proofType: 'auto' }))}
              className={cn(
                'flex-1 py-2.5 text-xs font-semibold transition-all',
                draft.proofType === 'auto'
                  ? 'bg-[#FF5C00] text-white'
                  : 'bg-[#111] text-[#777] hover:text-white',
              )}
            >
              Auto
            </button>
            <button
              type="button"
              onClick={() => setDraft((p) => ({ ...p, proofType: 'manual' }))}
              className={cn(
                'flex-1 py-2.5 text-xs font-semibold transition-all',
                draft.proofType === 'manual'
                  ? 'bg-[#FF5C00] text-white'
                  : 'bg-[#111] text-[#777] hover:text-white',
              )}
            >
              Manual
            </button>
          </div>
        </div>
      </div>

      {/* Target URL */}
      {(draft.type === 'twitter_follow' ||
        draft.type === 'twitter_retweet' ||
        draft.type === 'discord_join') && (
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-[#666] mb-2">
            Target URL
          </label>
          <input
            type="url"
            value={draft.targetUrl ?? ''}
            onChange={(e) => setDraft((p) => ({ ...p, targetUrl: e.target.value }))}
            className="w-full rounded-lg border border-[#333] bg-[#111] px-3 py-2.5 text-sm text-white placeholder-[#555] focus:border-[#FF5C00] focus:outline-none transition-colors"
            placeholder="https://twitter.com/yourhandle"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={handleSave}
          className="flex-1 rounded-lg bg-[#FF5C00] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#e05200] transition-colors"
        >
          Save Task
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-[#333] bg-transparent px-4 py-2.5 text-sm font-semibold text-[#999] hover:text-white hover:border-[#555] transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TaskBuilder({ tasks, onChange }: TaskBuilderProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newTask, setNewTask] = useState<TaskInput>(createEmptyTask());

  function handleAdd() {
    setNewTask(createEmptyTask());
    setIsAddingNew(true);
    setEditingId(null);
  }

  function handleSaveNew(task: TaskInput) {
    onChange([...tasks, task]);
    setIsAddingNew(false);
    setNewTask(createEmptyTask());
  }

  function handleSaveEdit(updated: TaskInput) {
    onChange(tasks.map((t) => (t.id === updated.id ? updated : t)));
    setEditingId(null);
  }

  function handleDelete(id: string) {
    onChange(tasks.filter((t) => t.id !== id));
    if (editingId === id) setEditingId(null);
  }

  function moveUp(index: number) {
    if (index === 0) return;
    const next = [...tasks];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onChange(next);
  }

  function moveDown(index: number) {
    if (index === tasks.length - 1) return;
    const next = [...tasks];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    onChange(next);
  }

  const totalPoints = tasks.reduce((s, t) => s + t.points, 0);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-white text-sm uppercase tracking-widest">
            Tasks
          </h3>
          {tasks.length > 0 && (
            <span className="rounded-full bg-[#FF5C00]/20 px-2.5 py-0.5 text-xs font-bold text-[#FF5C00]">
              {tasks.length}
            </span>
          )}
        </div>
        {tasks.length > 0 && (
          <span className="text-xs text-[#666]">
            Total:{' '}
            <span className="font-bold text-[#FF5C00]">{totalPoints.toLocaleString()} pts</span>
          </span>
        )}
      </div>

      {/* Empty state */}
      {tasks.length === 0 && !isAddingNew && (
        <div className="rounded-xl border-2 border-dashed border-[#2A2A2A] bg-[#111] py-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#1A1A1A] text-2xl">
            ✦
          </div>
          <p className="text-sm font-semibold text-[#777] mb-1">No tasks added yet</p>
          <p className="text-xs text-[#555] mb-4">Add at least one task for participants to complete</p>
          <button
            type="button"
            onClick={handleAdd}
            className="inline-flex items-center gap-2 rounded-lg bg-[#FF5C00] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#e05200] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Add First Task
          </button>
        </div>
      )}

      {/* Task list */}
      {tasks.length > 0 && (
        <div className="space-y-2">
          {tasks.map((task, index) =>
            editingId === task.id ? (
              <TaskEditor
                key={task.id}
                task={task}
                onSave={handleSaveEdit}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div
                key={task.id}
                className="group flex items-center gap-3 rounded-xl border border-[#242424] bg-[#1A1A1A] px-4 py-3 hover:border-[#333] transition-colors"
              >
                {/* Reorder */}
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    className="p-0.5 text-[#444] hover:text-[#FF5C00] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                    aria-label="Move up"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M6 9V3M3 6l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDown(index)}
                    disabled={index === tasks.length - 1}
                    className="p-0.5 text-[#444] hover:text-[#FF5C00] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                    aria-label="Move down"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M6 3v6M9 6l-3 3-3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>

                <span className="text-xs font-bold text-[#444] w-5 text-center shrink-0">
                  {index + 1}
                </span>

                <TaskTypeIcon type={task.type} size={28} />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{task.title}</p>
                  {task.description && (
                    <p className="text-xs text-[#666] truncate">{task.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="rounded-md bg-[#FF5C00]/15 px-2 py-0.5 text-xs font-bold text-[#FF5C00]">
                    {task.points}pts
                  </span>
                  <span
                    className={cn(
                      'rounded-md px-2 py-0.5 text-xs font-semibold',
                      task.proofType === 'auto'
                        ? 'bg-[#22c55e]/10 text-[#22c55e]'
                        : 'bg-[#a855f7]/10 text-[#a855f7]',
                    )}
                  >
                    {task.proofType === 'auto' ? 'Auto' : 'Manual'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(task.id);
                      setIsAddingNew(false);
                    }}
                    className="rounded-md p-1.5 text-[#666] hover:bg-[#242424] hover:text-white transition-colors"
                    aria-label="Edit task"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M9.5 1.5l3 3L4 13H1v-3L9.5 1.5z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(task.id)}
                    className="rounded-md p-1.5 text-[#666] hover:bg-red-500/10 hover:text-red-400 transition-colors"
                    aria-label="Delete task"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 3.5h10M5.5 3.5V2h3v1.5M5.5 6v4.5M8.5 6v4.5M3 3.5l.8 8h6.4l.8-8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            ),
          )}
        </div>
      )}

      {/* Add new task inline */}
      {isAddingNew && (
        <TaskEditor
          task={newTask}
          onSave={handleSaveNew}
          onCancel={() => setIsAddingNew(false)}
        />
      )}

      {/* Add Task button */}
      {tasks.length > 0 && !isAddingNew && editingId === null && (
        <button
          type="button"
          onClick={handleAdd}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#2A2A2A] bg-transparent py-3 text-sm font-semibold text-[#555] hover:border-[#FF5C00]/40 hover:text-[#FF5C00] transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Add Task
        </button>
      )}
    </div>
  );
}
