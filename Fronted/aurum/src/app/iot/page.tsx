'use client';

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { IoTOverviewView } from '@/components/iot/IoTOverviewView';

export default function IoTMonitoringPage() {
  return (
    <AppLayout
      title="IoT Sensor Telemetry & Anomaly Detection"
      breadcrumbs={[{ label: 'IoT Monitor' }]}
    >
      <IoTOverviewView />
    </AppLayout>
  );
}
