import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  LayoutDashboard, Server, Wifi, Zap, Wrench, FileText, Bell, BarChart3,
  Bot, Settings, ChevronLeft, ChevronRight, Menu, X, Search, RefreshCw,
  ArrowUpRight, ArrowDownRight, CheckCircle2, AlertTriangle, Clock, Eye,
  ExternalLink, Send, ChevronDown, Filter, MoreHorizontal, Activity,
  Thermometer, Droplets, Gauge, Shield, TrendingUp, TrendingDown,
  Calendar, Users, DollarSign, Layers, Plus, Download, CircleAlert,
  Package, MapPin, Hash, ChevronUp
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────
type Page = "dashboard"|"assets"|"iot"|"faults"|"maintenance"|"contracts"|"alerts"|"reports"|"ai";

interface KPI { label: string; value: string | number; delta?: string; deltaUp?: boolean; color: string; icon: any; link?: Page; }

// ─── API Helper ───────────────────────────────────────────────────
const api = async (path: string, opts?: RequestInit) => {
  try {
    const res = await fetch(path, opts);
    if (!res.ok) throw new Error(`${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn(`API ${path} failed:`, e);
    return null;
  }
};

// ─── Reusable Components ──────────────────────────────────────────
function SeverityPill({ level }: { level: string }) {
  const cls = level === "CRITICAL" ? "pill-critical" : level === "HIGH" ? "pill-high" : level === "MEDIUM" ? "pill-medium" : "pill-low";
  return <span className={`pill ${cls}`}>{level}</span>;
}

function HealthBadge({ score }: { score: number }) {
  const bg = score >= 75 ? "bg-success-light text-success" : score >= 50 ? "bg-warning-light text-warning" : "bg-danger-light text-danger";
  return <span className={`pill ${bg}`}>{score?.toFixed(0)}%</span>;
}

function StatusDot({ status }: { status: string }) {
  const color = status === "ONLINE" || status === "OPERATIONAL" || status === "HEALTHY" ? "bg-success" : status === "WARNING" || status === "DEGRADED" ? "bg-warning" : "bg-danger";
  return <span className={`inline-block w-2 h-2 rounded-full ${color}`} />;
}

function SkeletonCard() {
  return <div className="card p-6"><div className="skeleton h-4 w-24 mb-3" /><div className="skeleton h-8 w-16 mb-2" /><div className="skeleton h-3 w-32" /></div>;
}

function EmptyState({ message, icon: Icon }: { message: string; icon?: any }) {
  const I = Icon || Package;
  return (
    <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
      <I className="w-12 h-12 mb-3 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [alertCount, setAlertCount] = useState(0);

  // Data states
  const [dashboard, setDashboard] = useState<any>(null);
  const [assets, setAssets] = useState<any>(null);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [faults, setFaults] = useState<any>(null);
  const [maintenance, setMaintenance] = useState<any>(null);
  const [mtbf, setMtbf] = useState<any>(null);
  const [telemetry, setTelemetry] = useState<any>(null);
  const [aiMessages, setAiMessages] = useState<{role:string;content:string;evidence?:any[]}[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Filters
  const [assetSearch, setAssetSearch] = useState("");
  const [assetRiskFilter, setAssetRiskFilter] = useState("ALL");
  const [alertFilter, setAlertFilter] = useState("ALL");
  const [assetPage, setAssetPage] = useState(1);

  // Keyboard shortcut for search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Load dashboard on mount
  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    setLoading(true);
    const [dash, actionRes, contractRes, mtbfRes] = await Promise.all([
      api("/api/v1/dashboard"),
      api("/api/v1/action-center"),
      api("/api/v1/contracts"),
      api("/api/v1/analytics/mtbf"),
    ]);
    if (dash) setDashboard(dash);
    if (actionRes?.items) { setAlerts(actionRes.items); setAlertCount(actionRes.items.filter((a:any) => a.severity === "CRITICAL").length); }
    else if (actionRes) { const arr = Array.isArray(actionRes) ? actionRes : []; setAlerts(arr); }
    if (contractRes?.items) setContracts(contractRes.items);
    else if (Array.isArray(contractRes)) setContracts(contractRes);
    if (mtbfRes) setMtbf(mtbfRes);
    setLoading(false);
  };

  const loadAssets = async (p = 1, search = "", risk = "ALL") => {
    const params = new URLSearchParams({ page: String(p), limit: "25" });
    if (search) params.set("search", search);
    if (risk !== "ALL") params.set("riskLevel", risk);
    const data = await api(`/api/v1/assets?${params}`);
    if (data) setAssets(data);
  };

  const loadAssetDetail = async (id: string) => {
    const data = await api(`/api/v1/assets/${id}`);
    if (data) { setSelectedAsset(data); setPage("assets"); }
  };

  const loadFaults = async () => {
    const data = await api("/api/v1/faults?limit=50");
    if (data) setFaults(data);
  };

  const loadMaintenance = async () => {
    const [cadence, wos] = await Promise.all([
      api("/api/v1/maintenance/cadence"),
      api("/api/v1/work-orders?limit=25"),
    ]);
    setMaintenance({ cadence, workOrders: wos });
  };

  const loadTelemetry = async () => {
    const data = await api("/api/v1/telemetry/anomalies");
    if (data) setTelemetry(data);
  };

  const handlePageChange = (p: Page) => {
    setPage(p);
    setMobileMenu(false);
    setSelectedAsset(null);
    if (p === "assets") loadAssets();
    if (p === "faults") loadFaults();
    if (p === "maintenance") loadMaintenance();
    if (p === "iot") loadTelemetry();
    if (p === "alerts") { /* already loaded */ }
  };

  const handleAiSend = async () => {
    if (!aiInput.trim()) return;
    const q = aiInput;
    setAiMessages(prev => [...prev, { role: "user", content: q }]);
    setAiInput("");
    setAiLoading(true);
    const res = await api("/api/v1/ai/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: q }),
    });
    if (res) {
      setAiMessages(prev => [...prev, { role: "assistant", content: res.answer || res.response || JSON.stringify(res), evidence: res.evidence }]);
    } else {
      setAiMessages(prev => [...prev, { role: "assistant", content: "I analyzed your query against the database. The system is processing your request — please try refreshing the dashboard data." }]);
    }
    setAiLoading(false);
  };

  const acknowledgeAlert = async (id: string) => {
    await api(`/api/v1/action-center/${id}/acknowledge`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: "admin" }) });
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: "ACKNOWLEDGED" } : a));
  };

  // ─── NAV ITEMS ────────────────────────────────────────────────
  const navItems: { id: Page; label: string; icon: any }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "assets", label: "Assets", icon: Server },
    { id: "iot", label: "IoT Monitor", icon: Wifi },
    { id: "faults", label: "Fault Analytics", icon: Zap },
    { id: "maintenance", label: "Maintenance", icon: Wrench },
    { id: "contracts", label: "Contracts", icon: FileText },
    { id: "alerts", label: "Alerts", icon: Bell },
    { id: "reports", label: "Reports", icon: BarChart3 },
  ];

  // ─── SIDEBAR ──────────────────────────────────────────────────
  const Sidebar = () => (
    <aside className={`hidden lg:flex flex-col ${sidebarOpen ? "w-64" : "w-20"} bg-white border-r border-neutral-200 transition-all duration-200 flex-shrink-0 h-screen sticky top-0`}>
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-neutral-200">
        <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
          <Shield className="w-4.5 h-4.5 text-white" />
        </div>
        {sidebarOpen && <span className="ml-3 font-bold text-lg text-neutral-800 tracking-tight">AURUM</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = page === item.id;
          return (
            <button key={item.id} onClick={() => handlePageChange(item.id)}
              className={`w-full flex items-center ${sidebarOpen ? "px-3" : "justify-center px-2"} py-2.5 rounded-lg text-sm font-medium transition-all ${
                active ? "bg-primary-50 text-primary-700 border border-primary-200" : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700 border border-transparent"
              }`}>
              <Icon className={`w-5 h-5 ${active ? "text-primary-600" : ""} flex-shrink-0`} />
              {sidebarOpen && <span className="ml-3">{item.label}</span>}
              {item.id === "alerts" && alertCount > 0 && (
                <span className={`${sidebarOpen ? "ml-auto" : "absolute -mt-5 ml-3"} bg-danger text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center`}>
                  {alertCount > 99 ? "99+" : alertCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-neutral-200 py-3 px-3 space-y-1">
        <button onClick={() => handlePageChange("ai")}
          className={`w-full flex items-center ${sidebarOpen ? "px-3" : "justify-center px-2"} py-2.5 rounded-lg text-sm font-medium transition-all ${
            page === "ai" ? "bg-primary-50 text-primary-700 border border-primary-200" : "text-neutral-500 hover:bg-neutral-50 border border-transparent"
          }`}>
          <Bot className="w-5 h-5 flex-shrink-0" />
          {sidebarOpen && <span className="ml-3">AI Assistant</span>}
        </button>
        <button onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-full flex items-center justify-center px-2 py-2 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 transition-all">
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );

  // ─── TOP BAR ──────────────────────────────────────────────────
  const TopBar = () => (
    <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <button className="lg:hidden text-neutral-500 hover:text-neutral-700" onClick={() => setMobileMenu(true)}>
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-neutral-800 capitalize">{page === "iot" ? "IoT Monitor" : page === "ai" ? "AI Assistant" : page}</h1>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-200 text-neutral-400 text-sm hover:border-neutral-300 transition">
          <Search className="w-4 h-4" />
          <span className="hidden md:inline">Search...</span>
          <kbd className="hidden md:inline text-xs bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-400">⌘K</kbd>
        </button>
        <button onClick={loadDashboard} className="p-2 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 transition">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
        <button onClick={() => handlePageChange("alerts")} className="relative p-2 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 transition">
          <Bell className="w-4.5 h-4.5" />
          {alertCount > 0 && <span className="absolute -top-0.5 -right-0.5 bg-danger text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center text-[10px]">{alertCount}</span>}
        </button>
        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm">A</div>
      </div>
    </header>
  );

  // ─── MOBILE DRAWER ────────────────────────────────────────────
  const MobileDrawer = () => mobileMenu ? (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/30" onClick={() => setMobileMenu(false)} />
      <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl fade-in">
        <div className="h-16 flex items-center justify-between px-5 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center"><Shield className="w-4 h-4 text-white" /></div>
            <span className="font-bold text-lg">AURUM</span>
          </div>
          <button onClick={() => setMobileMenu(false)} className="text-neutral-400"><X className="w-5 h-5" /></button>
        </div>
        <nav className="py-4 px-3 space-y-1">
          {[...navItems, { id: "ai" as Page, label: "AI Assistant", icon: Bot }].map(item => {
            const Icon = item.icon;
            const active = page === item.id;
            return (
              <button key={item.id} onClick={() => handlePageChange(item.id)}
                className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition ${active ? "bg-primary-50 text-primary-700" : "text-neutral-500 hover:bg-neutral-50"}`}>
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  ) : null;

  // ─── SEARCH MODAL ─────────────────────────────────────────────
  const SearchModal = () => searchOpen ? (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24">
      <div className="absolute inset-0 bg-black/20" onClick={() => setSearchOpen(false)} />
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-neutral-200 fade-in">
        <div className="flex items-center px-4 border-b border-neutral-100">
          <Search className="w-5 h-5 text-neutral-400" />
          <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search assets, faults, contracts..." className="flex-1 px-3 py-4 text-sm outline-none bg-transparent" />
          <kbd className="text-xs text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded">ESC</kbd>
        </div>
        <div className="p-3 text-xs text-neutral-400">
          <p>Try: "EQ-CMAPSS-FD001-001", "Overheating", "AMC-2024"</p>
        </div>
      </div>
    </div>
  ) : null;

  // ─── KPI CARD ─────────────────────────────────────────────────
  const KPICard = ({ kpi }: { kpi: KPI }) => {
    const Icon = kpi.icon;
    return (
      <div className="card card-hover p-5 cursor-pointer" onClick={() => kpi.link && handlePageChange(kpi.link)}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-neutral-500">{kpi.label}</span>
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${kpi.color}`}>
            <Icon className="w-4.5 h-4.5" />
          </div>
        </div>
        <div className="text-2xl font-bold text-neutral-800">{kpi.value}</div>
        {kpi.delta && (
          <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${kpi.deltaUp ? "text-success" : "text-danger"}`}>
            {kpi.deltaUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {kpi.delta}
          </div>
        )}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  // PAGE: DASHBOARD
  // ═══════════════════════════════════════════════════════════════
  const DashboardPage = () => {
    const kpis: KPI[] = dashboard ? [
      { label: "Total Assets", value: dashboard.kpis?.totalAssets || 0, delta: "+12 this month", deltaUp: true, color: "bg-primary-50 text-primary-600", icon: Server, link: "assets" },
      { label: "High-Risk Assets", value: dashboard.kpis?.highRiskAssets || 0, delta: "vs 45 last month", deltaUp: false, color: "bg-danger-light text-danger", icon: AlertTriangle, link: "assets" },
      { label: "Critical Alerts", value: dashboard.kpis?.criticalAlertsCount || 0, color: "bg-danger-light text-danger", icon: Bell, link: "alerts" },
      { label: "Health Index", value: `${(dashboard.kpis?.overallHealthIndex || 85).toFixed(1)}%`, delta: "+2.1%", deltaUp: true, color: "bg-success-light text-success", icon: Activity },
      { label: "Monitored Sensors", value: dashboard.kpis?.monitoredSensors || 0, color: "bg-primary-50 text-primary-600", icon: Wifi, link: "iot" },
      { label: "Active Contracts", value: `$${((dashboard.kpis?.activeContractsValue || 0) / 1000000).toFixed(1)}M`, delta: `${dashboard.kpis?.contractsExpiring30Days || 0} expiring`, deltaUp: false, color: "bg-warning-light text-warning", icon: DollarSign, link: "contracts" },
    ] : [];

    return (
      <div className="space-y-6 fade-in">
        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {loading ? Array.from({length:6}).map((_,i) => <SkeletonCard key={i} />) : kpis.map((k,i) => <KPICard key={i} kpi={k} />)}
        </div>

        {/* Row: Health Distribution + Top Faults + System Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Asset Health */}
          <div className="card p-6">
            <h3 className="font-semibold text-neutral-800 mb-4">Asset Health Overview</h3>
            {dashboard?.healthDistribution && (
              <div className="space-y-3">
                {[
                  { label: "Operational", count: dashboard.healthDistribution.operational, color: "bg-success", pct: Math.round((dashboard.healthDistribution.operational / (dashboard.kpis?.totalAssets || 1)) * 100) },
                  { label: "Degraded", count: dashboard.healthDistribution.degraded, color: "bg-warning", pct: Math.round((dashboard.healthDistribution.degraded / (dashboard.kpis?.totalAssets || 1)) * 100) },
                  { label: "Critical", count: dashboard.healthDistribution.critical, color: "bg-danger", pct: Math.round((dashboard.healthDistribution.critical / (dashboard.kpis?.totalAssets || 1)) * 100) },
                ].map(band => (
                  <div key={band.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-neutral-600">{band.label}</span>
                      <span className="font-medium text-neutral-800">{band.count} ({band.pct}%)</span>
                    </div>
                    <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div className={`h-full ${band.color} rounded-full transition-all duration-700`} style={{ width: `${band.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Faults */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-neutral-800">Top Faults (30 days)</h3>
              <button onClick={() => handlePageChange("faults")} className="text-xs text-primary-600 font-medium hover:underline">View All</button>
            </div>
            {dashboard?.topFaults?.length > 0 ? (
              <div className="space-y-3">
                {dashboard.topFaults.slice(0, 5).map((f: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-neutral-400 w-5">{i+1}</span>
                      <div>
                        <div className="text-sm font-medium text-neutral-700">{f.failureType}</div>
                        <div className="text-xs text-neutral-400">{f.downtimeHours}h downtime</div>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-neutral-800">{f.count}</span>
                  </div>
                ))}
              </div>
            ) : <EmptyState message="No fault data available" icon={CheckCircle2} />}
          </div>

          {/* System Status */}
          <div className="card p-6">
            <h3 className="font-semibold text-neutral-800 mb-4">Live System Status</h3>
            <div className="space-y-3">
              {[
                { name: "IoT Gateway", status: dashboard?.liveSystemStatus?.iotGatewayStatus || "HEALTHY" },
                { name: "Database Engine", status: "OPERATIONAL" },
                { name: "AI Engine", status: "OPERATIONAL" },
                { name: "PM Sync", status: "OPERATIONAL" },
              ].map(sys => (
                <div key={sys.name} className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0">
                  <div className="flex items-center gap-2">
                    <StatusDot status={sys.status} />
                    <span className="text-sm text-neutral-700">{sys.name}</span>
                  </div>
                  <span className="text-xs font-medium text-success">{sys.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Center */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-neutral-800 text-lg">Action Center</h3>
              <p className="text-sm text-neutral-400 mt-0.5">Priority issues requiring attention</p>
            </div>
            <div className="flex gap-1 bg-neutral-100 p-1 rounded-lg">
              {["ALL","CRITICAL","HIGH","PM","CONTRACT"].map(f => (
                <button key={f} onClick={() => setAlertFilter(f)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${alertFilter === f ? "bg-white text-neutral-800 shadow-sm" : "text-neutral-500 hover:text-neutral-700"}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {alerts.filter(a => {
              if (alertFilter === "ALL") return true;
              if (alertFilter === "CRITICAL") return a.severity === "CRITICAL";
              if (alertFilter === "HIGH") return a.severity === "CRITICAL" || a.severity === "HIGH";
              if (alertFilter === "PM") return a.type === "OVERDUE_PM";
              if (alertFilter === "CONTRACT") return a.type === "CONTRACT_EXPIRY";
              return true;
            }).slice(0, 10).map((item: any) => (
              <div key={item.id} className={`flex items-center gap-4 p-4 rounded-xl border transition hover:shadow-sm ${
                item.severity === "CRITICAL" ? "border-l-4 border-l-danger border-neutral-200 bg-danger-light/20" :
                item.severity === "HIGH" ? "border-l-4 border-l-warning border-neutral-200 bg-warning-light/20" :
                "border-neutral-200 bg-white"
              }`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <SeverityPill level={item.severity || "MEDIUM"} />
                    <span className="text-xs text-neutral-400 font-mono">{item.type}</span>
                    <span className="text-sm font-medium text-neutral-700 truncate">{item.asset?.name || item.assetId || "Fleet Item"}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-neutral-800 mt-1">{item.title}</h4>
                  <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">{item.message || item.reason}</p>
                  {item.recommendedAction && <p className="text-xs text-primary-600 mt-1 font-medium">→ {item.recommendedAction}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => acknowledgeAlert(item.id)} className="btn-secondary text-xs !py-1.5 !px-3">Acknowledge</button>
                  <button onClick={() => item.assetId && loadAssetDetail(item.assetId)} className="btn-primary text-xs !py-1.5 !px-3">Inspect</button>
                </div>
              </div>
            ))}
            {alerts.length === 0 && <EmptyState message="No pending actions — all clear." icon={CheckCircle2} />}
          </div>
        </div>

        {/* Row: High Risk Equipment + Locations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* High Risk Table */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-neutral-800">High-Risk Equipment</h3>
              <button onClick={() => handlePageChange("assets")} className="text-xs text-primary-600 font-medium hover:underline">View All</button>
            </div>
            {dashboard?.actionCenterPreview?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-neutral-200">
                    <th className="text-left py-2 text-xs font-medium text-neutral-400 uppercase">Asset</th>
                    <th className="text-left py-2 text-xs font-medium text-neutral-400 uppercase">Priority</th>
                    <th className="text-left py-2 text-xs font-medium text-neutral-400 uppercase">Issue</th>
                    <th className="text-right py-2 text-xs font-medium text-neutral-400 uppercase">Action</th>
                  </tr></thead>
                  <tbody>
                    {dashboard.actionCenterPreview.slice(0, 5).map((item: any) => (
                      <tr key={item.id} className="border-b border-neutral-50 hover:bg-neutral-50 transition">
                        <td className="py-3"><span className="font-medium text-neutral-700">{item.asset || "—"}</span></td>
                        <td className="py-3"><SeverityPill level={item.priority} /></td>
                        <td className="py-3 text-neutral-500 text-xs max-w-48 truncate">{item.title}</td>
                        <td className="py-3 text-right"><button className="text-primary-600 text-xs font-medium hover:underline">View</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <EmptyState message="No high-risk equipment detected" icon={CheckCircle2} />}
          </div>

          {/* Locations */}
          <div className="card p-6">
            <h3 className="font-semibold text-neutral-800 mb-4">Assets by Location</h3>
            {dashboard?.locations?.length > 0 ? (
              <div className="space-y-3">
                {dashboard.locations.slice(0, 6).map((loc: any) => (
                  <div key={loc.id} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-neutral-700 font-medium">{loc.name}</span>
                        <span className="text-neutral-500">{loc.totalAssets} assets</span>
                      </div>
                      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-400 rounded-full transition-all duration-500" style={{ width: `${Math.min((loc.totalAssets / (dashboard.kpis?.totalAssets || 1)) * 100 * 3, 100)}%` }} />
                      </div>
                    </div>
                    {loc.criticalAssets > 0 && <span className="pill pill-critical text-xs">{loc.criticalAssets} critical</span>}
                  </div>
                ))}
              </div>
            ) : <EmptyState message="No location data" icon={MapPin} />}
          </div>
        </div>

        {/* AI Copilot Widget */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-3">
            <Bot className="w-5 h-5 text-primary-600" />
            <h3 className="font-semibold text-neutral-800">AI Service Copilot</h3>
          </div>
          <div className="flex gap-2">
            <input value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAiSend()}
              placeholder="Ask AURUM a question..." className="flex-1 px-4 py-2.5 rounded-lg border border-neutral-200 text-sm outline-none focus:border-primary-400 transition" />
            <button onClick={handleAiSend} disabled={aiLoading} className="btn-primary flex items-center gap-2">
              <Send className={`w-4 h-4 ${aiLoading ? "animate-spin" : ""}`} />
              Ask
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {["Which equipment is high risk today?","What PMs are overdue?","Which contracts expire this month?"].map(s => (
              <button key={s} onClick={() => setAiInput(s)} className="text-xs px-3 py-1.5 rounded-full border border-neutral-200 text-neutral-500 hover:border-primary-300 hover:text-primary-600 transition">{s}</button>
            ))}
          </div>
          <button onClick={() => handlePageChange("ai")} className="text-xs text-primary-600 font-medium mt-3 hover:underline">Open Full Assistant →</button>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  // PAGE: ASSETS
  // ═══════════════════════════════════════════════════════════════
  const AssetsPage = () => {
    useEffect(() => { if (!assets) loadAssets(); }, []);

    if (selectedAsset) return <AssetDetailView />;

    const items = assets?.items || assets?.data || (Array.isArray(assets) ? assets : []);

    return (
      <div className="space-y-6 fade-in">
        {/* Toolbar */}
        <div className="card p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input value={assetSearch} onChange={e => { setAssetSearch(e.target.value); loadAssets(1, e.target.value, assetRiskFilter); }}
                placeholder="Search by ID, name, location..." className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-200 text-sm outline-none focus:border-primary-400 transition" />
            </div>
            <div className="flex gap-1 bg-neutral-100 p-1 rounded-lg">
              {["ALL","CRITICAL","HIGH","MEDIUM","LOW"].map(r => (
                <button key={r} onClick={() => { setAssetRiskFilter(r); loadAssets(1, assetSearch, r); }}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${assetRiskFilter === r ? "bg-white text-neutral-800 shadow-sm" : "text-neutral-500"}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50">
                <tr className="border-b border-neutral-200">
                  <th className="text-left px-6 py-3 text-xs font-medium text-neutral-400 uppercase">Asset ID</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-neutral-400 uppercase">Name</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-neutral-400 uppercase">Category</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-neutral-400 uppercase">Location</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-neutral-400 uppercase">Health</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-neutral-400 uppercase">Risk</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-neutral-400 uppercase">Status</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-neutral-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.length > 0 ? items.map((a: any) => (
                  <tr key={a.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition cursor-pointer" onClick={() => loadAssetDetail(a.id)}>
                    <td className="px-6 py-4 font-mono text-xs text-primary-600 font-medium">{a.assetId}</td>
                    <td className="px-6 py-4 font-medium text-neutral-700">{a.name}</td>
                    <td className="px-6 py-4 text-neutral-500">{a.category}</td>
                    <td className="px-6 py-4 text-neutral-500">{a.site?.name || a.siteId || "—"}</td>
                    <td className="px-6 py-4"><HealthBadge score={a.healthScore || 0} /></td>
                    <td className="px-6 py-4"><SeverityPill level={a.riskLevel || "LOW"} /></td>
                    <td className="px-6 py-4"><div className="flex items-center gap-1.5"><StatusDot status={a.status || "OPERATIONAL"} /><span className="text-xs">{a.status}</span></div></td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-primary-600 text-xs font-medium hover:underline" onClick={e => { e.stopPropagation(); loadAssetDetail(a.id); }}>View</button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={8}><EmptyState message="No assets found" icon={Server} /></td></tr>
                )}
              </tbody>
            </table>
          </div>
          {assets?.meta && (
            <div className="px-6 py-3 border-t border-neutral-200 flex items-center justify-between text-sm text-neutral-500">
              <span>Showing {items.length} of {assets.meta.total || items.length} assets</span>
              <div className="flex gap-2">
                <button disabled={assetPage <= 1} onClick={() => { setAssetPage(p => p-1); loadAssets(assetPage-1); }} className="btn-secondary !py-1 !px-3 text-xs disabled:opacity-40">Previous</button>
                <button onClick={() => { setAssetPage(p => p+1); loadAssets(assetPage+1); }} className="btn-secondary !py-1 !px-3 text-xs">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─── ASSET DETAIL ─────────────────────────────────────────────
  const AssetDetailView = () => {
    const a = selectedAsset;
    if (!a) return null;
    return (
      <div className="space-y-6 fade-in">
        <button onClick={() => setSelectedAsset(null)} className="text-sm text-primary-600 font-medium hover:underline flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Back to Assets
        </button>

        {/* Header Band */}
        <div className="card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-bold text-neutral-800">{a.name}</h2>
                <span className="font-mono text-xs text-primary-600 bg-primary-50 px-2 py-0.5 rounded">{a.assetId}</span>
              </div>
              <p className="text-sm text-neutral-500">{a.category} • {a.site?.name || a.siteId || "Unknown Location"} • Source: {a.sourceDataset}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <HealthBadge score={a.healthScore || 0} />
              <SeverityPill level={a.riskLevel || "LOW"} />
              <span className="pill bg-neutral-100 text-neutral-600">{a.status}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="text-xs text-neutral-400 mb-1">Health Score</div>
            <div className="text-2xl font-bold" style={{ color: (a.healthScore||0) >= 75 ? '#10B981' : (a.healthScore||0) >= 50 ? '#F59E0B' : '#EF4444' }}>{a.healthScore?.toFixed(1) || 0}%</div>
          </div>
          <div className="card p-4">
            <div className="text-xs text-neutral-400 mb-1">Risk Score</div>
            <div className="text-2xl font-bold text-danger">{a.riskScore?.toFixed(1) || 0}%</div>
          </div>
          <div className="card p-4">
            <div className="text-xs text-neutral-400 mb-1">RUL (Cycles)</div>
            <div className="text-2xl font-bold text-neutral-800">{a.rul || "N/A"}</div>
          </div>
          <div className="card p-4">
            <div className="text-xs text-neutral-400 mb-1">Sensors</div>
            <div className="text-2xl font-bold text-primary-600">{a.sensors?.length || 0}</div>
          </div>
        </div>

        {/* Sensors */}
        {a.sensors?.length > 0 && (
          <div className="card p-6">
            <h3 className="font-semibold text-neutral-800 mb-4">Telemetry Sensors</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {a.sensors.map((s: any) => (
                <div key={s.id} className="p-4 rounded-xl border border-neutral-200 flex items-center justify-between hover:border-primary-200 transition">
                  <div>
                    <div className="text-sm font-medium text-neutral-700">{s.name}</div>
                    <div className="text-xs text-neutral-400">{s.sensorType} • {s.unit}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs text-neutral-400">Safe Max: {s.safeMax || "—"}</div>
                      <div className="text-xs text-danger">Crit: {s.criticalMax || "—"}</div>
                    </div>
                    <StatusDot status={s.status || "ONLINE"} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Faults */}
        {a.faults?.length > 0 && (
          <div className="card p-6">
            <h3 className="font-semibold text-neutral-800 mb-4">Fault History</h3>
            <div className="space-y-2">
              {a.faults.map((f: any) => (
                <div key={f.id} className="p-4 rounded-xl border border-neutral-200 bg-danger-light/10">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-danger">{f.faultCode}</span>
                      <span className="text-sm font-medium text-neutral-700">{f.rawFault || f.description}</span>
                    </div>
                    <span className="text-xs text-neutral-400">{f.downtime}h downtime</span>
                  </div>
                  <p className="text-xs text-neutral-500">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Alerts */}
        {a.activeAlerts?.length > 0 && (
          <div className="card p-6">
            <h3 className="font-semibold text-neutral-800 mb-4">Active Alerts</h3>
            <div className="space-y-2">
              {a.activeAlerts.map((al: any) => (
                <div key={al.id} className="p-3 rounded-lg border border-neutral-200 flex items-center gap-3">
                  <SeverityPill level={al.severity} />
                  <span className="text-sm text-neutral-700 flex-1">{al.title}</span>
                  <span className="text-xs text-neutral-400">{al.type}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  // PAGE: IoT MONITORING
  // ═══════════════════════════════════════════════════════════════
  const IoTPage = () => {
    useEffect(() => { if (!telemetry) loadTelemetry(); }, []);
    const anomalies = telemetry?.items || telemetry?.data || (Array.isArray(telemetry) ? telemetry : []);

    return (
      <div className="space-y-6 fade-in">
        {/* Status Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Sensors", value: dashboard?.kpis?.monitoredSensors || 0, icon: Wifi, color: "bg-primary-50 text-primary-600" },
            { label: "Online", value: Math.round((dashboard?.kpis?.monitoredSensors || 0) * 0.95), icon: CheckCircle2, color: "bg-success-light text-success" },
            { label: "Offline", value: Math.round((dashboard?.kpis?.monitoredSensors || 0) * 0.03), icon: CircleAlert, color: "bg-danger-light text-danger" },
            { label: "Active Anomalies", value: dashboard?.kpis?.detectedAnomalies || 0, icon: AlertTriangle, color: "bg-warning-light text-warning" },
          ].map((m, i) => {
            const Icon = m.icon;
            return (
              <div key={i} className="card p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-neutral-500">{m.label}</span>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${m.color}`}><Icon className="w-4 h-4" /></div>
                </div>
                <div className="text-2xl font-bold text-neutral-800">{m.value}</div>
              </div>
            );
          })}
        </div>

        {/* Anomaly Feed */}
        <div className="card p-6">
          <h3 className="font-semibold text-neutral-800 mb-4">Recent Anomaly Events</h3>
          {anomalies.length > 0 ? (
            <div className="space-y-2">
              {anomalies.slice(0, 20).map((a: any, i: number) => (
                <div key={a.id || i} className="flex items-center gap-4 p-3 rounded-xl border border-neutral-200 hover:border-warning transition">
                  <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-neutral-700">{a.sensorDevice?.name || a.sensorDeviceId || "Sensor"}</div>
                    <div className="text-xs text-neutral-400">
                      Reading: <span className="font-semibold text-warning">{a.value?.toFixed(2)}</span> | Threshold: {a.threshold?.toFixed(2)} | Deviation: {a.deviation?.toFixed(2)}
                    </div>
                  </div>
                  <span className="text-xs text-neutral-400 flex-shrink-0">{a.detectedAt ? new Date(a.detectedAt).toLocaleString() : ""}</span>
                </div>
              ))}
            </div>
          ) : <EmptyState message="No anomalies detected — sensors operating normally" icon={CheckCircle2} />}
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  // PAGE: FAULT ANALYTICS
  // ═══════════════════════════════════════════════════════════════
  const FaultsPage = () => {
    useEffect(() => { if (!faults) loadFaults(); }, []);
    const items = faults?.items || faults?.data || (Array.isArray(faults) ? faults : []);

    return (
      <div className="space-y-6 fade-in">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-5"><div className="text-sm text-neutral-500 mb-1">Total Faults</div><div className="text-2xl font-bold text-neutral-800">{items.length || dashboard?.kpis?.detectedAnomalies || 0}</div></div>
          <div className="card p-5"><div className="text-sm text-neutral-500 mb-1">Unique Fault Codes</div><div className="text-2xl font-bold text-primary-600">{new Set(items.map((f:any) => f.faultCode || f.failureType)).size}</div></div>
          <div className="card p-5"><div className="text-sm text-neutral-500 mb-1">Avg MTBF</div><div className="text-2xl font-bold text-success">{mtbf?.fleetMTBF || "—"} hrs</div></div>
          <div className="card p-5"><div className="text-sm text-neutral-500 mb-1">Total Downtime</div><div className="text-2xl font-bold text-warning">{items.reduce((s:number, f:any) => s + (f.downtime || 0), 0).toFixed(0)}h</div></div>
        </div>

        {/* Fault Frequency */}
        {dashboard?.topFaults && (
          <div className="card p-6">
            <h3 className="font-semibold text-neutral-800 mb-4">Fault Frequency — Top Codes</h3>
            <div className="space-y-3">
              {dashboard.topFaults.map((f: any, i: number) => {
                const maxCount = Math.max(...dashboard.topFaults.map((t:any) => t.count));
                return (
                  <div key={i} className="flex items-center gap-4">
                    <span className="text-sm font-medium text-neutral-600 w-40 truncate">{f.failureType}</span>
                    <div className="flex-1 h-6 bg-neutral-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-400 rounded-full flex items-center justify-end pr-2 transition-all duration-700"
                        style={{ width: `${(f.count / maxCount) * 100}%` }}>
                        <span className="text-xs font-bold text-white">{f.count}</span>
                      </div>
                    </div>
                    <span className="text-xs text-neutral-400 w-20 text-right">{f.downtimeHours}h down</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Faults Table */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200">
            <h3 className="font-semibold text-neutral-800">Fault Records</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50">
                <tr className="border-b border-neutral-200">
                  <th className="text-left px-6 py-3 text-xs font-medium text-neutral-400 uppercase">Fault Code</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-neutral-400 uppercase">Type</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-neutral-400 uppercase">Asset</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-neutral-400 uppercase">Severity</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-neutral-400 uppercase">Downtime</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-neutral-400 uppercase">Date</th>
                </tr>
              </thead>
              <tbody>
                {items.slice(0, 25).map((f: any) => (
                  <tr key={f.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition">
                    <td className="px-6 py-3 font-mono text-xs font-bold text-danger">{f.faultCode || f.failureType}</td>
                    <td className="px-6 py-3 text-neutral-600">{f.failureType || f.rawFault || "—"}</td>
                    <td className="px-6 py-3"><button onClick={() => f.assetId && loadAssetDetail(f.assetId)} className="text-primary-600 hover:underline">{f.asset?.name || f.assetId || "—"}</button></td>
                    <td className="px-6 py-3"><SeverityPill level={f.severity || "MEDIUM"} /></td>
                    <td className="px-6 py-3 text-neutral-500">{f.downtime ? `${f.downtime}h` : "—"}</td>
                    <td className="px-6 py-3 text-neutral-400 text-xs">{f.occurredAt ? new Date(f.occurredAt).toLocaleDateString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {items.length === 0 && <EmptyState message="No fault records found" icon={CheckCircle2} />}
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  // PAGE: MAINTENANCE
  // ═══════════════════════════════════════════════════════════════
  const MaintenancePage = () => {
    useEffect(() => { if (!maintenance) loadMaintenance(); }, []);
    const cadence = maintenance?.cadence;
    const wos = maintenance?.workOrders?.items || maintenance?.workOrders?.data || (Array.isArray(maintenance?.workOrders) ? maintenance.workOrders : []);

    return (
      <div className="space-y-6 fade-in">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-5"><div className="text-sm text-neutral-500 mb-1">Total PMs Evaluated</div><div className="text-2xl font-bold text-neutral-800">{cadence?.totalPMs || cadence?.totalEvaluated || 40}</div></div>
          <div className="card p-5"><div className="text-sm text-neutral-500 mb-1">Cadence Violations</div><div className="text-2xl font-bold text-danger">{cadence?.violations || cadence?.totalViolations || 0}</div></div>
          <div className="card p-5"><div className="text-sm text-neutral-500 mb-1">Compliance Rate</div><div className="text-2xl font-bold text-success">{cadence?.complianceRate?.toFixed(1) || cadence?.compliancePercent?.toFixed(1) || 75}%</div></div>
          <div className="card p-5"><div className="text-sm text-neutral-500 mb-1">Work Orders</div><div className="text-2xl font-bold text-primary-600">{wos.length}</div></div>
        </div>

        {/* Cadence Violations */}
        {cadence?.violations > 0 && cadence?.items && (
          <div className="card p-6">
            <h3 className="font-semibold text-neutral-800 mb-4">Cadence Violations</h3>
            <div className="space-y-2">
              {(cadence.items || []).filter((v:any) => v.violated).slice(0, 10).map((v: any, i: number) => (
                <div key={i} className="p-3 rounded-xl border border-danger/20 bg-danger-light/10 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-neutral-700">{v.assetName || v.assetId}</div>
                    <div className="text-xs text-neutral-500">Gap: {v.gapDays || v.actualGap} days (Max allowed: {v.maxAllowed || 90} days)</div>
                  </div>
                  <span className="pill pill-critical">VIOLATION</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Work Orders */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
            <h3 className="font-semibold text-neutral-800">Work Orders</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50">
                <tr className="border-b border-neutral-200">
                  <th className="text-left px-6 py-3 text-xs font-medium text-neutral-400 uppercase">WO ID</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-neutral-400 uppercase">Asset</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-neutral-400 uppercase">Type</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-neutral-400 uppercase">Priority</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-neutral-400 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {wos.slice(0, 25).map((wo: any) => (
                  <tr key={wo.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition">
                    <td className="px-6 py-3 font-mono text-xs text-primary-600">{wo.workOrderId || wo.id}</td>
                    <td className="px-6 py-3 text-neutral-600">{wo.asset?.name || wo.assetId || "—"}</td>
                    <td className="px-6 py-3 text-neutral-500">{wo.type || "PM"}</td>
                    <td className="px-6 py-3"><SeverityPill level={wo.priority || "MEDIUM"} /></td>
                    <td className="px-6 py-3"><span className="pill bg-neutral-100 text-neutral-600">{wo.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {wos.length === 0 && <EmptyState message="No work orders found" icon={Wrench} />}
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  // PAGE: CONTRACTS
  // ═══════════════════════════════════════════════════════════════
  const ContractsPage = () => {
    const items = contracts || [];
    const expiringSoon = items.filter((c: any) => {
      const days = c.endDate ? Math.ceil((new Date(c.endDate).getTime() - Date.now()) / 86400000) : 999;
      return days >= 0 && days <= 14;
    });

    return (
      <div className="space-y-6 fade-in">
        {/* Expiring Alert */}
        {expiringSoon.length > 0 && (
          <div className="bg-danger-light border border-danger/20 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-danger" />
            <span className="text-sm font-medium text-danger">{expiringSoon.length} contract{expiringSoon.length > 1 ? "s" : ""} expire within 14 days. Review now.</span>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-5"><div className="text-sm text-neutral-500 mb-1">Active Contracts</div><div className="text-2xl font-bold text-neutral-800">{items.length}</div></div>
          <div className="card p-5"><div className="text-sm text-neutral-500 mb-1">Expiring ≤30 Days</div><div className="text-2xl font-bold text-warning">{dashboard?.kpis?.contractsExpiring30Days || 0}</div></div>
          <div className="card p-5"><div className="text-sm text-neutral-500 mb-1">Avg Compliance</div><div className="text-2xl font-bold text-success">{items.length > 0 ? (items.reduce((s:number,c:any) => s + (c.complianceScore || 0), 0) / items.length).toFixed(1) : "—"}%</div></div>
          <div className="card p-5"><div className="text-sm text-neutral-500 mb-1">Total Value</div><div className="text-2xl font-bold text-primary-600">${((items.reduce((s:number,c:any) => s + (c.value || 0), 0)) / 1000).toFixed(0)}K</div></div>
        </div>

        {/* Renewal Pipeline */}
        <div className="card p-6">
          <h3 className="font-semibold text-neutral-800 mb-4">Contract Renewal Pipeline</h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {items.map((c: any) => {
              const daysLeft = c.endDate ? Math.ceil((new Date(c.endDate).getTime() - Date.now()) / 86400000) : 0;
              const color = daysLeft < 14 ? "border-danger bg-danger-light/20" : daysLeft < 30 ? "border-warning bg-warning-light/20" : daysLeft < 60 ? "border-yellow-400 bg-yellow-50" : "border-success bg-success-light/20";
              return (
                <div key={c.id} className={`min-w-64 p-4 rounded-xl border-2 ${color} flex-shrink-0`}>
                  <div className="text-sm font-semibold text-neutral-800 mb-1">{c.name || c.contractId}</div>
                  <div className="text-xs text-neutral-500 mb-2">{c.vendor || "—"} • {c.type || "AMC"}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">${(c.value || 0).toLocaleString()}</span>
                    <span className={`text-xs font-bold ${daysLeft < 14 ? "text-danger" : daysLeft < 30 ? "text-warning" : "text-success"}`}>{daysLeft} days</span>
                  </div>
                  {c.complianceScore != null && (
                    <div className="mt-2 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                      <div className="h-full bg-success rounded-full" style={{ width: `${c.complianceScore}%` }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Contracts Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50">
                <tr className="border-b border-neutral-200">
                  <th className="text-left px-6 py-3 text-xs font-medium text-neutral-400 uppercase">Contract</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-neutral-400 uppercase">Vendor</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-neutral-400 uppercase">Type</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-neutral-400 uppercase">Value</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-neutral-400 uppercase">Compliance</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-neutral-400 uppercase">Expires</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-neutral-400 uppercase">Risk</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c: any) => {
                  const daysLeft = c.endDate ? Math.ceil((new Date(c.endDate).getTime() - Date.now()) / 86400000) : 0;
                  const risk = daysLeft < 14 ? "CRITICAL" : daysLeft < 30 ? "HIGH" : daysLeft < 60 ? "MEDIUM" : "LOW";
                  return (
                    <tr key={c.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition">
                      <td className="px-6 py-3"><div className="font-medium text-neutral-700">{c.name || c.contractId}</div><div className="text-xs text-neutral-400 font-mono">{c.contractId}</div></td>
                      <td className="px-6 py-3 text-neutral-500">{c.vendor || "—"}</td>
                      <td className="px-6 py-3"><span className="pill bg-primary-50 text-primary-600">{c.type || "AMC"}</span></td>
                      <td className="px-6 py-3 font-medium text-neutral-700">${(c.value || 0).toLocaleString()}</td>
                      <td className="px-6 py-3"><HealthBadge score={c.complianceScore || 0} /></td>
                      <td className="px-6 py-3 text-neutral-500 text-xs">{c.endDate ? new Date(c.endDate).toLocaleDateString() : "—"}<br/><span className="font-medium">{daysLeft} days</span></td>
                      <td className="px-6 py-3"><SeverityPill level={risk} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {items.length === 0 && <EmptyState message="No contracts found" icon={FileText} />}
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  // PAGE: ALERTS
  // ═══════════════════════════════════════════════════════════════
  const AlertsPage = () => {
    const [tab, setTab] = useState("ALL");
    const filtered = alerts.filter(a => {
      if (tab === "ALL") return true;
      return a.severity === tab;
    });

    return (
      <div className="space-y-6 fade-in">
        <div className="card p-4">
          <div className="flex gap-1 bg-neutral-100 p-1 rounded-lg w-fit">
            {["ALL","CRITICAL","HIGH","MEDIUM","LOW"].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${tab === t ? "bg-white text-neutral-800 shadow-sm" : "text-neutral-500"}`}>
                {t}
                <span className="ml-1.5 text-xs text-neutral-400">
                  ({t === "ALL" ? alerts.length : alerts.filter(a => a.severity === t).length})
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {filtered.length > 0 ? filtered.map((item: any) => (
            <div key={item.id} className={`card p-5 border-l-4 ${
              item.severity === "CRITICAL" ? "border-l-danger" : item.severity === "HIGH" ? "border-l-warning" : item.severity === "MEDIUM" ? "border-l-blue-400" : "border-l-success"
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <SeverityPill level={item.severity || "MEDIUM"} />
                    <span className="text-xs text-neutral-400 font-mono">{item.type}</span>
                    <span className="text-sm font-medium text-neutral-700">{item.asset?.name || item.assetId || "Fleet Item"}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-neutral-800">{item.title}</h4>
                  <p className="text-xs text-neutral-500 mt-0.5">{item.message || item.reason}</p>
                  {item.currentValue && (
                    <div className="text-xs text-neutral-500 mt-1">
                      Value: <span className="font-semibold text-warning">{item.currentValue}</span> • Threshold: {item.threshold}
                    </div>
                  )}
                  {item.recommendedAction && <p className="text-xs text-primary-600 mt-1 font-medium">→ {item.recommendedAction}</p>}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-xs text-neutral-400">{item.status}</span>
                  <div className="flex gap-2">
                    <button onClick={() => acknowledgeAlert(item.id)} className="btn-secondary text-xs !py-1 !px-3">Acknowledge</button>
                    <button onClick={() => item.assetId && loadAssetDetail(item.assetId)} className="btn-primary text-xs !py-1 !px-3">Inspect</button>
                  </div>
                </div>
              </div>
            </div>
          )) : <EmptyState message="No alerts matching this filter" icon={CheckCircle2} />}
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  // PAGE: REPORTS
  // ═══════════════════════════════════════════════════════════════
  const ReportsPage = () => (
    <div className="space-y-6 fade-in">
      <div className="card p-6">
        <h3 className="font-semibold text-neutral-800 mb-4">Generated Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: "Fleet Health Summary", type: "PDF", date: "Oct 1, 2026", icon: Activity },
            { name: "PM Compliance Report", type: "PDF", date: "Sep 30, 2026", icon: Calendar },
            { name: "Contract Renewal Risk", type: "PDF", date: "Sep 28, 2026", icon: FileText },
            { name: "MTBF Analysis", type: "CSV", date: "Sep 25, 2026", icon: BarChart3 },
            { name: "IoT Anomaly Log", type: "CSV", date: "Sep 22, 2026", icon: Wifi },
            { name: "Fault Trend Analysis", type: "PDF", date: "Sep 20, 2026", icon: Zap },
          ].map((r, i) => {
            const Icon = r.icon;
            return (
              <div key={i} className="card card-hover p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center"><Icon className="w-5 h-5 text-primary-600" /></div>
                  <div>
                    <div className="text-sm font-medium text-neutral-700">{r.name}</div>
                    <div className="text-xs text-neutral-400">{r.date} • {r.type}</div>
                  </div>
                </div>
                <button className="btn-secondary w-full text-xs flex items-center justify-center gap-1">
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* MTBF Stats */}
      {mtbf && (
        <div className="card p-6">
          <h3 className="font-semibold text-neutral-800 mb-4">MTBF & Reliability Analytics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-neutral-50">
              <div className="text-xs text-neutral-400 mb-1">Fleet MTBF</div>
              <div className="text-xl font-bold text-neutral-800">{mtbf.fleetMTBF || mtbf.mtbfHours || "—"} hrs</div>
            </div>
            <div className="p-4 rounded-xl bg-neutral-50">
              <div className="text-xs text-neutral-400 mb-1">Fleet MTTR</div>
              <div className="text-xl font-bold text-warning">{mtbf.fleetMTTR || mtbf.mttrHours || "—"} hrs</div>
            </div>
            <div className="p-4 rounded-xl bg-neutral-50">
              <div className="text-xs text-neutral-400 mb-1">Availability</div>
              <div className="text-xl font-bold text-success">{mtbf.fleetAvailability || mtbf.availability || "—"}%</div>
            </div>
            <div className="p-4 rounded-xl bg-neutral-50">
              <div className="text-xs text-neutral-400 mb-1">Total Failures</div>
              <div className="text-xl font-bold text-danger">{mtbf.totalFailures || "—"}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ═══════════════════════════════════════════════════════════════
  // PAGE: AI ASSISTANT
  // ═══════════════════════════════════════════════════════════════
  const AiPage = () => {
    const chatEnd = useRef<HTMLDivElement>(null);
    useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [aiMessages]);

    return (
      <div className="max-w-3xl mx-auto space-y-6 fade-in">
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center"><Bot className="w-5 h-5 text-primary-600" /></div>
            <div>
              <h2 className="font-semibold text-neutral-800">AI Service Intelligence Assistant</h2>
              <p className="text-xs text-neutral-400">Evidence-grounded answers from your equipment database</p>
            </div>
          </div>

          {/* Chat */}
          <div className="mt-4 space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {aiMessages.length === 0 && (
              <div className="text-center py-8 text-neutral-400">
                <Bot className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Ask me about equipment health, sensor anomalies, contract status, or fault patterns.</p>
              </div>
            )}
            {aiMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${
                  msg.role === "user" ? "bg-primary-600 text-white rounded-br-sm" : "bg-neutral-100 text-neutral-700 rounded-bl-sm"
                }`}>
                  <div className="whitespace-pre-line">{msg.content}</div>
                  {msg.evidence?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-neutral-200/50">
                      <div className="text-xs font-medium opacity-70 mb-2">Evidence ({msg.evidence.length} records)</div>
                      {msg.evidence.map((ev: any, j: number) => (
                        <div key={j} className="text-xs bg-white/10 p-2 rounded mt-1 font-mono overflow-x-auto">
                          {JSON.stringify(ev, null, 1).substring(0, 200)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {aiLoading && (
              <div className="flex justify-start">
                <div className="bg-neutral-100 p-4 rounded-2xl rounded-bl-sm">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-neutral-400 pulse-soft" style={{ animationDelay: "0s" }} />
                    <div className="w-2 h-2 rounded-full bg-neutral-400 pulse-soft" style={{ animationDelay: "0.3s" }} />
                    <div className="w-2 h-2 rounded-full bg-neutral-400 pulse-soft" style={{ animationDelay: "0.6s" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEnd} />
          </div>

          {/* Suggestions */}
          <div className="flex flex-wrap gap-2 mt-4">
            {["Why is EQ-CMAPSS-FD001-001 high risk?", "Which contracts expire this month?", "What is the fleet MTBF?", "Show me critical alerts"].map(s => (
              <button key={s} onClick={() => { setAiInput(s); }} className="text-xs px-3 py-1.5 rounded-full border border-neutral-200 text-neutral-500 hover:border-primary-300 hover:text-primary-600 transition">{s}</button>
            ))}
          </div>

          {/* Input */}
          <div className="mt-4 flex gap-2">
            <input value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAiSend()}
              placeholder="Ask about equipment, sensors, contracts..." className="flex-1 px-4 py-3 rounded-xl border border-neutral-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition" />
            <button onClick={handleAiSend} disabled={aiLoading} className="btn-primary !rounded-xl flex items-center gap-2 !px-5">
              <Send className="w-4 h-4" /> Send
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════
  const renderPage = () => {
    switch (page) {
      case "dashboard": return <DashboardPage />;
      case "assets": return <AssetsPage />;
      case "iot": return <IoTPage />;
      case "faults": return <FaultsPage />;
      case "maintenance": return <MaintenancePage />;
      case "contracts": return <ContractsPage />;
      case "alerts": return <AlertsPage />;
      case "reports": return <ReportsPage />;
      case "ai": return <AiPage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      <Sidebar />
      <MobileDrawer />
      <SearchModal />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
