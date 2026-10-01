'use client';

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { MaintenanceView } from '@/components/maintenance/MaintenanceView';

export default function MaintenancePage() {
  return (
    <AppLayout
      title="Preventive Maintenance & Work Orders"
      breadcrumbs={[{ label: 'Maintenance' }]}
    >
      <MaintenanceView />
    </AppLayout>
  );
}
