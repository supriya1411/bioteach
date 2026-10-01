'use client';

import React, { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { GlobalSearchModal } from './GlobalSearchModal';
import { ToastContainer } from './ToastContainer';
import { useAurumStore } from '@/store/useStore';
import { WifiOff } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  breadcrumbs?: { label: string; href?: string }[];
  action?: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  title,
  breadcrumbs,
  action,
}) => {
  const { isOnline, setIsOnline } = useAurumStore();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setIsOnline]);

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] text-[#1E293B]">
      {/* Offline Alert Banner */}
      {!isOnline && (
        <div className="fixed top-0 inset-x-0 z-50 bg-amber-500 text-white text-xs font-semibold py-1.5 px-4 text-center flex items-center justify-center gap-2 shadow-md">
          <WifiOff className="w-4 h-4" />
          <span>You are currently working offline. Cached data is being shown. Changes will sync when reconnected.</span>
        </div>
      )}

      {/* Primary Left Sidebar */}
      <Sidebar />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <TopBar title={title} breadcrumbs={breadcrumbs} action={action} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>

      {/* Global Modals & Notifications */}
      <GlobalSearchModal />
      <ToastContainer />
    </div>
  );
};
