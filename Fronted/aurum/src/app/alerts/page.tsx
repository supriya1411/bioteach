'use client';

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { AlertsView } from '@/components/alerts/AlertsView';

export default function AlertsPage() {
  return (
    <AppLayout
      title="Unified Operations Alert Center"
      breadcrumbs={[{ label: 'Alerts' }]}
    >
      <AlertsView />
    </AppLayout>
  );
}
