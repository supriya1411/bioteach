'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { SensorDetailView } from '@/components/iot/SensorDetailView';

export default function SensorDetailPage() {
  const params = useParams();
  const deviceId = Array.isArray(params.deviceId) ? params.deviceId[0] : params.deviceId || 'DEV-CHILLER-TEMP';

  return (
    <AppLayout
      title={`Sensor Telemetry — ${deviceId}`}
      breadcrumbs={[{ label: 'IoT Monitor', href: '/iot' }, { label: deviceId }]}
    >
      <SensorDetailView deviceId={deviceId} />
    </AppLayout>
  );
}
