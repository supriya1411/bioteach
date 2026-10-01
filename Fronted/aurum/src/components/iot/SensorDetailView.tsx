'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowLeft,
  Server,
  AlertTriangle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Sliders,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { IoTPill, SeverityPill } from '../ui/StatusPill';
import { useAurumStore } from '@/store/useStore';
import { IoTDevice } from '@/types';

interface SensorDetailViewProps {
  deviceId: string;
}

export const SensorDetailView: React.FC<SensorDetailViewProps> = ({ deviceId }) => {
  const { devices, acknowledgeAnomaly } = useAurumStore();
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d' | '30d'>('24h');

  const sensor = devices.find((d) => d.id === deviceId) || devices[0];
  const historyData = sensor?.history[timeRange] || [];

  return (
    <div className="space-y-6">
      {/* Back button & Header Band */}
      <div className="flex items-center justify-between">
        <Link href="/iot">
          <Button variant="outline" size="sm" icon={<ArrowLeft className="w-3.5 h-3.5" />}>
            Back to IoT Monitor
          </Button>
        </Link>
        <Link href={`/assets/${sensor.assetId}`}>
          <Button variant="secondary" size="sm" icon={<Server className="w-3.5 h-3.5" />}>
            Inspect Parent Asset ({sensor.assetId})
          </Button>
        </Link>
      </div>

      <Card className="p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                {sensor.id}
              </span>
              <IoTPill status={sensor.status} />
              <span className="text-xs font-semibold text-slate-500">
                Last Heartbeat: {sensor.lastSeen}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              {sensor.sensorType} Telemetry — {sensor.assetName}
            </h1>
            <p className="text-xs text-slate-500 mt-1">Location: {sensor.location}</p>
          </div>

          {/* Current Large Reading Tile */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-right min-w-[180px]">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Live Sensor Reading</span>
            <div className="flex items-baseline justify-end gap-1.5 mt-0.5">
              <span className="text-4xl font-black text-slate-900">{sensor.currentReading}</span>
              <span className="text-base font-bold text-slate-600">{sensor.unit}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Threshold Configuration Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-emerald-200 bg-emerald-50/30">
          <span className="text-[11px] font-bold text-emerald-800 uppercase">Safe Operating Band</span>
          <p className="text-lg font-bold text-emerald-700 mt-1">
            {sensor.minThreshold} – {sensor.maxThreshold} {sensor.unit}
          </p>
          <p className="text-[11px] text-emerald-600 mt-0.5">Nominal continuous performance</p>
        </Card>

        <Card className="p-4 border-amber-200 bg-amber-50/30">
          <span className="text-[11px] font-bold text-amber-800 uppercase">Warning Threshold</span>
          <p className="text-lg font-bold text-amber-700 mt-1">
            ≥ {sensor.warningThreshold} {sensor.unit}
          </p>
          <p className="text-[11px] text-amber-600 mt-0.5">Dispatches level-2 operational advisory</p>
        </Card>

        <Card className="p-4 border-rose-200 bg-rose-50/30">
          <span className="text-[11px] font-bold text-rose-800 uppercase">Critical Threshold</span>
          <p className="text-lg font-bold text-rose-700 mt-1">
            ≥ {sensor.criticalThreshold} {sensor.unit}
          </p>
          <p className="text-[11px] text-rose-600 mt-0.5">Triggers immediate Action Center ticket</p>
        </Card>
      </div>

      {/* Interactive Time Series Chart */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Historical Telemetry Curve</h3>
            <p className="text-xs text-slate-500">
              Granular time-series stream with overlaid warning and critical limit reference lines
            </p>
          </div>

          <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200">
            {(['1h', '6h', '24h', '7d', '30d'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  timeRange === r ? 'bg-white shadow-2xs text-[#4F46E5]' : 'text-slate-500'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historyData}>
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748B' }} />
              <YAxis tick={{ fontSize: 10, fill: '#64748B' }} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1E293B',
                  borderRadius: '8px',
                  color: '#FFF',
                  fontSize: '12px',
                }}
              />
              <ReferenceLine
                y={sensor.criticalThreshold}
                stroke="#EF4444"
                strokeDasharray="4 4"
                label={{
                  value: `Critical (${sensor.criticalThreshold}${sensor.unit})`,
                  fill: '#EF4444',
                  fontSize: 10,
                  position: 'top',
                }}
              />
              <ReferenceLine
                y={sensor.warningThreshold}
                stroke="#F59E0B"
                strokeDasharray="4 4"
                label={{
                  value: `Warning (${sensor.warningThreshold}${sensor.unit})`,
                  fill: '#F59E0B',
                  fontSize: 10,
                  position: 'top',
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#4F46E5"
                strokeWidth={2.5}
                dot={{ r: 2 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Anomaly History Table */}
      <Card className="shadow-xs">
        <CardHeader
          title="Captured Anomaly Excursions"
          subtitle="Event timeline, threshold deviations, and operator acknowledgments"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Event ID</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Reading Recorded</th>
                <th className="py-3 px-4">Threshold Exceeded</th>
                <th className="py-3 px-4">Deviation</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4 text-right">Status / Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {sensor.anomalies.length > 0 ? (
                sensor.anomalies.map((anom) => (
                  <tr key={anom.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{anom.id}</td>
                    <td className="py-3 px-4 text-slate-600">{anom.timestamp}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {anom.reading} {sensor.unit}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {anom.threshold} {sensor.unit}
                    </td>
                    <td className="py-3 px-4 font-semibold text-rose-700">{anom.deviation}</td>
                    <td className="py-3 px-4 font-mono">{anom.durationMinutes}m</td>
                    <td className="py-3 px-4">
                      <SeverityPill severity={anom.severity} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      {anom.acknowledged ? (
                        <span className="text-emerald-700 font-semibold flex items-center justify-end gap-1 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{anom.acknowledgedBy || 'Acknowledged'}</span>
                        </span>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => acknowledgeAnomaly(sensor.id, anom.id)}
                          className="text-xs"
                        >
                          Acknowledge
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-slate-400">
                    No anomaly events recorded for this sensor.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
