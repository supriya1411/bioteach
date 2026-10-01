'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  LayoutGrid,
  List,
  ArrowUpDown,
  Eye,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Radio,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { HealthScoreBadge, RiskPill, IoTPill, PMPill } from '../ui/StatusPill';
import { Modal } from '../ui/Modal';
import { Gauge } from '../ui/Gauge';
import { EmptyState } from '../ui/EmptyState';
import { useAurumStore } from '@/store/useStore';
import { Asset } from '@/types';

export const AssetListView: React.FC = () => {
  const { assets, addToast } = useAurumStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [sortBy, setSortBy] = useState<'health' | 'risk' | 'name' | 'lastFault'>('risk');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter criteria
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterLocation, setFilterLocation] = useState('All');
  const [filterHealthBand, setFilterHealthBand] = useState('All');
  const [filterRiskLevel, setFilterRiskLevel] = useState('All');
  const [filterPMStatus, setFilterPMStatus] = useState('All');
  const [filterContract, setFilterContract] = useState('All');

  // Quick Alert Modal State
  const [selectedAssetForAlert, setSelectedAssetForAlert] = useState<Asset | null>(null);
  const [alertReason, setAlertReason] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<'critical' | 'high' | 'medium' | 'low'>('high');

  // Pagination
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Derived filter options
  const categories = useMemo(() => ['All', ...Array.from(new Set(assets.map((a) => a.category)))], [assets]);
  const locations = useMemo(() => ['All', ...Array.from(new Set(assets.map((a) => a.location)))], [assets]);

  // Filter and Sort Logic
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const matchSearch =
        !searchQuery.trim() ||
        asset.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCat = filterCategory === 'All' || asset.category === filterCategory;
      const matchLoc = filterLocation === 'All' || asset.location === filterLocation;

      const matchHealth =
        filterHealthBand === 'All' ||
        (filterHealthBand === 'healthy' && asset.healthScore >= 75) ||
        (filterHealthBand === 'at_risk' && asset.healthScore >= 50 && asset.healthScore < 75) ||
        (filterHealthBand === 'critical' && asset.healthScore < 50);

      const matchRisk = filterRiskLevel === 'All' || asset.riskLevel === filterRiskLevel;
      const matchPM = filterPMStatus === 'All' || asset.pmStatus === filterPMStatus;
      const matchContract = filterContract === 'All' || asset.contractStatus === filterContract;

      return matchSearch && matchCat && matchLoc && matchHealth && matchRisk && matchPM && matchContract;
    });
  }, [
    assets,
    searchQuery,
    filterCategory,
    filterLocation,
    filterHealthBand,
    filterRiskLevel,
    filterPMStatus,
    filterContract,
  ]);

  const sortedAssets = useMemo(() => {
    return [...filteredAssets].sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'health') comparison = a.healthScore - b.healthScore;
      else if (sortBy === 'risk') comparison = a.riskScore - b.riskScore;
      else if (sortBy === 'name') comparison = a.name.localeCompare(b.name);
      else if (sortBy === 'lastFault') comparison = a.lastFaultDate.localeCompare(b.lastFaultDate);
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }, [filteredAssets, sortBy, sortOrder]);

  const totalPages = Math.ceil(sortedAssets.length / pageSize) || 1;
  const paginatedAssets = sortedAssets.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const resetFilters = () => {
    setFilterCategory('All');
    setFilterLocation('All');
    setFilterHealthBand('All');
    setFilterRiskLevel('All');
    setFilterPMStatus('All');
    setFilterContract('All');
    setSearchQuery('');
  };

  const handleCreateQuickAlert = () => {
    if (!selectedAssetForAlert) return;
    addToast(
      `Custom ${alertSeverity.toUpperCase()} alert issued for ${selectedAssetForAlert.name}.`,
      'warning'
    );
    setSelectedAssetForAlert(null);
    setAlertReason('');
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <Card className="p-4 shadow-xs">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ID, name, location, category..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg pl-9 pr-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
            />
          </div>

          {/* Action buttons & View toggles */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
            <Button
              variant={showFilters ? 'secondary' : 'outline'}
              size="sm"
              icon={<Filter className="w-3.5 h-3.5" />}
              onClick={() => setShowFilters(!showFilters)}
            >
              <span>Filters</span>
              {(filterCategory !== 'All' ||
                filterLocation !== 'All' ||
                filterHealthBand !== 'All' ||
                filterRiskLevel !== 'All' ||
                filterPMStatus !== 'All' ||
                filterContract !== 'All') && (
                <span className="w-2 h-2 rounded-full bg-indigo-600 ml-1" />
              )}
            </Button>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, ord] = e.target.value.split('-') as [any, any];
                  setSortBy(field);
                  setSortOrder(ord);
                }}
                className="bg-transparent text-xs font-medium text-slate-700 focus:outline-none"
              >
                <option value="risk-desc">Risk (Highest First)</option>
                <option value="health-asc">Health (Lowest First)</option>
                <option value="health-desc">Health (Highest First)</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="lastFault-desc">Last Fault Date</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'table' ? 'bg-white shadow-2xs text-[#4F46E5]' : 'text-slate-500'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'grid' ? 'bg-white shadow-2xs text-[#4F46E5]' : 'text-slate-500'
                }`}
                title="Card Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Collapsible Filter Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 animate-in fade-in duration-150">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Category
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-800"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Location
              </label>
              <select
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-800"
              >
                {locations.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Health Band
              </label>
              <select
                value={filterHealthBand}
                onChange={(e) => setFilterHealthBand(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-800"
              >
                <option value="All">All Bands</option>
                <option value="healthy">Healthy (≥75)</option>
                <option value="at_risk">At Risk (50-74)</option>
                <option value="critical">Critical (&lt;50)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Risk Level
              </label>
              <select
                value={filterRiskLevel}
                onChange={(e) => setFilterRiskLevel(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-800"
              >
                <option value="All">All Risk</option>
                <option value="HIGH">HIGH (Risk ≥80)</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                PM Status
              </label>
              <select
                value={filterPMStatus}
                onChange={(e) => setFilterPMStatus(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-800"
              >
                <option value="All">All PM</option>
                <option value="ok">PM OK</option>
                <option value="due">PM Due</option>
                <option value="overdue">PM Overdue</option>
              </select>
            </div>

            <div className="flex flex-col justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                icon={<X className="w-3 h-3" />}
                className="text-xs"
              >
                Reset Filters
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Main Content: Table or Grid */}
      {paginatedAssets.length > 0 ? (
        viewMode === 'table' ? (
          <Card className="shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Asset ID</th>
                    <th className="py-3 px-4">Equipment Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Health</th>
                    <th className="py-3 px-4">Risk</th>
                    <th className="py-3 px-4">IoT Telemetry</th>
                    <th className="py-3 px-4">Last Fault</th>
                    <th className="py-3 px-4">PM Status</th>
                    <th className="py-3 px-4">Contract</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {paginatedAssets.map((asset) => (
                    <tr
                      key={asset.id}
                      className="hover:bg-indigo-50/30 transition-colors group"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        <Link
                          href={`/assets/${asset.id}`}
                          className="hover:text-[#4F46E5] hover:underline"
                        >
                          {asset.id}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <Link
                          href={`/assets/${asset.id}`}
                          className="hover:text-[#4F46E5]"
                        >
                          {asset.name}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                          {asset.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {asset.location}
                      </td>
                      <td className="py-3 px-4">
                        <HealthScoreBadge score={asset.healthScore} />
                      </td>
                      <td className="py-3 px-4">
                        <RiskPill risk={asset.riskLevel} />
                      </td>
                      <td className="py-3 px-4">
                        <IoTPill status={asset.iotStatus} />
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        <span className="font-semibold text-slate-800">
                          {asset.lastFaultCode}
                        </span>
                        <span className="text-slate-400 block text-[10px]">
                          {asset.lastFaultDate}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <PMPill status={asset.pmStatus} />
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase border ${
                            asset.contractStatus === 'CMC'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : asset.contractStatus === 'AMC'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {asset.contractStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/assets/${asset.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              icon={<Eye className="w-3.5 h-3.5" />}
                            >
                              View
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Bell className="w-3.5 h-3.5 text-slate-500" />}
                            onClick={() => setSelectedAssetForAlert(asset)}
                            title="Issue Quick Alert"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table Footer / Pagination */}
            <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span>Showing</span>
                <span className="font-bold text-slate-900">
                  {Math.min(sortedAssets.length, (currentPage - 1) * pageSize + 1)}–
                  {Math.min(sortedAssets.length, currentPage * pageSize)}
                </span>
                <span>of</span>
                <span className="font-bold text-slate-900">{sortedAssets.length}</span>
                <span>assets</span>

                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="ml-3 bg-white border border-slate-200 rounded px-2 py-1 text-xs"
                >
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                  <option value={100}>100 / page</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <span className="px-3 py-1 font-semibold text-slate-800">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          /* Card Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedAssets.map((asset) => (
              <Card
                key={asset.id}
                hoverable
                className="p-5 flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {asset.id}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-1.5">
                      {asset.name}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {asset.category} • {asset.location}
                    </p>
                  </div>
                  <RiskPill risk={asset.riskLevel} />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="space-y-1 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <IoTPill status={asset.iotStatus} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <PMPill status={asset.pmStatus} />
                    </div>
                  </div>

                  <div className="flex flex-col items-center">
                    <span className="text-xl font-black text-slate-800">
                      {asset.healthScore}
                    </span>
                    <span className="text-[10px] font-bold uppercase text-slate-400">
                      Health
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-mono">
                    Last: {asset.lastFaultCode} ({asset.lastFaultDate})
                  </span>
                  <Link href={`/assets/${asset.id}`}>
                    <Button variant="outline" size="sm" icon={<Eye className="w-3 h-3" />}>
                      Inspect
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : (
        <Card className="p-8">
          <EmptyState
            title="No Matching Assets Found"
            description="No equipment matched your active search query and filter criteria. Try loosening your filters."
            actionLabel="Reset Filters"
            onAction={resetFilters}
          />
        </Card>
      )}

      {/* Quick Alert Modal */}
      <Modal
        isOpen={!!selectedAssetForAlert}
        onClose={() => setSelectedAssetForAlert(null)}
        title="Issue Operational Alert"
        subtitle={selectedAssetForAlert?.name}
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Severity Level</label>
            <select
              value={alertSeverity}
              onChange={(e) => setAlertSeverity(e.target.value as any)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800"
            >
              <option value="critical">Critical (Immediate safety/shutdown risk)</option>
              <option value="high">High (Service degradation risk)</option>
              <option value="medium">Medium (Advisory observation)</option>
              <option value="low">Low (Routine log note)</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Observation & Diagnostic Reason</label>
            <textarea
              rows={3}
              value={alertReason}
              onChange={(e) => setAlertReason(e.target.value)}
              placeholder="Detail the anomalous observation, abnormal sound, physical vibration, or temperature discrepancy..."
              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedAssetForAlert(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateQuickAlert}>
              Dispatch Alert
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
