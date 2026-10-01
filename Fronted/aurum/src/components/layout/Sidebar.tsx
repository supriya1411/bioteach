'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Server,
  Activity,
  Zap,
  Wrench,
  FileText,
  Bell,
  BarChart3,
  Sparkles,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useAurumStore } from '@/store/useStore';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const {
    isSidebarOpen,
    isSidebarCollapsed,
    setSidebarOpen,
    toggleSidebarCollapsed,
    alerts,
  } = useAurumStore();

  const criticalAlertsCount = alerts.filter(
    (a) => a.severity === 'critical' && a.status === 'active'
  ).length;

  const mainNavItems: NavItem[] = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Assets', href: '/assets', icon: Server },
    { label: 'IoT Monitor', href: '/iot', icon: Activity },
    { label: 'Fault Analytics', href: '/faults', icon: Zap },
    { label: 'Maintenance', href: '/maintenance', icon: Wrench },
    { label: 'Contracts', href: '/contracts', icon: FileText },
    {
      label: 'Alerts',
      href: '/alerts',
      icon: Bell,
      badge: criticalAlertsCount,
    },
    { label: 'Reports', href: '/reports', icon: BarChart3 },
  ];

  const bottomNavItems: NavItem[] = [
    { label: 'AI Assistant', href: '/ai', icon: Sparkles },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  const renderNavList = (items: NavItem[], isMobile = false) => (
    <ul className="space-y-1">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href);

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={() => isMobile && setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative ${
                isActive
                  ? 'bg-[#312E81] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              } ${isSidebarCollapsed && !isMobile ? 'justify-center px-2' : ''}`}
              title={isSidebarCollapsed && !isMobile ? item.label : undefined}
            >
              <Icon
                className={`w-5 h-5 shrink-0 transition-colors ${
                  isActive
                    ? 'text-indigo-200'
                    : 'text-slate-500 group-hover:text-slate-700'
                }`}
              />
              {(!isSidebarCollapsed || isMobile) && (
                <span className="truncate flex-1">{item.label}</span>
              )}
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`shrink-0 text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-rose-500 text-white'
                      : 'bg-rose-100 text-rose-700 border border-rose-200'
                  } ${
                    isSidebarCollapsed && !isMobile
                      ? 'absolute top-1 right-1 px-1 py-0 text-[9px] w-4 h-4 flex items-center justify-center'
                      : ''
                  }`}
                >
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      {/* Desktop & Tablet Sidebar */}
      <aside
        className={`hidden md:flex flex-col border-r border-[#E2E8F0] bg-white transition-all duration-300 z-30 select-none ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Header / Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#F1F5F9]">
          <Link
            href="/"
            className={`flex items-center gap-2.5 overflow-hidden ${
              isSidebarCollapsed ? 'justify-center w-full' : ''
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#312E81] to-[#4F46E5] flex items-center justify-center text-white shadow-xs shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col leading-tight">
                <span className="font-black tracking-wider text-base text-[#1E293B]">
                  AURUM
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#6366F1]">
                  Intelligence
                </span>
              </div>
            )}
          </Link>

          {!isSidebarCollapsed && (
            <button
              onClick={toggleSidebarCollapsed}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Collapsed expand toggle button */}
        {isSidebarCollapsed && (
          <div className="p-2 border-b border-slate-100 flex justify-center">
            <button
              onClick={toggleSidebarCollapsed}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              title="Expand sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-6">
          <div>
            {!isSidebarCollapsed && (
              <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Operations
              </p>
            )}
            {renderNavList(mainNavItems)}
          </div>

          <div>
            {!isSidebarCollapsed && (
              <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Intelligence
              </p>
            )}
            {renderNavList(bottomNavItems)}
          </div>
        </div>

        {/* User profile footer */}
        <div className="p-3 border-t border-[#F1F5F9] bg-[#F8FAFC]">
          <Link
            href="/settings"
            className={`flex items-center gap-3 p-2 rounded-lg hover:bg-slate-200/60 transition-colors ${
              isSidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-[#4F46E5] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              DR
            </div>
            {!isSidebarCollapsed && (
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-slate-800 truncate">
                  David Ross
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  Operations Director
                </p>
              </div>
            )}
          </Link>
        </div>
      </aside>

      {/* Mobile Drawer (Hidden on md+) */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-white shadow-2xl flex flex-col z-10">
            <div className="h-16 flex items-center justify-between px-5 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#312E81] flex items-center justify-center text-white">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="font-extrabold text-base text-[#1E293B]">
                  AURUM
                </span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 text-slate-500 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              <div>
                <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Operations
                </p>
                {renderNavList(mainNavItems, true)}
              </div>
              <div>
                <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Intelligence
                </p>
                {renderNavList(bottomNavItems, true)}
              </div>
            </div>

            <div className="p-4 border-t border-[#F1F5F9] bg-[#F8FAFC]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#4F46E5] text-white flex items-center justify-center font-bold text-xs">
                  DR
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">David Ross</p>
                  <p className="text-[11px] text-slate-500">Operations Director</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
