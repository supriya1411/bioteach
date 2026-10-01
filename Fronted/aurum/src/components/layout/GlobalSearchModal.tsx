'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Server,
  Activity,
  Zap,
  FileText,
  Wrench,
  ArrowRight,
  X,
} from 'lucide-react';
import { useAurumStore } from '@/store/useStore';

export const GlobalSearchModal: React.FC = () => {
  const router = useRouter();
  const {
    isSearchOpen,
    setSearchOpen,
    searchQuery,
    setSearchQuery,
    assets,
    devices,
    faults,
    contracts,
    workOrders,
  } = useAurumStore();

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(!isSearchOpen);
      }
      if (e.key === 'Escape' && isSearchOpen) {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, setSearchOpen]);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearchQuery('');
    }
  }, [isSearchOpen, setSearchQuery]);

  if (!isSearchOpen) return null;

  const query = searchQuery.trim().toLowerCase();

  // Filter datasets
  const matchedAssets = query
    ? assets.filter(
        (a) =>
          a.id.toLowerCase().includes(query) ||
          a.name.toLowerCase().includes(query) ||
          a.location.toLowerCase().includes(query) ||
          a.category.toLowerCase().includes(query)
      )
    : assets.slice(0, 3);

  const matchedSensors = query
    ? devices.filter(
        (d) =>
          d.id.toLowerCase().includes(query) ||
          d.sensorType.toLowerCase().includes(query) ||
          d.assetName.toLowerCase().includes(query)
      )
    : devices.slice(0, 2);

  const matchedFaults = query
    ? faults.filter(
        (f) =>
          f.code.toLowerCase().includes(query) ||
          f.description.toLowerCase().includes(query)
      )
    : faults.slice(0, 2);

  const matchedContracts = query
    ? contracts.filter(
        (c) =>
          c.id.toLowerCase().includes(query) ||
          c.name.toLowerCase().includes(query) ||
          c.vendor.toLowerCase().includes(query)
      )
    : contracts.slice(0, 2);

  const matchedWorkOrders = query
    ? workOrders.filter(
        (w) =>
          w.id.toLowerCase().includes(query) ||
          w.assetName.toLowerCase().includes(query) ||
          w.description.toLowerCase().includes(query)
      )
    : [];

  const handleSelect = (url: string) => {
    setSearchOpen(false);
    router.push(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-slate-900/40 backdrop-blur-xs">
      <div
        className="fixed inset-0"
        onClick={() => setSearchOpen(false)}
        aria-hidden="true"
      />
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] overflow-hidden z-10 flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input header */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#F1F5F9] bg-[#F8FAFC]">
          <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command, asset ID (EQ-204), fault code (E-204), sensor, or contract..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none text-sm text-slate-800 focus:outline-none placeholder-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block ml-3 px-2 py-0.5 text-[10px] font-mono bg-white border border-slate-200 rounded text-slate-500 shadow-2xs">
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div className="p-3 overflow-y-auto divide-y divide-slate-100">
          {/* Assets group */}
          {matchedAssets.length > 0 && (
            <div className="py-2">
              <div className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <Server className="w-3.5 h-3.5" />
                <span>Assets</span>
              </div>
              <div className="mt-1 space-y-0.5">
                {matchedAssets.map((asset) => (
                  <button
                    key={asset.id}
                    onClick={() => handleSelect(`/assets/${asset.id}`)}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg text-left hover:bg-indigo-50/70 hover:text-[#4F46E5] group transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 group-hover:bg-indigo-100 group-hover:text-[#4F46E5] px-2 py-0.5 rounded">
                        {asset.id}
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 group-hover:text-[#4F46E5]">
                          {asset.name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {asset.category} • {asset.location}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-400 group-hover:text-[#4F46E5]">
                        Health: {asset.healthScore}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#4F46E5] transform group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* IoT Sensors group */}
          {matchedSensors.length > 0 && (
            <div className="py-2">
              <div className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <Activity className="w-3.5 h-3.5" />
                <span>IoT Sensors & Telemetry</span>
              </div>
              <div className="mt-1 space-y-0.5">
                {matchedSensors.map((dev) => (
                  <button
                    key={dev.id}
                    onClick={() => handleSelect(`/iot/${dev.id}`)}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg text-left hover:bg-indigo-50/70 hover:text-[#4F46E5] group transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {dev.sensorType}
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 group-hover:text-[#4F46E5]">
                          {dev.assetName}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Reading: {dev.currentReading} {dev.unit} • Status: {dev.status}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#4F46E5]" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Faults group */}
          {matchedFaults.length > 0 && (
            <div className="py-2">
              <div className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5" />
                <span>Fault Codes & Analytics</span>
              </div>
              <div className="mt-1 space-y-0.5">
                {matchedFaults.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => handleSelect('/faults')}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg text-left hover:bg-indigo-50/70 hover:text-[#4F46E5] group transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                        {f.code}
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 group-hover:text-[#4F46E5]">
                          {f.description}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {f.occurrences} incidents • Avg MTTR: {f.avgResolutionTimeHours}h
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#4F46E5]" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Contracts group */}
          {matchedContracts.length > 0 && (
            <div className="py-2">
              <div className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <FileText className="w-3.5 h-3.5" />
                <span>Service Contracts</span>
              </div>
              <div className="mt-1 space-y-0.5">
                {matchedContracts.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelect(`/contracts/${c.id}`)}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg text-left hover:bg-indigo-50/70 hover:text-[#4F46E5] group transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                        {c.id}
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 group-hover:text-[#4F46E5]">
                          {c.name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Vendor: {c.vendor} • Value: ${c.value.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#4F46E5]" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Work Orders group */}
          {matchedWorkOrders.length > 0 && (
            <div className="py-2">
              <div className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <Wrench className="w-3.5 h-3.5" />
                <span>Work Orders</span>
              </div>
              <div className="mt-1 space-y-0.5">
                {matchedWorkOrders.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => handleSelect('/maintenance')}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg text-left hover:bg-indigo-50/70 group transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {w.id}
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 group-hover:text-[#4F46E5]">
                          {w.assetName}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {w.type} • Status: {w.status}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#4F46E5]" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {matchedAssets.length === 0 &&
            matchedSensors.length === 0 &&
            matchedFaults.length === 0 &&
            matchedContracts.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-500">
                No matching results found for &quot;{query}&quot;. Try searching for &quot;Chiller&quot;, &quot;E-204&quot;, &quot;Veolia&quot;, or &quot;EQ-204&quot;.
              </div>
            )}
        </div>

        {/* Modal footer hints */}
        <div className="px-4 py-2.5 bg-[#F8FAFC] border-t border-[#F1F5F9] flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px]">
                ↑
              </kbd>{' '}
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px]">
                ↓
              </kbd>{' '}
              to navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px]">
                ENTER
              </kbd>{' '}
              to open
            </span>
          </div>
          <span>AURUM Instant Search Engine</span>
        </div>
      </div>
    </div>
  );
};
