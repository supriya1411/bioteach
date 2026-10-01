'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Radio,
  Activity,
  AlertTriangle,
  WifiOff,
  CheckCircle2,
  SlidersHorizontal,
  ArrowRight,
  Clock,
  Filter,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { IoTPill, SeverityPill } from '../ui/StatusPill';
import { useAurumStore } from '@/store/useStore';
import { IoTDevice } from '@/types';

export const IoTOverviewView: React.FC = () => {
  const { devices, acknowledgeAnomaly } = useAurumStore();

  const [selectedSite, setSelectedSite] = useState<string>('All');
  const [selectedSensorType, setSelectedSensorType] = useState<string>('All');

  // Counts
  const totalSensors = devices.length;
  const onlineSensors = devices.filter((d) => d.status === 'online' || d.status === 'warning' || d.status === 'critical').length;
  const offlineSensors = devices.filter((d) => d.status === 'offline' || d.status === 'no_sensor').length;
  const activeAnomalies = devices.flatMap((d) =>
    d.anomalies.filter((an) => !an.acknowledged).map((an) => ({ ...an, deviceId: d.id, assetName: d.assetName, sensorType: d.sensorType, unit: d.unit }))
  );

  // Sites list
  const sites = ['All', 'Main Hospital Campus', 'Radiology Wing', 'North Substation Yard', 'Surgery & ICU Block', 'Central Energy Plant', 'Supply Logistics Hub'];
  const sensorTypes = ['All', 'Temperature', 'Vibration', 'Pressure', 'Current'];

  // Filter devices
  const filteredDevices = devices.filter((dev) => {
    const matchSite = selectedSite === 'All' || dev.location.includes(selectedSite);
    const matchType = selectedSensorType === 'All' || dev.sensorType === selectedSensorType;
    return matchSite && matchType;
  });

  // Sort: Critical -> Warning -> Online -> Offline
  const sortedDevices = [...filteredDevices].sort((a, b) => {
    const order = { critical: 4, warning: 3, online: 2, offline: 1, no_sensor: 0 };
    return order[b.status] - order[a.status];
  });

  return (
    <div className="space-y-6">
      {/* 1. Status Bar KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center justify-between border-slate-200">
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Telemetry Channels</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{totalSensors}</p>
            <span className="text-[11px] text-emerald-600 font-semibold">100% gateway registered</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <Radio className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between border-emerald-200 bg-emerald-50/30">
          <div>
            <p className="text-xs font-semibold text-emerald-800">Sensors Online</p>
            <p className="text-2xl font-black text-emerald-700 mt-0.5">{onlineSensors}</p>
            <span className="text-[11px] text-emerald-600 font-semibold">99.4% heartbeat uptime</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between border-slate-200">
          <div>
            <p className="text-xs font-semibold text-slate-500">Sensors Offline</p>
            <p className="text-2xl font-black text-slate-700 mt-0.5">{offlineSensors}</p>
            <span className="text-[11px] text-slate-400 font-semibold">1 awaiting gateway reboot</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
            <WifiOff className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between border-rose-200 bg-rose-50/40">
          <div>
            <p className="text-xs font-semibold text-rose-800">Active Anomalies</p>
            <p className="text-2xl font-black text-rose-600 mt-0.5">{activeAnomalies.length}</p>
            <span className="text-[11px] text-rose-600 font-semibold">Threshold excursions</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* 2. Site / Sensor Filter Bar */}
      <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-600 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Location:
          </span>
          {sites.slice(0, 4).map((site) => (
            <button
              key={site}
              onClick={() => setSelectedSite(site)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedSite === site
                  ? 'bg-[#312E81] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {site}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <select
            value={selectedSensorType}
            onChange={(e) => setSelectedSensorType(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none"
          >
            <option value="All">All Sensor Types</option>
            {sensorTypes.filter((t) => t !== 'All').map((t) => (
              <option key={t} value={t}>
                {t} Sensors
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* 3. Main Grid + Anomaly Live Feed Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sensor Grid (2 cols on lg) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sortedDevices.map((sensor) => (
              <Link key={sensor.id} href={`/iot/${sensor.id}`}>
                <Card
                  hoverable
                  className={`p-5 flex flex-col justify-between h-full border transition-all hover:-translate-y-0.5 ${
                    sensor.status === 'critical'
                      ? 'border-rose-300 bg-rose-50/10'
                      : sensor.status === 'warning'
                      ? 'border-amber-300 bg-amber-50/10'
                      : 'border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="font-mono text-[10px] text-slate-400 font-bold uppercase">
                          {sensor.id}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 leading-tight mt-0.5">
                          {sensor.assetName}
                        </h4>
                        <p className="text-[11px] text-slate-500">{sensor.location}</p>
                      </div>
                      <IoTPill status={sensor.status} />
                    </div>

                    <div className="my-3">
                      <div className="flex items-baseline gap-1.5">
                        <span
                          className={`text-3xl font-black tracking-tight ${
                            sensor.status === 'critical'
                              ? 'text-rose-600'
                              : sensor.status === 'warning'
                              ? 'text-amber-600'
                              : 'text-slate-900'
                          }`}
                        >
                          {sensor.currentReading}
                        </span>
                        <span className="text-sm font-bold text-slate-500">{sensor.unit}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                        {sensor.sensorType} Channel
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      Critical Limit: <strong>{sensor.criticalThreshold} {sensor.unit}</strong>
                    </span>
                    <span className="text-indigo-600 font-bold group-hover:underline flex items-center gap-1">
                      <span>Detail</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Anomaly Live Feed (Right Panel) */}
        <Card className="h-full flex flex-col justify-between">
          <CardHeader
            title={
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span>Live Anomaly Feed</span>
              </div>
            }
            subtitle="Threshold excursions detected by edge filter algorithms"
          />
          <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
            {activeAnomalies.length > 0 ? (
              activeAnomalies.map((anom) => (
                <div
                  key={anom.id}
                  className="p-3.5 bg-rose-50/60 border border-rose-200/80 rounded-xl space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <SeverityPill severity={anom.severity} />
                    <span className="text-[11px] text-slate-500">{anom.timestamp}</span>
                  </div>

                  <div>
                    <p className="font-bold text-slate-900">{anom.assetName}</p>
                    <p className="text-[11px] text-rose-700 font-semibold mt-0.5">
                      {anom.deviation}
                    </p>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Reading: <strong>{anom.reading}{anom.unit}</strong> (Threshold: {anom.threshold}{anom.unit})
                    </p>
                  </div>

                  <div className="pt-2 border-t border-rose-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-mono">
                      Duration: {anom.durationMinutes}m
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => acknowledgeAnomaly(anom.deviceId, anom.id)}
                      className="text-[11px] py-1 bg-white hover:bg-rose-50"
                    >
                      Acknowledge
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-500">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="font-bold text-slate-800">All Telemetry Feeds Nominal</p>
                <p className="text-[11px] text-slate-400 mt-0.5">No active sensor deviations.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
