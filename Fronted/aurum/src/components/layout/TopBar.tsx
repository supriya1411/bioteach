'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Menu, Bell, ChevronRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAurumStore } from '@/store/useStore';
import { Button } from '../ui/Button';

interface TopBarProps {
  title?: string;
  breadcrumbs?: { label: string; href?: string }[];
  action?: React.ReactNode;
}

export const TopBar: React.FC<TopBarProps> = ({ title, breadcrumbs, action }) => {
  const pathname = usePathname();
  const { setSidebarOpen, setSearchOpen, alerts } = useAurumStore();

  const criticalCount = alerts.filter(
    (a) => a.severity === 'critical' && a.status === 'active'
  ).length;

  const defaultTitles: Record<string, string> = {
    '/': 'Operations Command Center',
    '/assets': 'Asset Estate Directory',
    '/iot': 'IoT Sensor Telemetry',
    '/faults': 'Fault Intelligence & Root Cause',
    '/maintenance': 'Preventive Maintenance & Work Orders',
    '/contracts': 'Service Contracts & Compliance',
    '/alerts': 'Unified Alert Center',
    '/reports': 'Executive & Compliance Reports',
    '/ai': 'AURUM AI Intelligence Assistant',
    '/settings': 'System Settings & Integrations',
  };

  const pageTitle =
    title ||
    defaultTitles[pathname] ||
    (pathname.startsWith('/assets/')
      ? 'Asset Detail Inspection'
      : pathname.startsWith('/iot/')
      ? 'IoT Sensor Telemetry Drilldown'
      : pathname.startsWith('/contracts/')
      ? 'Contract Performance & Audit'
      : pathname.startsWith('/reports/')
      ? 'Report Viewer'
      : 'Service Operations');

  return (
    <header className="h-16 bg-white border-b border-[#E2E8F0] px-4 lg:px-6 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
      {/* Left: Mobile hamburger & breadcrumb/title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          {breadcrumbs && breadcrumbs.length > 0 ? (
            <nav className="flex items-center space-x-1 text-xs text-slate-500 mb-0.5">
              <Link href="/" className="hover:text-indigo-600 transition-colors">
                Command Center
              </Link>
              {breadcrumbs.map((bc, idx) => (
                <React.Fragment key={idx}>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                  {bc.href ? (
                    <Link href={bc.href} className="hover:text-indigo-600 transition-colors">
                      {bc.label}
                    </Link>
                  ) : (
                    <span className="text-slate-800 font-medium">{bc.label}</span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          ) : null}
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-[#1E293B] tracking-tight truncate max-w-xs sm:max-w-md md:max-w-lg">
              {pageTitle}
            </h1>
            <span className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Full-Stack API Synced</span>
            </span>
          </div>
        </div>
      </div>

      {/* Right: Search, AI button, Notification bell, Contextual actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Global Search trigger (Cmd/Ctrl + K) */}
        <button
          onClick={() => setSearchOpen(true)}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg text-xs text-[#64748B] transition-colors shadow-2xs"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span>Search assets, faults, contracts...</span>
          <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white border border-slate-200 rounded text-slate-500 shadow-2xs">
            ⌘K
          </kbd>
        </button>

        <button
          onClick={() => setSearchOpen(true)}
          className="sm:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
          aria-label="Search"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* AI Quick Button */}
        <Link href="/ai">
          <Button
            variant="secondary"
            size="sm"
            icon={<Sparkles className="w-3.5 h-3.5 text-[#4F46E5]" />}
            className="hidden lg:inline-flex text-xs py-1.5"
          >
            AI Copilot
          </Button>
        </Link>

        {/* Alerts Link & Badge */}
        <Link
          href="/alerts"
          className="relative p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          title="Active Alerts"
        >
          <Bell className="w-5 h-5" />
          {criticalCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white" />
          )}
        </Link>

        {/* Contextual Page Action */}
        {action && <div className="ml-1 sm:ml-2">{action}</div>}
      </div>
    </header>
  );
};
