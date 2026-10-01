'use client';

import React from 'react';
import Link from 'next/link';
import { Activity, ArrowRight, Radio, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { useAurumStore } from '@/store/useStore';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

export const IoTSummaryCard: React.FC = () => {
  const { devices } = useAurumStore();

  const onlineCount = devices.filter((d) => d.status === 'online' || d.status === 'warning' || d.status === 'critical').length;
  const offlineCount = devices.filter((d) => d.status === 'offline' || d.status === 'no_sensor').length;
  const activeAnomaliesCount = devices.reduce(
    (acc, d) => acc + d.anomalies.filter((an) => !an.acknowledged).length,
    0
  );

  const sparklineData = [
    { v: 3 }, { v: 4 }, { v: 2 }, { v: 5 }, { v: 6 }, { v: 4 }, { v: 8 }, { v: 7 }, { v: activeAnomaliesCount }
  ];

  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader
        title={
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-500" />
            <span>IoT Sensor Telemetry</span>
          </div>
        }
        subtitle="Gateway connectivity & anomaly tracking"
        action={
          <Link
            href="/iot"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>Monitor</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        }
      />
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl">
            <p className="text-[11px] font-semibold text-emerald-800">Online</p>
            <p className="text-xl font-extrabold text-emerald-700">{onlineCount}</p>
          </div>
          <div className="p-3 bg-slate-100/70 border border-slate-200 rounded-xl">
            <p className="text-[11px] font-semibold text-slate-600">Offline</p>
            <p className="text-xl font-extrabold text-slate-700">{offlineCount}</p>
          </div>
          <div className="p-3 bg-rose-50/70 border border-rose-100 rounded-xl">
            <p className="text-[11px] font-semibold text-rose-800">Anomalies</p>
            <p className="text-xl font-extrabold text-rose-700">{activeAnomaliesCount}</p>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
            <span>24h Anomaly Rate</span>
            <span className="font-semibold text-rose-600">Active telemetry spikes</span>
          </div>
          <div className="h-10 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData}>
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke="#EF4444"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
