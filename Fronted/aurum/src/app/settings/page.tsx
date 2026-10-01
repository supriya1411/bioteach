'use client';

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { SettingsView } from '@/components/settings/SettingsView';

export default function SettingsPage() {
  return (
    <AppLayout
      title="System Settings & Operational Configurations"
      breadcrumbs={[{ label: 'Settings' }]}
    >
      <SettingsView />
    </AppLayout>
  );
}
