'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { AssetDetailView } from '@/components/assets/AssetDetailView';

export default function AssetDetailPage() {
  const params = useParams();
  const assetId = Array.isArray(params.assetId) ? params.assetId[0] : params.assetId || 'EQ-204';

  return (
    <AppLayout
      title={`Asset Inspection — ${assetId}`}
      breadcrumbs={[{ label: 'Assets', href: '/assets' }, { label: assetId }]}
    >
      <AssetDetailView assetId={assetId} />
    </AppLayout>
  );
}
