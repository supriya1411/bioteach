'use client';

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { FaultAnalyticsView } from '@/components/faults/FaultAnalyticsView';

export default function FaultAnalyticsPage() {
  return (
    <AppLayout
      title="Fault Analytics & Failure Mode Intelligence"
      breadcrumbs={[{ label: 'Fault Analytics' }]}
    >
      <FaultAnalyticsView />
    </AppLayout>
  );
}
