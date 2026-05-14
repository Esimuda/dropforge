'use client';

import { useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Chain, WalletEntry } from '@/types';

const cn = (...args: Parameters<typeof clsx>) => twMerge(clsx(args));

// ─── Validation Schemas ────────────────────────────────────────────────────────
const evmSchema = z
  .object({
    chain: z.enum(['ETH', 'BNB', 'MATIC', 'ARB', 'BASE', 'AVAX']),
    walletAddress: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid EVM address (must be 0x + 40 hex chars)'),
    confirmAddress: z.string(),
    confirmed: z.boolean().refine((v) => v === true, {
      message: 'You must confirm the address',
    }),
  })
  .refine((data) => data.walletAddress === data.confirmAddress, {
    message: 'Addresses do not match',
    path: ['confirmAddress'],
  });

const solSchema = z.object({
  chain: z.literal('SOL'),
  walletAddress: z
    .string()
    .min(32, 'Solana address must be at least 32 characters')
    .max(44, 'Solana address must be at most 44 characters')
    .regex(/^[1-9A-HJ-NP-Za-km-z]+$/, 'Invalid Solana address (base58 format)'),
  confirmAddress: z.string().optional(),
  confirmed: z.boolean().refine((v) => v === true, {
    message: 'You must confirm the address',
  }),
});

type EVMFormData = z.infer<typeof evmSchema>;
type SOLFormData = z.infer<typeof solSchema>;
type FormData = EVMFormData | SOLFormData;

// ─── Chain Config ──────────────────────────────────────────────────────────────
const EVM_CHAINS: { value: Chain; label: string; color: string }[] = [
  { value: 'ETH', label: 'Ethereum', color: '#627EEA' },
  { value: 'BNB', label: 'BNB Chain', color: '#F3BA2F' },
  { value: 'MATIC', label: 'Polygon', color: '#8247E5' },
  { value: 'ARB', label: 'Arbitrum', color: '#28A0F0' },
  { value: 'BASE', label: 'Base', color: '#0052FF' },
  { value: 'AVAX', label: 'Avalanche', color: '#E84142' },
];

const SOL_CHAINS: { value: Chain; label: string; color: string }[] = [
  { value: 'SOL', label: 'Solana', color: '#9945FF' },
];

const ALL_CHAINS = [...EVM_CHAINS, ...SOL_CHAINS];

function getChainConfig(chain: Chain) {
  return ALL_CHAINS.find((c) => c.value === chain);
}

function isEVMChain(chain: Chain): boolean {
  return ['ETH', 'BNB', 'MATIC', 'ARB', 'BASE', 'AVAX'].includes(chain);
}

// ─── Props ─────────────────────────────────────────────────────────────────────
interface WalletFormProps {
  campaignId: string;
  preferredChain?: Chain;
  existingEntry?: WalletEntry | null;
  onSubmit: (data: {
    campaignId: string;
    walletAddress: string;
    chain: Chain;
  }) => Promise<WalletEntry>;
  isSubmitting?: boolean;
  isSuccess?: boolean;
  submittedEntry?: WalletEntry | null;
  error?: string | null;
  onEditRequest?: () => void;
  campaignDeadline?: string;
}

// ─── Chain Selector ────────────────────────────────────────────────────────────
function ChainSelector({
  value,
  onChange,
  error,
}: {
  value: Chain;
  onChange: (v: Chain) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = getChainConfig(value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all duration-200',
          'bg-[#111111] text-white focus:outline-none',
          error
            ? 'border-red-500/70 focus:border-red-500'
            : 'border-[#2A2A2A] hover:border-[#FF5C00]/50 focus:border-[#FF5C00]'
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <span
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: selected?.color ?? '#FF5C00' }}
          />
          <span className="font-medium text-sm">
            {selected?.label ?? 'Select chain'}
          </span>
          <span className="text-[#666] text-xs font-mono">{value}</span>
        </div>
        <svg
          className={cn(
            'w-4 h-4 text-[#666] transition-transform duration-200',
            open && 'rotate-180'
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg overflow-hidden z-50 shadow-2xl">
          {/* EVM Group */}
          <div className="px-3 pt-2 pb-1">
            <p className="text-[10px] font-semibold text-[#555] uppercase tracking-widest">
              EVM Compatible
            </p>
          </div>
          {EVM_CHAINS.map((chain) => (
            <button
              key={chain.value}
              type="button"
              onClick={() => {
                onChange(chain.value);
                setOpen(false);
              }}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                'hover:bg-[#FF5C00]/10',
                value === chain.value
                  ? 'bg-[#FF5C00]/10 text-[#FF5C00]'
                  : 'text-[#CCC]'
              )}
            >
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: chain.color }}
              />
              <span className="flex-1 text-left font-medium">{chain.label}</span>
              <span className="font-mono text-xs text-[#555]">{chain.value}</span>
            </button>
          ))}

          {/* SOL Group */}
          <div className="px-3 pt-3 pb-1 border-t border-[#2A2A2A] mt-1">
            <p className="text-[10px] font-semibold text-[#555] uppercase tracking-widest">
              Other
            </p>
          </div>
          {SOL_CHAINS.map((chain) => (
            <button
              key={chain.value}
              type="button"
              onClick={() => {
                onChange(chain.value);
                setOpen(false);
              }}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors mb-1',
                'hover:bg-[#FF5C00]/10',
                value === chain.value
                  ? 'bg-[#FF5C00]/10 text-[#FF5C00]'
                  : 'text-[#CCC]'
              )}
            >
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: chain.color }}
              />
              <span className="flex-1 text-left font-medium">{chain.label}</span>
              <span className="font-mono text-xs text-[#555]">{chain.value}</span>
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
}

// ─── Address Input ─────────────────────────────────────────────────────────────
function AddressInput({
  value,
  onChange,
  isEVM,
  error,
  isValid,
  label,
  placeholder,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  isEVM: boolean;
  error?: string;
  isValid: boolean;
  label: string;
  placeholder: string;
  id: string;
}) {
  const [clipboardError, setClipboardError] = useState('');

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      onChange(text.trim());
      setClipboardError('');
    } catch {
      setClipboardError('Clipboard access denied');
      setTimeout(() => setClipboardError(''), 3000);
    }
  }, [onChange]);

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-[#AAA] mb-2"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          spellCheck={false}
          autoComplete="off"
          className={cn(
            'w-full px-4 py-3 pr-24 rounded-lg border font-mono text-sm transition-all duration-200',
            'bg-[#111111] text-white placeholder:text-[#444] focus:outline-none',
            error
              ? 'border-red-500/70 focus:border-red-500'
              : isValid && value.length > 0
              ? 'border-emerald-500/70 focus:border-emerald-500'
              : 'border-[#2A2A2A] hover:border-[#FF5C00]/40 focus:border-[#FF5C00]'
          )}
        />
        {/* Validity indicator */}
        {value.length > 0 && (
          <span className="absolute right-16 top-1/2 -translate-y-1/2">
            {isValid ? (
              <span className="text-emerald-400 text-base">✓</span>
            ) : (
              <span className="text-red-400 text-base">✗</span>
            )}
          </span>
        )}
        {/* Paste button */}
        <button
          type="button"
          onClick={handlePaste}
          className={cn(
            'absolute right-2 top-1/2 -translate-y-1/2',
            'px-2.5 py-1 rounded text-xs font-medium transition-colors',
            'bg-[#2A2A2A] hover:bg-[#FF5C00]/20 text-[#888] hover:text-[#FF5C00]',
            'border border-[#333] hover:border-[#FF5C00]/40'
          )}
        >
          Paste
        </button>
      </div>
      {clipboardError && (
        <p className="mt-1 text-xs text-amber-400">{clipboardError}</p>
      )}
      {error && (
        <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
}

// ─── Success State ─────────────────────────────────────────────────────────────
function SuccessState({
  entry,
  campaignId,
  onEdit,
  deadline,
}: {
  entry: WalletEntry;
  campaignId: string;
  onEdit?: () => void;
  deadline?: string;
}) {
  const isPastDeadline = deadline ? new Date(deadline) < new Date() : false;
  const chainConfig = getChainConfig(entry.chain);

  return (
    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-emerald-400 mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
        Wallet Submitted!
      </h3>
      <p className="text-[#888] text-sm mb-5">
        Your wallet has been registered for this airdrop.
      </p>
      <div className="bg-[#111] rounded-lg px-4 py-3 mb-5 text-left">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[#666] text-xs uppercase tracking-wider">Address</span>
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: chainConfig?.color ?? '#FF5C00' }}
            />
            <span className="text-xs text-[#888] font-mono">{entry.chain}</span>
          </div>
        </div>
        <p className="font-mono text-sm text-[#EEE] break-all">{entry.walletAddress}</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        {!isPastDeadline && onEdit && (
          <button
            onClick={onEdit}
            className="flex-1 py-2.5 rounded-lg border border-[#2A2A2A] text-sm text-[#AAA] hover:text-white hover:border-[#444] transition-colors"
          >
            Edit Submission
          </button>
        )}
        <a
          href={`/campaigns/${campaignId}`}
          className="flex-1 py-2.5 rounded-lg border border-[#FF5C00]/30 text-sm text-[#FF5C00] hover:bg-[#FF5C00]/10 transition-colors text-center"
        >
          View Campaign
        </a>
        <a
          href="/dashboard"
          className="flex-1 py-2.5 rounded-lg bg-[#FF5C00] text-sm text-white hover:bg-[#E54E00] transition-colors text-center font-medium"
        >
          Dashboard
        </a>
      </div>
    </div>
  );
}

// ─── Main WalletForm ───────────────────────────────────────────────────────────
export function WalletForm({
  campaignId,
  preferredChain,
  existingEntry,
  onSubmit,
  isSubmitting = false,
  isSuccess = false,
  submittedEntry,
  error,
  onEditRequest,
  campaignDeadline,
}: WalletFormProps) {
  const [selectedChain, setSelectedChain] = useState<Chain>(
    preferredChain ?? existingEntry?.chain ?? 'ETH'
  );
  const [showSuccess, setShowSuccess] = useState(isSuccess && !!submittedEntry);

  const isEVM = isEVMChain(selectedChain);

  const schema = isEVM ? evmSchema : solSchema;

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(schema as z.ZodType<FormData>),
    mode: 'onChange',
    defaultValues: {
      chain: preferredChain ?? existingEntry?.chain ?? 'ETH',
      walletAddress: existingEntry?.walletAddress ?? '',
      confirmAddress: '',
      confirmed: false,
    } as FormData,
  });

  const watchedAddress = watch('walletAddress') ?? '';
  const watchedConfirm = watch('confirmAddress') ?? '';

  const isAddressValid = isEVM
    ? /^0x[a-fA-F0-9]{40}$/.test(watchedAddress)
    : watchedAddress.length >= 32 &&
      watchedAddress.length <= 44 &&
      /^[1-9A-HJ-NP-Za-km-z]+$/.test(watchedAddress);

  const isConfirmValid = isEVM
    ? watchedAddress === watchedConfirm && watchedConfirm.length > 0
    : true;

  const handleChainChange = (chain: Chain) => {
    setSelectedChain(chain);
    setValue('chain', chain as never);
    setValue('walletAddress', '');
    if (isEVM) setValue('confirmAddress' as never, '');
  };

  const onFormSubmit = async (data: FormData) => {
    try {
      const result = await onSubmit({
        campaignId,
        walletAddress: data.walletAddress,
        chain: selectedChain,
      });
      if (result) {
        setShowSuccess(true);
      }
    } catch {
      // Error is surfaced via `error` prop from parent
    }
  };

  if (showSuccess && submittedEntry) {
    return (
      <SuccessState
        entry={submittedEntry}
        campaignId={campaignId}
        onEdit={() => {
          setShowSuccess(false);
          onEditRequest?.();
        }}
        deadline={campaignDeadline}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5" noValidate>
      {/* Chain Selector */}
      <div>
        <label className="block text-sm font-medium text-[#AAA] mb-2">
          Blockchain Network
        </label>
        <Controller
          name="chain"
          control={control}
          render={({ fieldState }) => (
            <ChainSelector
              value={selectedChain}
              onChange={handleChainChange}
              error={fieldState.error?.message}
            />
          )}
        />
      </div>

      {/* Wallet Address */}
      <Controller
        name="walletAddress"
        control={control}
        render={({ field, fieldState }) => (
          <AddressInput
            id="walletAddress"
            value={field.value ?? ''}
            onChange={field.onChange}
            isEVM={isEVM}
            error={fieldState.error?.message}
            isValid={isAddressValid}
            label="Wallet Address"
            placeholder={isEVM ? '0x742d35Cc6634C0532925a3b8D4C0a3b6e3f...' : '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU'}
          />
        )}
      />

      {/* Confirm Address (EVM only) */}
      {isEVM && (
        <Controller
          name={'confirmAddress' as keyof FormData}
          control={control}
          render={({ field, fieldState }) => (
            <AddressInput
              id="confirmAddress"
              value={(field.value as string) ?? ''}
              onChange={field.onChange}
              isEVM={isEVM}
              error={fieldState.error?.message}
              isValid={isConfirmValid}
              label="Confirm Wallet Address"
              placeholder="Re-enter your wallet address"
            />
          )}
        />
      )}

      {/* Match indicator */}
      {isEVM && watchedAddress.length > 0 && watchedConfirm.length > 0 && (
        <div
          className={cn(
            'flex items-center gap-2 text-sm px-3 py-2 rounded-lg',
            isConfirmValid
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          )}
        >
          <span>{isConfirmValid ? '✓' : '✗'}</span>
          <span className="text-xs">
            {isConfirmValid ? 'Addresses match' : 'Addresses do not match'}
          </span>
        </div>
      )}

      {/* Confirmation Checkbox */}
      <div>
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative flex-shrink-0 mt-0.5">
            <input
              type="checkbox"
              className="sr-only peer"
              {...register('confirmed')}
            />
            <div
              className={cn(
                'w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center',
                'peer-checked:bg-[#FF5C00] peer-checked:border-[#FF5C00]',
                'peer-focus:ring-2 peer-focus:ring-[#FF5C00]/30',
                errors.confirmed
                  ? 'border-red-500/70'
                  : 'border-[#3A3A3A] group-hover:border-[#FF5C00]/50'
              )}
            >
              <svg
                className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <span className="text-sm text-[#888] leading-relaxed group-hover:text-[#AAA] transition-colors">
            I confirm this wallet address is correct and I control the private
            keys for this wallet. I understand that incorrect submissions cannot
            be reversed after the campaign deadline.
          </span>
        </label>
        {errors.confirmed && (
          <p className="mt-1.5 text-xs text-red-400 ml-8">
            ⚠ {errors.confirmed.message}
          </p>
        )}
      </div>

      {/* API Error Banner */}
      {error && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30">
          <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={!isValid || isSubmitting}
        className={cn(
          'w-full py-3.5 rounded-lg font-semibold text-sm transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-[#FF5C00]/50',
          isValid && !isSubmitting
            ? 'bg-[#FF5C00] hover:bg-[#E54E00] text-white cursor-pointer shadow-lg shadow-[#FF5C00]/20'
            : 'bg-[#2A2A2A] text-[#555] cursor-not-allowed'
        )}
        style={{ fontFamily: 'Space Grotesk, sans-serif' }}
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Submitting…
          </span>
        ) : existingEntry ? (
          'Update Wallet Submission'
        ) : (
          'Submit Wallet Address'
        )}
      </button>
    </form>
  );
}
