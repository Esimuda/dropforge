'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getSession } from 'next-auth/react';
import Navbar from '../../../../../components/common/Navbar';
import LoadingSkeleton from '../../../../../components/common/LoadingSkeleton';
import { useExportData } from '@/hooks/useProject';
import { useCampaign } from '@/hooks/useCampaigns';
import { USE_MOCK } from '@/lib/api';
import { cn } from '@/lib/utils';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function downloadExport(campaignId: string, format: 'json' | 'csv') {
  if (USE_MOCK) {
    const text =
      format === 'json'
        ? JSON.stringify({ note: 'Mock export — connect to the API for real data.' }, null, 2)
        : 'userId,username,points\nmock-1,MockUser,100\n';
    const blob = new Blob([text], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campaign-${campaignId}-export.${format === 'json' ? 'json' : 'csv'}`;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }

  const session = await getSession();
  const headers: HeadersInit = { Accept: format === 'csv' ? 'text/csv' : 'application/json' };
  if (session?.accessToken) {
    (headers as Record<string, string>).Authorization = `Bearer ${session.accessToken}`;
  }

  const res = await fetch(
    `${BASE_URL}/projects/me/campaigns/${campaignId}/export?format=${format}`,
    { credentials: 'include', headers },
  );
  const raw: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errBody = raw as { error?: { message?: string } };
    const msg = errBody.error?.message ?? JSON.stringify(raw);
    throw new Error(`${res.status}: ${msg}`);
  }
  const outer = raw as { success?: boolean; data?: { format: string; content: unknown } };
  const payload = outer?.data && typeof outer.data === 'object' ? outer.data : (raw as { format?: string; content?: unknown });
  const fmt = payload.format ?? format;
  let blob: Blob;
  if (fmt === 'csv' && typeof payload.content === 'string') {
    blob = new Blob([payload.content], { type: 'text/csv;charset=utf-8' });
  } else {
    const body =
      typeof payload.content === 'string'
        ? payload.content
        : JSON.stringify(payload.content ?? payload, null, 2);
    blob = new Blob([body], { type: 'application/json;charset=utf-8' });
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `campaign-${campaignId}-export.${fmt === 'csv' ? 'csv' : 'json'}`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExportPage() {
  const params = useParams<{ id: string }>();
  const campaignId = params?.id ?? '';
  const { data: campaign, isLoading: campaignLoading } = useCampaign(campaignId);
  const { data: previewRows, isLoading: previewLoading } = useExportData(campaignId);
  const [busy, setBusy] = useState<'json' | 'csv' | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function handleDownload(format: 'json' | 'csv') {
    if (!campaignId) return;
    setErr(null);
    setBusy(format);
    try {
      await downloadExport(campaignId, format);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Download failed');
    } finally {
      setBusy(null);
    }
  }

  const loading = campaignLoading || previewLoading;
  const previewCount = previewRows?.length ?? 0;

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />
      <section className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-[#555] mb-2">
              <Link href="/project/dashboard" className="hover:text-[#FF5C00] transition-colors">
                Dashboard
              </Link>
              <span>/</span>
              <Link
                href={`/project/campaigns/${campaignId}/participants`}
                className="hover:text-[#FF5C00] transition-colors"
              >
                Participants
              </Link>
              <span>/</span>
              <span>Export</span>
            </div>
            {loading && !campaign ? (
              <LoadingSkeleton className="h-9 w-64 mb-2" />
            ) : (
              <h1 className="font-space-grotesk text-3xl font-bold">
                Export · {campaign?.name ?? 'Campaign'}
              </h1>
            )}
            <p className="mt-2 text-sm text-[#777]">
              Download participant data as JSON or CSV. You must be signed in as the project owner.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#1E1E1E] bg-[#0E0E0E] p-6 space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#555] mb-2">
              Preview (JSON path)
            </p>
            {loading ? (
              <LoadingSkeleton className="h-10 w-40" />
            ) : (
              <p className="text-lg font-bold text-white">
                {previewCount.toLocaleString()} row{previewCount === 1 ? '' : 's'} loaded for preview
              </p>
            )}
          </div>

          {err && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {err}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              disabled={!campaignId || busy !== null}
              onClick={() => handleDownload('json')}
              className={cn(
                'flex-1 rounded-xl py-3.5 text-sm font-black transition-colors',
                'bg-[#FF5C00] text-white hover:bg-[#e05200] disabled:opacity-50',
              )}
            >
              {busy === 'json' ? 'Preparing…' : 'Download JSON'}
            </button>
            <button
              type="button"
              disabled={!campaignId || busy !== null}
              onClick={() => handleDownload('csv')}
              className={cn(
                'flex-1 rounded-xl border border-[#2A2A2A] py-3.5 text-sm font-bold transition-colors',
                'text-[#ccc] hover:border-[#444] hover:text-white disabled:opacity-50',
              )}
            >
              {busy === 'csv' ? 'Preparing…' : 'Download CSV'}
            </button>
          </div>

          <p className="text-xs text-[#555]">
            CSV/JSON files use the owner export endpoint. If preview counts look off, open downloads —
            the file is the source of truth.
          </p>
        </div>
      </section>
    </main>
  );
}
