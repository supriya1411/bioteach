'use client';

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { AssetListView } from '@/components/assets/AssetListView';

export default function AssetsPage() {
  return (
    <AppLayout
      title="Asset Estate Directory"
      breadcrumbs={[{ label: 'Assets' }]}
    >
      <AssetListView />
    </AppLayout>
  );
}
