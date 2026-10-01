'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { ContractDetailView } from '@/components/contracts/ContractDetailView';

export default function ContractDetailPage() {
  const params = useParams();
  const contractId = Array.isArray(params.contractId) ? params.contractId[0] : params.contractId || 'CTR-8801';

  return (
    <AppLayout
      title={`Contract Inspection — ${contractId}`}
      breadcrumbs={[{ label: 'Contracts', href: '/contracts' }, { label: contractId }]}
    >
      <ContractDetailView contractId={contractId} />
    </AppLayout>
  );
}
