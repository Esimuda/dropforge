'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { LogOut, LayoutDashboard, Plus, Menu, X } from 'lucide-react';
import { useCurrentUser, useAuthActions } from '@/hooks/useAuth';
import LoginModal from './LoginModal';

const NAV_LINKS = [
  { href: '/campaigns', label: 'Campaigns' },
  { href: '/leaderboard/1', label: 'Leaderboard' },
  { href: '/dashboard', label: 'Dashboard' },
];

function truncate(addr?: string) {
  if (!addr) return '';
  return addr.length > 10 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
}

export default function Navbar() {
  const pathname = usePathname();
  const { user, walletAddress, isWalletConnected, isLoading } = useCurrentUser();
  const { logout } = useAuthActions();
  const [loginOpen, setLoginOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isAuthed = !!user || isWalletConnected;
  const displayName =
    user?.name ||
    (user as { twitterHandle?: string } | null)?.twitterHandle ||
    (user as { discordHandle?: string } | null)?.discordHandle ||
    truncate(walletAddress);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  return (
    <>
      <nav className="sticky top-0 z-40 bg-[#0A0A0A]/85 backdrop-blur-md border-b border-[#1A1A1A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <a
              href="/"
              className="text-xl font-black text-[#FF5C00] tracking-tight"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              DROPFORGE
            </a>
            <div className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => {
                const active = pathname === link.href || pathname?.startsWith(link.href + '/');
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      active
                        ? 'text-white bg-[#1A1A1A]'
                        : 'text-[#888] hover:text-white hover:bg-[#1A1A1A]/60'
                    }`}
                  >
                    {link.label}
                  </a>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/campaigns/new"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#FF5C00]/30 text-[#FF5C00] text-sm font-semibold hover:bg-[#FF5C00]/10 hover:border-[#FF5C00]/60 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Campaign
            </a>

            {isLoading ? (
              <div className="w-24 h-9 rounded-lg bg-[#1A1A1A] animate-pulse" />
            ) : isAuthed ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-lg bg-[#141414] border border-[#222] hover:border-[#FF5C00]/40 transition-colors"
                >
                  <span className="w-7 h-7 rounded-full bg-gradient-to-br from-[#FF5C00] to-[#FF8C00] flex items-center justify-center text-xs font-bold text-black">
                    {(displayName || '?').charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden sm:block text-sm font-medium text-white max-w-[120px] truncate">
                    {displayName || 'Account'}
                  </span>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-[#222] bg-[#141414] shadow-2xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-[#1E1E1E]">
                      <p className="text-xs text-[#666]">Signed in as</p>
                      <p className="text-sm font-semibold text-white truncate">
                        {displayName || 'Account'}
                      </p>
                      {walletAddress && (
                        <p className="text-[11px] font-mono text-[#FF5C00] mt-0.5">
                          {truncate(walletAddress)}
                        </p>
                      )}
                    </div>
                    <a
                      href="/dashboard"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#CCC] hover:bg-[#1A1A1A] hover:text-white transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </a>
                    <a
                      href="/campaigns/new"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#CCC] hover:bg-[#1A1A1A] hover:text-white transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Create Campaign
                    </a>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors border-t border-[#1E1E1E]"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setLoginOpen(true)}
                className="px-4 py-2 rounded-lg bg-[#FF5C00] hover:bg-[#E54E00] text-white text-sm font-semibold transition-colors shadow-sm shadow-[#FF5C00]/30"
              >
                Sign in
              </button>
            )}

            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="md:hidden w-9 h-9 rounded-lg bg-[#141414] border border-[#222] flex items-center justify-center text-[#888] hover:text-white"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-[#1A1A1A] bg-[#0A0A0A]">
            <div className="px-4 py-3 space-y-1">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="block px-3 py-2 rounded-md text-sm text-[#CCC] hover:text-white hover:bg-[#141414]"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <a
                href="/campaigns/new"
                className="block px-3 py-2 rounded-md text-sm text-[#FF5C00] font-semibold hover:bg-[#FF5C00]/10"
                onClick={() => setMobileOpen(false)}
              >
                + Create Campaign
              </a>
            </div>
          </div>
        )}
      </nav>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
