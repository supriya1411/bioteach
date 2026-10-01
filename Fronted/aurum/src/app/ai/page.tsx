'use client';

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { AiAssistantView } from '@/components/ai/AiAssistantView';

export default function AiAssistantPage() {
  return (
    <AppLayout
      title="AURUM AI Intelligence Assistant"
      breadcrumbs={[{ label: 'AI Assistant' }]}
    >
      <AiAssistantView />
    </AppLayout>
  );
}
