'use client';

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ContractsView } from '@/components/contracts/ContractsView';

export default function ContractsPage() {
  return (
    <AppLayout
      title="Service Agreements & Contract Compliance"
      breadcrumbs={[{ label: 'Contracts' }]}
    >
      <ContractsView />
    </AppLayout>
  );
}
