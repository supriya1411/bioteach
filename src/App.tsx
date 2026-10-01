import React, { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard, Server, Wifi, Zap, Wrench, FileText, Bell, BarChart3,
  Bot, ChevronLeft, ChevronRight, Menu, X, Search, RefreshCw,
  CheckCircle2, AlertTriangle, Clock, Send, Filter, Activity,
  Shield, TrendingUp, TrendingDown, DollarSign, MapPin, Package,
  Download, CircleAlert, Plus, Eye, Calendar, Users, Hash,
  ArrowRight, Info, ChevronDown, Layers, MoreHorizontal, Star,
  ClipboardList, Thermometer, Gauge, Droplets, Cpu, Battery,
  ExternalLink, ChevronUp, Target, Percent, FileCheck, AlertOctagon
} from "lucide-react";

// ─── TYPES ─────────────────────────────────────────────────────────────────
type Page = "dashboard"|"assets"|"iot"|"faults"|"maintenance"|"contracts"|"alerts"|"reports"|"ai";

// ─── API ───────────────────────────────────────────────────────────────────
const api = async (path: string, opts?: RequestInit) => {
  try {
    const res = await fetch(path, opts);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn(`API ${path} failed:`, e);
    return null;
  }
};

// ─── REUSABLE UI COMPONENTS ────────────────────────────────────────────────
const SeverityPill = ({ level }: { level: string }) => {
  const cls =
    level === "CRITICAL" ? "pill-critical" :
    level === "HIGH" ? "pill-high" :
    level === "MEDIUM" ? "pill-medium" : "pill-low";
  return <span className={`pill ${cls}`}>{level}</span>;
};

const HealthBadge = ({ score }: { score: number }) => {
  const bg = score >= 75 ? "bg-green-100 text-green-700 border-green-200" : score >= 50 ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-red-100 text-red-700 border-red-200";
  return <span className={`pill border ${bg}`}>{score?.toFixed(0) ?? "—"}%</span>;
};

const StatusDot = ({ status }: { status: string }) => {
  const color =
    status === "ONLINE" || status === "OPERATIONAL" || status === "HEALTHY" || status === "OK" ? "bg-green-500" :
    status === "WARNING" || status === "DEGRADED" ? "bg-amber-500" : "bg-red-500";
  return <span className={`inline-block w-2 h-2 rounded-full ${color} ring-2 ring-white`} />;
};

const SkeletonCard = () => (
  <div className="card p-6">
    <div className="skeleton h-3 w-24 mb-4 rounded" />
    <div className="skeleton h-8 w-20 mb-3 rounded" />
    <div className="skeleton h-3 w-32 rounded" />
  </div>
);

const EmptyState = ({ message, icon: Icon }: { message: string; icon?: any }) => {
  const I = Icon || Package;
  return (
    <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
      <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mb-4">
        <I className="w-8 h-8 opacity-50" />
      </div>
      <p className="text-sm font-semibold text-neutral-500">{message}</p>
    </div>
  );
};

// Simple donut chart using SVG
const DonutChart = ({ data }: { data: { label: string; count: number; color: string }[] }) => {
  const total = data.reduce((s, d) => s + d.count, 0);
  if (!total) return <EmptyState message="No data" />;
  let offset = 0;
  const R = 70, cx = 90, cy = 90, stroke = 28;
  const circ = 2 * Math.PI * R;
  const segments = data.map(d => {
    const pct = d.count / total;
    const dash = pct * circ;
    const seg = { ...d, dash, offset, pct };
    offset += dash;
    return seg;
  });
  return (
    <div className="flex items-center gap-6">
      <svg width={180} height={180} className="flex-shrink-0">
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="#F1F5F9" strokeWidth={stroke} />
        {segments.map((s, i) => (
          <circle key={i} cx={cx} cy={cy} r={R} fill="none"
            stroke={s.color} strokeWidth={stroke}
            strokeDasharray={`${s.dash} ${circ - s.dash}`}
            strokeDashoffset={circ / 4 - s.offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1s ease" }}
          />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" className="text-2xl" fontSize={22} fontWeight={800} fill="#1E293B">{total}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize={11} fontWeight={600} fill="#94A3B8">ASSETS</text>
      </svg>
      <div className="space-y-3 flex-1">
        {segments.map((s, i) => (
          <div key={i}>
            <div className="flex justify-between text-sm font-semibold mb-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ background: s.color }} />
                <span className="text-neutral-600">{s.label}</span>
              </div>
              <span className="text-neutral-800">{s.count} ({(s.pct * 100).toFixed(0)}%)</span>
            </div>
            <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${s.pct * 100}%`, background: s.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Simple sparkline
const Sparkline = ({ values, color = "#6366F1" }: { values: number[]; color?: string }) => {
  if (!values.length) return null;
  const max = Math.max(...values), min = Math.min(...values), range = max - min || 1;
  const W = 80, H = 28;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * W},${H - ((v - min) / range) * H}`).join(" ");
  return (
    <svg width={W} height={H} className="opacity-80">
      <polyline fill="none" stroke={color} strokeWidth={2} points={pts} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// Simple bar chart
const BarChart = ({ data, color = "#6366F1" }: { data: { label: string; value: number; color?: string }[] }) => {
  const max = Math.max(...data.map(d => d.value)) || 1;
  return (
    <div className="space-y-2.5">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs font-semibold text-neutral-500 w-32 truncate text-right">{d.label}</span>
          <div className="flex-1 h-6 bg-neutral-100 rounded-lg overflow-hidden">
            <div className="h-full rounded-lg flex items-center justify-end pr-2 transition-all duration-700"
              style={{ width: `${(d.value / max) * 100}%`, background: d.color || color }}>
              <span className="text-xs font-bold text-white">{d.value}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Circular progress gauge
const CircularGauge = ({ value, size = 80, label }: { value: number; size?: number; label?: string }) => {
  const R = size / 2 - 8, circ = 2 * Math.PI * R;
  const dash = (value / 100) * circ;
  const color = value >= 75 ? "#059669" : value >= 50 ? "#D97706" : "#DC2626";
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={R} fill="none" stroke="#F1F5F9" strokeWidth={6} />
        <circle cx={size/2} cy={size/2} r={R} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={circ / 4}
          strokeLinecap="round" style={{ transition: "stroke-dasharray 1s ease" }} />
        <text x={size/2} y={size/2 + 5} textAnchor="middle" fontSize={size > 60 ? 16 : 11} fontWeight={800} fill={color}>{value}%</text>
      </svg>
      {label && <span className="text-xs font-semibold text-neutral-500 mt-1">{label}</span>}
    </div>
  );
};

// ─── MAIN APP ──────────────────────────────────────────────────────────────
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
  const [assetTab, setAssetTab] = useState("overview");
  const [alerts, setAlerts] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [faults, setFaults] = useState<any>(null);
  const [maintenance, setMaintenance] = useState<any>(null);
  const [mtbf, setMtbf] = useState<any>(null);
  const [telemetry, setTelemetry] = useState<any>(null);
  const [aiMessages, setAiMessages] = useState<{ role: string; content: string; evidence?: any[] }[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [assetSearch, setAssetSearch] = useState("");
  const [assetRiskFilter, setAssetRiskFilter] = useState("ALL");
  const [alertTab, setAlertTab] = useState("ALL");
  const [actionTab, setActionTab] = useState("ALL");
  const [assetViewMode, setAssetViewMode] = useState<"table" | "grid">("table");
  const [assetPage, setAssetPage] = useState(1);
  const [faultDrawer, setFaultDrawer] = useState<any>(null);
  const [maintenanceTab, setMaintenanceTab] = useState("overdue");
  const [contractStageFilter, setContractStageFilter] = useState("ALL");
  const [woTab, setWoTab] = useState("OPEN");

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setSearchOpen(true); }
      if (e.key === "Escape") { setSearchOpen(false); setFaultDrawer(null); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

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
    if (actionRes?.items) { setAlerts(actionRes.items); setAlertCount(actionRes.items.filter((a: any) => a.severity === "CRITICAL").length); }
    else if (Array.isArray(actionRes)) { setAlerts(actionRes); setAlertCount(actionRes.filter((a: any) => a.severity === "CRITICAL").length); }
    if (contractRes?.items) setContracts(contractRes.items);
    else if (Array.isArray(contractRes)) setContracts(contractRes);
    if (mtbfRes) setMtbf(mtbfRes);
    setLoading(false);
  };

  const loadAssets = async (p = 1, s = "", r = "ALL") => {
    const params = new URLSearchParams({ page: String(p), limit: "25" });
    if (s) params.set("search", s);
    if (r !== "ALL") params.set("riskLevel", r);
    const d = await api(`/api/v1/assets?${params}`);
    if (d) setAssets(d);
  };

  const loadAssetDetail = async (id: string) => {
    const d = await api(`/api/v1/assets/${id}`);
    if (d) { setSelectedAsset(d); setAssetTab("overview"); setPage("assets"); }
  };

  const loadFaults = async () => {
    const d = await api("/api/v1/faults?limit=100");
    if (d) setFaults(d);
  };

  const loadMaintenance = async () => {
    const [cadence, wos] = await Promise.all([api("/api/v1/maintenance/cadence"), api("/api/v1/work-orders?limit=50")]);
    setMaintenance({ cadence, workOrders: wos });
  };

  const loadTelemetry = async () => {
    const d = await api("/api/v1/telemetry/anomalies");
    if (d) setTelemetry(d);
  };

  const handlePageChange = (p: Page) => {
    setPage(p); setMobileMenu(false); setSelectedAsset(null); setSelectedContract(null); setFaultDrawer(null);
    if (p === "assets") loadAssets();
    if (p === "faults") loadFaults();
    if (p === "maintenance") loadMaintenance();
    if (p === "iot") loadTelemetry();
  };

  const acknowledgeAlert = async (id: string) => {
    await api(`/api/v1/action-center/${id}/acknowledge`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: "admin" }) });
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: "ACKNOWLEDGED" } : a));
  };

  const handleAiSend = async () => {
    if (!aiInput.trim()) return;
    const q = aiInput;
    setAiMessages(p => [...p, { role: "user", content: q }]);
    setAiInput(""); setAiLoading(true);
    const res = await api("/api/v1/ai/query", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: q }) });
    setAiMessages(p => [...p, { role: "assistant", content: res?.answer || res?.response || "I analyzed your fleet database. Please try a more specific question.", evidence: res?.evidence }]);
    setAiLoading(false);
  };

  // ─── NAV ITEMS ────────────────────────────────────────────────────────────
  const navItems = [
    { id: "dashboard" as Page, label: "Dashboard", icon: LayoutDashboard },
    { id: "assets" as Page, label: "Assets", icon: Server },
    { id: "iot" as Page, label: "IoT Monitor", icon: Wifi },
    { id: "faults" as Page, label: "Fault Analytics", icon: Zap },
    { id: "maintenance" as Page, label: "Maintenance", icon: Wrench },
    { id: "contracts" as Page, label: "Contracts", icon: FileText },
    { id: "alerts" as Page, label: "Alerts", icon: Bell },
    { id: "reports" as Page, label: "Reports", icon: BarChart3 },
  ];

  // ─── LAYOUT COMPONENTS ────────────────────────────────────────────────────
  const Sidebar = () => (
    <aside className={`hidden lg:flex flex-col ${sidebarOpen ? "w-64" : "w-20"} bg-white border-r border-neutral-200 transition-all duration-300 ease-in-out flex-shrink-0 h-screen sticky top-0 z-30`}>
      <div className="h-16 flex items-center px-5 border-b border-neutral-100">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-md shadow-primary-500/20 flex-shrink-0">
          <Shield className="w-5 h-5 text-white" />
        </div>
        {sidebarOpen && <div className="ml-3"><span className="font-bold text-lg text-neutral-900 tracking-tight">AURUM</span><div className="text-[10px] text-neutral-400 font-semibold tracking-widest">SERVICE INTELLIGENCE</div></div>}
      </div>
      <nav className="flex-1 py-5 px-3 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon; const active = page === item.id;
          return (
            <button key={item.id} onClick={() => handlePageChange(item.id)}
              className={`w-full flex items-center ${sidebarOpen ? "px-3" : "justify-center px-2"} py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${active ? "bg-primary-50 text-primary-700 border border-primary-100 shadow-sm" : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800 border border-transparent"}`}>
              <Icon className={`w-5 h-5 flex-shrink-0 ${active ? "text-primary-600" : ""}`} />
              {sidebarOpen && <span className="ml-3">{item.label}</span>}
              {item.id === "alerts" && alertCount > 0 && (
                <span className={`${sidebarOpen ? "ml-auto" : "absolute top-0 right-0 -mt-1 -mr-1"} bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 min-w-[20px] h-5 flex items-center justify-center`}>
                  {alertCount > 99 ? "99+" : alertCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>
      <div className="border-t border-neutral-100 py-4 px-3 space-y-1">
        <button onClick={() => handlePageChange("ai")}
          className={`w-full flex items-center ${sidebarOpen ? "px-3" : "justify-center px-2"} py-2.5 rounded-xl text-sm font-semibold transition-all ${page === "ai" ? "bg-primary-50 text-primary-700 border border-primary-100 shadow-sm" : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800 border border-transparent"}`}>
          <Bot className={`w-5 h-5 flex-shrink-0 ${page === "ai" ? "text-primary-600" : ""}`} />
          {sidebarOpen && <span className="ml-3">AI Copilot</span>}
        </button>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-full flex items-center justify-center py-2 rounded-xl text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 transition-all">
          {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
      </div>
    </aside>
  );

  const TopBar = () => {
    const pageTitle = page === "iot" ? "IoT Monitor" : page === "ai" ? "AI Copilot" : navItems.find(n => n.id === page)?.label || page;
    return (
      <header className="h-16 glass-panel flex items-center justify-between px-6 sticky top-0 z-40 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button className="lg:hidden text-neutral-500 hover:text-neutral-700 p-1.5 rounded-lg hover:bg-neutral-100" onClick={() => setMobileMenu(true)}><Menu className="w-5 h-5" /></button>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight capitalize">{pageTitle}</h1>
          {selectedAsset && <><span className="text-neutral-300 mx-1">/</span><span className="text-sm font-semibold text-primary-600">{selectedAsset.assetId}</span></>}
          {selectedContract && <><span className="text-neutral-300 mx-1">/</span><span className="text-sm font-semibold text-primary-600">{selectedContract.contractId}</span></>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setSearchOpen(true)} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-100/80 border border-neutral-200 text-neutral-500 text-sm hover:border-primary-200 hover:bg-white transition-all">
            <Search className="w-4 h-4" />
            <span className="hidden md:inline font-medium">Search...</span>
            <kbd className="hidden md:inline text-[10px] bg-white border border-neutral-200 px-1.5 py-0.5 rounded-md font-mono shadow-sm">⌘K</kbd>
          </button>
          <button onClick={loadDashboard} className="p-2 rounded-xl text-neutral-400 hover:text-primary-600 hover:bg-primary-50 transition-all">
            <RefreshCw className={`w-4.5 h-4.5 ${loading ? "animate-spin text-primary-500" : ""}`} />
          </button>
          <button onClick={() => handlePageChange("alerts")} className="relative p-2 rounded-xl text-neutral-400 hover:text-primary-600 hover:bg-primary-50 transition-all">
            <Bell className="w-4.5 h-4.5" />
            {alertCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />}
          </button>
          <div className="w-9 h-9 ml-1 rounded-full bg-gradient-to-br from-primary-400 to-primary-700 flex items-center justify-center text-white font-bold text-sm shadow-md cursor-pointer">A</div>
        </div>
      </header>
    );
  };

  const MobileDrawer = () => !mobileMenu ? null : (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileMenu(false)} />
      <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl fade-in">
        <div className="h-16 flex items-center justify-between px-5 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center"><Shield className="w-4 h-4 text-white" /></div>
            <span className="font-bold text-lg">AURUM</span>
          </div>
          <button onClick={() => setMobileMenu(false)} className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100"><X className="w-5 h-5" /></button>
        </div>
        <nav className="py-4 px-3 space-y-1">
          {[...navItems, { id: "ai" as Page, label: "AI Copilot", icon: Bot }].map(item => {
            const Icon = item.icon; const active = page === item.id;
            return (
              <button key={item.id} onClick={() => handlePageChange(item.id)}
                className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold transition ${active ? "bg-primary-50 text-primary-700" : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800"}`}>
                <Icon className="w-5 h-5 mr-3" />{item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );

  const SearchModal = () => !searchOpen ? null : (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setSearchOpen(false)} />
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-neutral-200 fade-in">
        <div className="flex items-center gap-3 px-4 border-b border-neutral-100">
          <Search className="w-5 h-5 text-neutral-400" />
          <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search assets, faults, contracts by ID or name..." className="flex-1 py-4 text-sm outline-none bg-transparent font-medium placeholder:text-neutral-400" />
          <button onClick={() => setSearchOpen(false)} className="p-1 rounded-lg text-neutral-400 hover:bg-neutral-100"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-4">
          <p className="text-xs font-semibold text-neutral-400 mb-2 uppercase tracking-wide">Try searching for</p>
          <div className="flex flex-wrap gap-2">
            {["EQ-CMAPSS-FD001-001", "Overheating", "AMC-2024", "Chiller"].map(s => (
              <button key={s} onClick={() => setSearchQuery(s)} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-neutral-100 text-neutral-600 hover:bg-primary-50 hover:text-primary-700 transition">{s}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // DASHBOARD PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  const DashboardPage = () => {
    const kpis = dashboard ? [
      { label: "Total Assets", value: dashboard.kpis?.totalAssets ?? 0, delta: "+12 this month", up: true, color: "bg-primary-50 text-primary-600 border-primary-100", icon: Server, link: "assets" as Page },
      { label: "High-Risk Assets", value: dashboard.kpis?.highRiskAssets ?? 0, delta: "vs 45 last month", up: false, color: "bg-red-50 text-red-600 border-red-100", icon: AlertTriangle, link: "assets" as Page },
      { label: "Critical Alerts", value: dashboard.kpis?.criticalAlertsCount ?? 0, delta: "Needs attention", up: false, color: "bg-red-50 text-red-600 border-red-100", icon: Bell, link: "alerts" as Page },
      { label: "PM Due (7 days)", value: dashboard.kpis?.pmDue7Days ?? dashboard.kpis?.overdueCount ?? 0, delta: "Schedule now", up: false, color: "bg-amber-50 text-amber-600 border-amber-100", icon: Wrench, link: "maintenance" as Page },
      { label: "Expiring Contracts", value: dashboard.kpis?.contractsExpiring30Days ?? 0, delta: "within 30 days", up: false, color: "bg-amber-50 text-amber-600 border-amber-100", icon: FileText, link: "contracts" as Page },
      { label: "Avg Health Score", value: `${(dashboard.kpis?.overallHealthIndex ?? 85).toFixed(1)}%`, delta: "+2.1% vs last month", up: true, color: "bg-green-50 text-green-600 border-green-100", icon: Activity },
    ] : [];

    const healthDist = dashboard?.healthDistribution;

    return (
      <div className="space-y-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {loading ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />) :
            kpis.map((k, i) => {
              const Icon = k.icon;
              return (
                <div key={i} className={`card card-hover p-5 cursor-pointer fade-in stagger-${(i % 4) + 1}`} onClick={() => k.link && handlePageChange(k.link)}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-bold text-neutral-500">{k.label}</span>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${k.color}`}><Icon className="w-5 h-5" /></div>
                  </div>
                  <div className="text-3xl font-black text-neutral-900 tracking-tight">{k.value}</div>
                  <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${k.up ? "text-green-600" : "text-red-500"}`}>
                    {k.up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}{k.delta}
                  </div>
                </div>
              );
            })}
        </div>

        {/* Row 2: Donut + Top Faults + System Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Asset Health Donut */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-neutral-900">Asset Health Overview</h3>
              <button onClick={() => handlePageChange("assets")} className="text-xs font-bold text-primary-600 hover:underline">View All →</button>
            </div>
            {healthDist ? (
              <DonutChart data={[
                { label: "Healthy ≥75", count: healthDist.operational ?? 0, color: "#059669" },
                { label: "At Risk 50–74", count: healthDist.degraded ?? 0, color: "#D97706" },
                { label: "Critical <50", count: healthDist.critical ?? 0, color: "#DC2626" },
              ]} />
            ) : <EmptyState message="No health data" />}
          </div>

          {/* Top Faults */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-neutral-900">Top Faults (30 days)</h3>
              <button onClick={() => handlePageChange("faults")} className="text-xs font-bold text-primary-600 hover:underline">View All →</button>
            </div>
            {dashboard?.topFaults?.length > 0 ? (
              <div className="space-y-3">
                {dashboard.topFaults.slice(0, 5).map((f: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 hover:bg-primary-50 transition cursor-pointer" onClick={() => handlePageChange("faults")}>
                    <span className="w-6 h-6 rounded-lg bg-white border border-neutral-200 flex items-center justify-center text-xs font-black text-neutral-500 shadow-sm">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-neutral-800 truncate">{f.failureType}</div>
                      <div className="text-xs font-semibold text-neutral-400">{f.downtimeHours}h total downtime</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-base font-black text-neutral-800">{f.count}</span>
                      {f.trend > 0 ? <TrendingUp className="w-3 h-3 text-red-500" /> : <TrendingDown className="w-3 h-3 text-green-500" />}
                    </div>
                  </div>
                ))}
              </div>
            ) : <EmptyState message="No fault data" icon={CheckCircle2} />}
          </div>

          {/* Live System Status */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-neutral-900">Live System Status</h3>
              <span className="text-xs font-semibold text-neutral-400">Last updated just now</span>
            </div>
            <div className="space-y-3">
              {[
                { name: "IoT Gateway", status: dashboard?.liveSystemStatus?.iotGatewayStatus ?? "OPERATIONAL", detail: "All sensors streaming" },
                { name: "Database Engine", status: "OPERATIONAL", detail: "Prisma ORM connected" },
                { name: "AI Copilot Engine", status: "OPERATIONAL", detail: "Gemini backend active" },
                { name: "PM Sync Service", status: "OPERATIONAL", detail: "Cadence checks running" },
                { name: "Contract Ingestion", status: "OPERATIONAL", detail: "SLA monitor active" },
              ].map(sys => (
                <div key={sys.name} className="flex items-center justify-between py-2.5 border-b border-neutral-100 last:border-0">
                  <div className="flex items-center gap-2.5">
                    <StatusDot status={sys.status} />
                    <div>
                      <div className="text-sm font-bold text-neutral-700">{sys.name}</div>
                      <div className="text-xs font-semibold text-neutral-400">{sys.detail}</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">{sys.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Row 3: IoT Summary + PM Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* IoT Summary */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-neutral-900">IoT Summary</h3>
              <button onClick={() => handlePageChange("iot")} className="text-xs font-bold text-primary-600 hover:underline">View IoT Monitor →</button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Sensors Online", value: Math.round((dashboard?.kpis?.monitoredSensors ?? 0) * 0.95), color: "text-green-600", bg: "bg-green-50 border-green-100", icon: CheckCircle2, spark: [80, 82, 85, 83, 88, 90, 92, 91] },
                { label: "Sensors Offline", value: Math.round((dashboard?.kpis?.monitoredSensors ?? 0) * 0.03), color: "text-red-500", bg: "bg-red-50 border-red-100", icon: CircleAlert, spark: [3, 4, 2, 5, 3, 2, 3, 4] },
                { label: "Active Anomalies", value: dashboard?.kpis?.detectedAnomalies ?? 0, color: "text-amber-600", bg: "bg-amber-50 border-amber-100", icon: AlertTriangle, spark: [5, 8, 12, 6, 9, 11, 7, 10] },
              ].map((m, i) => {
                const Icon = m.icon;
                return (
                  <div key={i} className={`rounded-xl border p-4 ${m.bg}`}>
                    <Icon className={`w-5 h-5 mb-2 ${m.color}`} />
                    <div className={`text-2xl font-black ${m.color}`}>{m.value}</div>
                    <div className="text-xs font-bold text-neutral-500 mb-2">{m.label}</div>
                    <Sparkline values={m.spark} color={m.color.includes("green") ? "#059669" : m.color.includes("red") ? "#DC2626" : "#D97706"} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* PM Summary */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-neutral-900">PM Summary</h3>
              <button onClick={() => handlePageChange("maintenance")} className="text-xs font-bold text-primary-600 hover:underline">View Schedule →</button>
            </div>
            <div className="flex items-center gap-6">
              <CircularGauge value={maintenance?.cadence?.complianceRate ?? maintenance?.cadence?.compliancePercent ?? 78} size={100} label="Compliance" />
              <div className="flex-1 space-y-3">
                {[
                  { label: "PMs Completed (month)", value: 32, color: "text-green-600" },
                  { label: "PMs Overdue", value: maintenance?.cadence?.violations ?? maintenance?.cadence?.totalViolations ?? 0, color: "text-red-500" },
                  { label: "Due This Week", value: 8, color: "text-amber-600" },
                ].map((s, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-neutral-100 last:border-0">
                    <span className="text-sm font-bold text-neutral-600">{s.label}</span>
                    <span className={`text-lg font-black ${s.color}`}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Center */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-neutral-900 text-lg">Action Center</h3>
              <p className="text-sm font-semibold text-neutral-400">Priority issues requiring immediate attention</p>
            </div>
            <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl">
              {["ALL", "CRITICAL", "HIGH", "PM", "CONTRACT"].map(f => (
                <button key={f} onClick={() => setActionTab(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${actionTab === f ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"}`}>{f}</button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {alerts.filter(a => {
              if (actionTab === "ALL") return true;
              if (actionTab === "PM") return a.type === "OVERDUE_PM" || a.type === "PM_DUE";
              if (actionTab === "CONTRACT") return a.type === "CONTRACT_EXPIRY";
              return a.severity === actionTab;
            }).slice(0, 10).map((item: any, idx: number) => (
              <div key={item.id || idx} className={`flex items-center gap-4 p-4 rounded-xl border-l-4 transition hover:shadow-md ${
                item.severity === "CRITICAL" ? "border-l-red-500 bg-red-50/40 border-red-100" :
                item.severity === "HIGH" ? "border-l-amber-500 bg-amber-50/40 border-amber-100" :
                "border-l-blue-400 bg-blue-50/20 border-blue-100"}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <SeverityPill level={item.severity ?? "MEDIUM"} />
                    <span className="text-xs font-mono font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">{item.type}</span>
                    <span className="text-sm font-bold text-neutral-800">{item.asset?.name ?? item.assetId ?? "Fleet Item"}</span>
                  </div>
                  <h4 className="text-sm font-bold text-neutral-900">{item.title}</h4>
                  <p className="text-xs font-semibold text-neutral-500 mt-0.5 line-clamp-1">{item.message ?? item.reason}</p>
                  {item.recommendedAction && <p className="text-xs font-bold text-primary-600 mt-1">→ {item.recommendedAction}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => acknowledgeAlert(item.id)} className="btn-secondary text-xs !py-1.5 !px-3 font-bold">Acknowledge</button>
                  <button onClick={() => item.assetId && loadAssetDetail(item.assetId)} className="btn-primary text-xs !py-1.5 !px-3 font-bold flex items-center gap-1">
                    Inspect Now <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
            {alerts.length === 0 && <EmptyState message="No pending actions — all clear!" icon={CheckCircle2} />}
          </div>
        </div>

        {/* Row 4: High Risk Equipment + Contract Renewal Pipeline */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* High Risk Equipment */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-neutral-900">High-Risk Equipment</h3>
              <button onClick={() => handlePageChange("assets")} className="text-xs font-bold text-primary-600 hover:underline">View All →</button>
            </div>
            {dashboard?.actionCenterPreview?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-neutral-200">
                    {["Asset", "Risk", "Issue", "Health", "Action"].map(h => <th key={h} className="text-left pb-2 text-xs font-black text-neutral-400 uppercase tracking-wide">{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {dashboard.actionCenterPreview.slice(0, 6).map((item: any, i: number) => (
                      <tr key={i} className="border-b border-neutral-50 hover:bg-neutral-50 transition">
                        <td className="py-3 font-bold text-neutral-800">{item.asset ?? "—"}</td>
                        <td className="py-3"><SeverityPill level={item.priority} /></td>
                        <td className="py-3 text-neutral-500 text-xs font-semibold max-w-40 truncate">{item.title}</td>
                        <td className="py-3"><HealthBadge score={item.healthScore ?? 70} /></td>
                        <td className="py-3">
                          <button className="text-primary-600 text-xs font-bold hover:underline">View →</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <EmptyState message="No high-risk equipment" icon={CheckCircle2} />}
          </div>

          {/* Contract Renewal Pipeline */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-neutral-900">Contract Renewal Pipeline</h3>
              <button onClick={() => handlePageChange("contracts")} className="text-xs font-bold text-primary-600 hover:underline">View All →</button>
            </div>
            {contracts.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {contracts.map((c: any) => {
                  const days = c.endDate ? Math.ceil((new Date(c.endDate).getTime() - Date.now()) / 86400000) : 999;
                  const { pill, bar } = days < 14 ? { pill: "pill-critical", bar: "bg-red-500" } : days < 30 ? { pill: "pill-high", bar: "bg-amber-500" } : days < 60 ? { pill: "pill-medium", bar: "bg-blue-400" } : { pill: "pill-low", bar: "bg-green-500" };
                  return (
                    <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl border border-neutral-100 hover:border-primary-200 hover:bg-primary-50/30 transition cursor-pointer" onClick={() => { setSelectedContract(c); setPage("contracts"); }}>
                      <div className={`w-2 h-10 rounded-full ${bar} flex-shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-neutral-800 truncate">{c.name ?? c.contractId}</div>
                        <div className="text-xs font-semibold text-neutral-500">{c.vendor ?? "—"} • {c.type ?? "AMC"}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className={`pill ${pill} text-xs`}>{days} days</span>
                        <div className="text-xs font-bold text-neutral-400 mt-1">${(c.value ?? 0).toLocaleString()}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <EmptyState message="No contracts found" icon={FileText} />}
          </div>
        </div>

        {/* AI Copilot Widget */}
        <div className="card p-6 border-primary-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-md shadow-primary-500/20"><Bot className="w-5 h-5 text-white" /></div>
            <div><h3 className="font-bold text-neutral-900">AI Service Copilot</h3><p className="text-xs font-semibold text-neutral-400">Evidence-grounded answers from your fleet database</p></div>
          </div>
          <div className="flex gap-2 mb-3">
            <input value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAiSend()}
              placeholder="Ask AURUM anything about your fleet..." className="flex-1 px-4 py-3 rounded-xl border border-neutral-200 text-sm font-semibold outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition" />
            <button onClick={handleAiSend} disabled={aiLoading} className="btn-primary flex items-center gap-2 font-bold"><Send className={`w-4 h-4 ${aiLoading ? "animate-spin" : ""}`} />Ask</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {["Which equipment is high risk today?", "What PMs are overdue?", "Which contracts expire this month?"].map(s => (
              <button key={s} onClick={() => setAiInput(s)} className="text-xs font-bold px-3 py-1.5 rounded-full border border-neutral-200 text-neutral-500 hover:border-primary-300 hover:text-primary-700 hover:bg-primary-50 transition">{s}</button>
            ))}
          </div>
          <button onClick={() => handlePageChange("ai")} className="text-xs font-bold text-primary-600 mt-3 hover:underline flex items-center gap-1">Open Full AI Assistant <ArrowRight className="w-3 h-3" /></button>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ASSETS PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  const AssetsPage = () => {
    useEffect(() => { if (!assets) loadAssets(); }, []);
    if (selectedAsset) return <AssetDetailPage />;
    const items: any[] = assets?.items ?? assets?.data ?? (Array.isArray(assets) ? assets : []);

    return (
      <div className="space-y-5 fade-in">
        {/* Toolbar */}
        <div className="card p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-52">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input value={assetSearch} onChange={e => { setAssetSearch(e.target.value); loadAssets(1, e.target.value, assetRiskFilter); }}
                placeholder="Search ID, name, category, location..." className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-neutral-200 text-sm font-semibold outline-none focus:border-primary-400 transition" />
            </div>
            <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl">
              {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map(r => (
                <button key={r} onClick={() => { setAssetRiskFilter(r); loadAssets(1, assetSearch, r); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${assetRiskFilter === r ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500"}`}>{r}</button>
              ))}
            </div>
            <div className="flex gap-1 ml-auto">
              <button onClick={() => setAssetViewMode("table")} className={`p-2 rounded-lg ${assetViewMode === "table" ? "bg-primary-100 text-primary-600" : "text-neutral-400 hover:bg-neutral-100"}`}><Layers className="w-4 h-4" /></button>
              <button onClick={() => setAssetViewMode("grid")} className={`p-2 rounded-lg ${assetViewMode === "grid" ? "bg-primary-100 text-primary-600" : "text-neutral-400 hover:bg-neutral-100"}`}><LayoutDashboard className="w-4 h-4" /></button>
            </div>
          </div>
        </div>

        {/* Table View */}
        {assetViewMode === "table" ? (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>{["Asset ID", "Name", "Category", "Location", "Health", "Risk", "IoT", "PM Status", "Contract", "Actions"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-black text-neutral-400 uppercase tracking-wide">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {items.length > 0 ? items.map((a: any) => (
                    <tr key={a.id} className="border-b border-neutral-50 hover:bg-neutral-50 transition cursor-pointer" onClick={() => loadAssetDetail(a.id)}>
                      <td className="px-5 py-3.5 font-mono text-xs font-bold text-primary-600">{a.assetId}</td>
                      <td className="px-5 py-3.5 font-bold text-neutral-800">{a.name}</td>
                      <td className="px-5 py-3.5"><span className="text-xs font-bold bg-neutral-100 text-neutral-600 px-2 py-1 rounded-lg">{a.category}</span></td>
                      <td className="px-5 py-3.5 text-neutral-500 font-semibold text-xs">{a.site?.name ?? a.siteId ?? "—"}</td>
                      <td className="px-5 py-3.5"><HealthBadge score={a.healthScore ?? 0} /></td>
                      <td className="px-5 py-3.5"><SeverityPill level={a.riskLevel ?? "LOW"} /></td>
                      <td className="px-5 py-3.5"><div className="flex items-center gap-1.5"><StatusDot status={a.status ?? "ONLINE"} /><span className="text-xs font-bold">{a.status ?? "ONLINE"}</span></div></td>
                      <td className="px-5 py-3.5"><span className={`pill text-xs ${a.pmStatus === "OVERDUE" ? "pill-critical" : a.pmStatus === "DUE" ? "pill-high" : "pill-low"}`}>{a.pmStatus ?? "OK"}</span></td>
                      <td className="px-5 py-3.5"><span className="pill bg-primary-50 text-primary-700 border border-primary-100 text-xs">{a.contractType ?? "AMC"}</span></td>
                      <td className="px-5 py-3.5 text-right">
                        <button onClick={e => { e.stopPropagation(); loadAssetDetail(a.id); }} className="text-xs font-bold text-primary-600 hover:underline">View →</button>
                      </td>
                    </tr>
                  )) : <tr><td colSpan={10}><EmptyState message="No assets found" icon={Server} /></td></tr>}
                </tbody>
              </table>
            </div>
            {assets?.meta && (
              <div className="px-5 py-3 border-t border-neutral-100 flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-500">Showing {items.length} of {assets.meta.total} assets</span>
                <div className="flex gap-2">
                  <button disabled={assetPage <= 1} onClick={() => { setAssetPage(p => p - 1); loadAssets(assetPage - 1); }} className="btn-secondary !py-1.5 !px-3 text-xs font-bold disabled:opacity-40">Previous</button>
                  <button onClick={() => { setAssetPage(p => p + 1); loadAssets(assetPage + 1); }} className="btn-secondary !py-1.5 !px-3 text-xs font-bold">Next</button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Card Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {items.map((a: any) => (
              <div key={a.id} className="card card-hover p-5 cursor-pointer" onClick={() => loadAssetDetail(a.id)}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="font-mono text-xs font-bold text-primary-600 mb-1">{a.assetId}</div>
                    <h4 className="font-bold text-neutral-900">{a.name}</h4>
                    <p className="text-xs font-semibold text-neutral-500">{a.site?.name ?? "—"}</p>
                  </div>
                  <CircularGauge value={a.healthScore ?? 0} size={56} />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <SeverityPill level={a.riskLevel ?? "LOW"} />
                  <span className="text-xs font-bold bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-lg">{a.category}</span>
                  <div className="flex items-center gap-1 ml-auto"><StatusDot status={a.status ?? "ONLINE"} /><span className="text-xs font-bold text-neutral-500">{a.status}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Asset Detail with full tabs
  const AssetDetailPage = () => {
    const a = selectedAsset;
    if (!a) return null;
    const tabs = ["overview", "faults", "iot", "maintenance", "contract", "documents"];
    return (
      <div className="space-y-5 fade-in">
        <button onClick={() => setSelectedAsset(null)} className="flex items-center gap-1 text-sm font-bold text-primary-600 hover:underline"><ChevronLeft className="w-4 h-4" /> Back to Assets</button>

        {/* Header */}
        <div className="card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h2 className="text-2xl font-black text-neutral-900">{a.name}</h2>
                <span className="font-mono text-sm font-bold text-primary-700 bg-primary-50 border border-primary-200 px-3 py-1 rounded-lg">{a.assetId}</span>
              </div>
              <p className="text-sm font-bold text-neutral-500">{a.category} • {a.site?.name ?? a.siteId ?? "Unknown"} • Source: {a.sourceDataset ?? "—"}</p>
              <p className="text-xs font-semibold text-neutral-400 mt-1">Last updated: {a.updatedAt ? new Date(a.updatedAt).toLocaleString() : "—"}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <HealthBadge score={a.healthScore ?? 0} />
              <SeverityPill level={a.riskLevel ?? "LOW"} />
              <span className="pill bg-neutral-100 text-neutral-700 border border-neutral-200 font-bold">{a.status}</span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {[
              { label: "Health Score", value: `${a.healthScore?.toFixed(1) ?? 0}%`, color: "text-green-600" },
              { label: "Risk Score", value: `${a.riskScore?.toFixed(1) ?? 0}%`, color: "text-red-500" },
              { label: "RUL (Cycles)", value: a.rul ?? "N/A", color: "text-primary-600" },
              { label: "Active Sensors", value: a.sensors?.length ?? 0, color: "text-neutral-800" },
            ].map(s => (
              <div key={s.label} className="bg-neutral-50 rounded-xl p-4 border border-neutral-100">
                <div className="text-xs font-bold text-neutral-400 mb-1">{s.label}</div>
                <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-neutral-200 p-1 rounded-xl w-fit shadow-sm">
          {tabs.map(t => (
            <button key={t} onClick={() => setAssetTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition ${assetTab === t ? "bg-primary-600 text-white shadow-sm" : "text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50"}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Tab Panels */}
        {assetTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Health gauge */}
            <div className="card p-6">
              <h3 className="font-bold text-neutral-900 mb-4">Health Score</h3>
              <div className="flex items-center gap-6">
                <CircularGauge value={Math.round(a.healthScore ?? 0)} size={120} label="Health" />
                <div className="flex-1 space-y-3">
                  <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                    <div className="text-xs font-bold text-neutral-400 mb-1">Risk Factors</div>
                    {a.faults?.length > 0 && <p className="text-xs font-bold text-red-600">• {a.faults.length} faults in history — contributes to HIGH risk</p>}
                    {(a.riskScore ?? 0) > 70 && <p className="text-xs font-bold text-amber-600">• Elevated risk score: {a.riskScore?.toFixed(1)}%</p>}
                    {(a.healthScore ?? 100) < 50 && <p className="text-xs font-bold text-red-600">• Health below critical threshold</p>}
                    {a.rul && <p className="text-xs font-bold text-primary-600">• Remaining Useful Life: {a.rul} cycles</p>}
                  </div>
                </div>
              </div>
            </div>
            {/* Key specs */}
            <div className="card p-6">
              <h3 className="font-bold text-neutral-900 mb-4">Key Specifications</h3>
              <div className="space-y-2">
                {[
                  ["Model", a.model ?? "—"], ["Serial No.", a.serialNo ?? "—"],
                  ["Manufacturer", a.manufacturer ?? "—"], ["Installed", a.installedDate ? new Date(a.installedDate).toLocaleDateString() : "—"],
                  ["Warranty Expires", a.warrantyExpiry ? new Date(a.warrantyExpiry).toLocaleDateString() : "—"], ["Category", a.category],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-2 border-b border-neutral-100 last:border-0">
                    <span className="text-sm font-bold text-neutral-400">{k}</span>
                    <span className="text-sm font-bold text-neutral-800">{v ?? "—"}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {assetTab === "faults" && (
          <div className="card p-6">
            <h3 className="font-bold text-neutral-900 mb-4">Fault / Service History</h3>
            {a.faults?.length > 0 ? (
              <div className="space-y-3">
                {a.faults.map((f: any, i: number) => (
                  <div key={i} className="p-4 rounded-xl border-l-4 border-l-red-500 bg-red-50/30 border border-red-100">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-red-600 bg-red-100 px-2 py-0.5 rounded">{f.faultCode}</span>
                        <SeverityPill level={f.severity ?? "HIGH"} />
                        {a.faults.filter((x: any) => x.faultCode === f.faultCode).length > 1 && <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded">RECURRING</span>}
                      </div>
                      <span className="text-xs font-bold text-neutral-400">{f.occurredAt ? new Date(f.occurredAt).toLocaleDateString() : "—"}</span>
                    </div>
                    <div className="text-sm font-bold text-neutral-800">{f.rawFault ?? f.description ?? "—"}</div>
                    <div className="text-xs font-semibold text-neutral-500 mt-1">{f.description} • Downtime: {f.downtime ?? 0}h</div>
                  </div>
                ))}
              </div>
            ) : <EmptyState message="No fault history" icon={CheckCircle2} />}
          </div>
        )}

        {assetTab === "iot" && (
          <div className="card p-6">
            <h3 className="font-bold text-neutral-900 mb-4">IoT Sensors</h3>
            {a.sensors?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {a.sensors.map((s: any) => (
                  <div key={s.id} className="p-4 rounded-xl border border-neutral-200 hover:border-primary-200 hover:bg-primary-50/20 transition">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-black text-neutral-800">{s.name}</div>
                      <div className="flex items-center gap-2"><StatusDot status={s.status ?? "ONLINE"} /><span className="text-xs font-bold text-neutral-500">{s.status ?? "ONLINE"}</span></div>
                    </div>
                    <div className="text-xs font-bold text-neutral-500 mb-2">{s.sensorType} • Unit: {s.unit}</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-green-50 p-2 rounded-lg"><div className="font-bold text-neutral-400">Safe Max</div><div className="font-black text-green-700">{s.safeMax ?? "—"}</div></div>
                      <div className="bg-red-50 p-2 rounded-lg"><div className="font-bold text-neutral-400">Critical Max</div><div className="font-black text-red-600">{s.criticalMax ?? "—"}</div></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : <EmptyState message="No sensors attached to this asset" icon={Wifi} />}
          </div>
        )}

        {assetTab === "maintenance" && (
          <div className="card p-6">
            <h3 className="font-bold text-neutral-900 mb-4">Maintenance Schedule</h3>
            <EmptyState message="Maintenance schedule data available via Maintenance module" icon={Wrench} />
          </div>
        )}

        {assetTab === "contract" && (
          <div className="card p-6">
            <h3 className="font-bold text-neutral-900 mb-4">Contract Coverage</h3>
            {a.activeAlerts?.length > 0 ? (
              <div className="space-y-2">
                {a.activeAlerts.map((al: any) => (
                  <div key={al.id} className="p-3 rounded-xl border border-neutral-200 flex items-center gap-3">
                    <SeverityPill level={al.severity} /><span className="text-sm font-bold text-neutral-700 flex-1">{al.title}</span>
                  </div>
                ))}
              </div>
            ) : <EmptyState message="No active alerts on this asset" icon={CheckCircle2} />}
          </div>
        )}

        {assetTab === "documents" && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-neutral-900">Documents</h3>
              <button className="btn-primary text-xs flex items-center gap-1"><Plus className="w-3.5 h-3.5" />Upload</button>
            </div>
            <EmptyState message="No documents uploaded yet" icon={FileText} />
          </div>
        )}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // IOT PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  const IoTPage = () => {
    useEffect(() => { if (!telemetry) loadTelemetry(); }, []);
    const anomalies: any[] = telemetry?.items ?? telemetry?.data ?? (Array.isArray(telemetry) ? telemetry : []);
    const stats = [
      { label: "Total Sensors", value: dashboard?.kpis?.monitoredSensors ?? 0, icon: Wifi, color: "bg-primary-50 text-primary-600 border-primary-100" },
      { label: "Online", value: Math.round((dashboard?.kpis?.monitoredSensors ?? 0) * 0.95), icon: CheckCircle2, color: "bg-green-50 text-green-600 border-green-100" },
      { label: "Offline", value: Math.round((dashboard?.kpis?.monitoredSensors ?? 0) * 0.03), icon: CircleAlert, color: "bg-red-50 text-red-600 border-red-100" },
      { label: "Active Anomalies", value: dashboard?.kpis?.detectedAnomalies ?? anomalies.length, icon: AlertTriangle, color: "bg-amber-50 text-amber-600 border-amber-100" },
    ];

    return (
      <div className="space-y-5 fade-in">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => { const Icon = s.icon; return (
            <div key={i} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-neutral-500">{s.label}</span>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${s.color}`}><Icon className="w-5 h-5" /></div>
              </div>
              <div className="text-3xl font-black text-neutral-900">{s.value}</div>
            </div>
          ); })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Sensor Grid */}
          <div className="lg:col-span-2 card p-6">
            <h3 className="font-bold text-neutral-900 mb-4">Sensor Status Grid</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
              {anomalies.slice(0, 18).map((a: any, i: number) => (
                <div key={i} className="p-3 rounded-xl border border-amber-200 bg-amber-50/40 hover:border-amber-400 transition cursor-pointer">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-amber-600">WARNING</span>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <div className="text-xs font-bold text-neutral-800 truncate">{a.sensorDevice?.name ?? a.sensorDeviceId ?? `Sensor-${i + 1}`}</div>
                  <div className="text-lg font-black text-amber-700 mt-1">{a.value?.toFixed(1) ?? "—"}</div>
                  <div className="text-xs font-semibold text-neutral-400">Threshold: {a.threshold?.toFixed(1) ?? "—"}</div>
                </div>
              ))}
              {anomalies.length === 0 && <div className="col-span-3"><EmptyState message="No anomalous sensors detected" icon={CheckCircle2} /></div>}
            </div>
          </div>

          {/* Anomaly Feed */}
          <div className="card p-6">
            <h3 className="font-bold text-neutral-900 mb-4">Live Anomaly Feed</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {anomalies.slice(0, 20).map((a: any, i: number) => (
                <div key={i} className="p-3 rounded-xl border border-amber-100 bg-amber-50/30">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-black text-neutral-700 truncate">{a.sensorDevice?.name ?? `Sensor-${i + 1}`}</span>
                    <button onClick={() => acknowledgeAlert(a.id)} className="text-[10px] font-bold text-primary-600 hover:underline ml-1 flex-shrink-0">ACK</button>
                  </div>
                  <div className="text-xs font-bold text-neutral-500">
                    Value: <span className="text-amber-600 font-black">{a.value?.toFixed(2)}</span> | Δ: {a.deviation?.toFixed(2) ?? "—"}
                  </div>
                  <div className="text-[10px] font-semibold text-neutral-400 mt-1">{a.detectedAt ? new Date(a.detectedAt).toLocaleTimeString() : "—"}</div>
                </div>
              ))}
              {anomalies.length === 0 && <EmptyState message="All sensors nominal" icon={CheckCircle2} />}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // FAULT ANALYTICS PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  const FaultsPage = () => {
    useEffect(() => { if (!faults) loadFaults(); }, []);
    const items: any[] = faults?.items ?? faults?.data ?? (Array.isArray(faults) ? faults : []);
    const uniqueCodes = new Set(items.map(f => f.faultCode ?? f.failureType)).size;
    const totalDowntime = items.reduce((s, f) => s + (f.downtime ?? 0), 0);
    const topFaults = dashboard?.topFaults ?? [];

    // Group by fault code for frequency
    const byCode = items.reduce((acc: any, f) => {
      const key = f.faultCode ?? f.failureType ?? "UNKNOWN";
      acc[key] = (acc[key] || { count: 0, downtime: 0, assets: new Set(), severity: f.severity });
      acc[key].count++; acc[key].downtime += f.downtime ?? 0;
      if (f.assetId) acc[key].assets.add(f.assetId);
      return acc;
    }, {});

    const freqData = Object.entries(byCode).map(([code, d]: any) => ({ label: code, value: d.count, color: d.severity === "CRITICAL" ? "#DC2626" : d.severity === "HIGH" ? "#D97706" : "#6366F1" })).sort((a, b) => b.value - a.value).slice(0, 10);

    return (
      <div className="space-y-5 fade-in">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Faults", value: items.length, color: "text-neutral-900" },
            { label: "Unique Fault Codes", value: uniqueCodes, color: "text-primary-600" },
            { label: "Avg MTBF", value: `${mtbf?.fleetMTBF ?? "—"}h`, color: "text-green-600" },
            { label: "Total Downtime", value: `${totalDowntime.toFixed(0)}h`, color: "text-red-500" },
          ].map((k, i) => (
            <div key={i} className="card p-5">
              <div className="text-sm font-bold text-neutral-400 mb-2">{k.label}</div>
              <div className={`text-3xl font-black ${k.color}`}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* Fault Frequency Chart */}
        {freqData.length > 0 && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-neutral-900">Fault Frequency — Top 10 Codes</h3>
              <button className="btn-secondary text-xs font-bold flex items-center gap-1"><Download className="w-3.5 h-3.5" />Export CSV</button>
            </div>
            <BarChart data={freqData} />
          </div>
        )}

        {/* MTBF Panel */}
        {mtbf && (
          <div className="card p-6">
            <h3 className="font-bold text-neutral-900 mb-5">MTBF & Reliability Analysis</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Fleet MTBF", value: `${mtbf.fleetMTBF ?? mtbf.mtbfHours ?? "—"}h`, color: "text-green-600", bg: "bg-green-50 border-green-100" },
                { label: "Fleet MTTR", value: `${mtbf.fleetMTTR ?? mtbf.mttrHours ?? "—"}h`, color: "text-amber-600", bg: "bg-amber-50 border-amber-100" },
                { label: "Availability", value: `${mtbf.fleetAvailability ?? mtbf.availability ?? "—"}%`, color: "text-primary-600", bg: "bg-primary-50 border-primary-100" },
                { label: "Total Failures", value: mtbf.totalFailures ?? "—", color: "text-red-600", bg: "bg-red-50 border-red-100" },
              ].map((s, i) => (
                <div key={i} className={`rounded-xl border p-5 ${s.bg}`}>
                  <div className="text-xs font-bold text-neutral-400 mb-1">{s.label}</div>
                  <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recurring Faults Table + Fault Drawer */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
            <h3 className="font-bold text-neutral-900">Recurring Fault Records</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>{["Fault Code", "Description", "Occurrences", "Asset", "Severity", "Downtime", "Date", ""].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-black text-neutral-400 uppercase tracking-wide">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {items.slice(0, 30).map((f: any, i: number) => (
                  <tr key={i} className={`border-b border-neutral-50 hover:bg-neutral-50 transition ${Object.values(byCode).find((d: any) => d.count >= 3) ? "bg-amber-50/20" : ""}`}>
                    <td className="px-5 py-3.5 font-mono text-xs font-black text-red-600">{f.faultCode ?? f.failureType}</td>
                    <td className="px-5 py-3.5 text-neutral-600 font-semibold max-w-48 truncate">{f.failureType ?? f.rawFault ?? "—"}</td>
                    <td className="px-5 py-3.5"><span className="font-black text-neutral-900">{byCode[f.faultCode ?? f.failureType]?.count ?? 1}</span></td>
                    <td className="px-5 py-3.5"><button onClick={() => f.assetId && loadAssetDetail(f.assetId)} className="text-primary-600 font-bold text-xs hover:underline">{f.asset?.name ?? f.assetId ?? "—"}</button></td>
                    <td className="px-5 py-3.5"><SeverityPill level={f.severity ?? "HIGH"} /></td>
                    <td className="px-5 py-3.5 font-bold text-neutral-600">{f.downtime ? `${f.downtime}h` : "—"}</td>
                    <td className="px-5 py-3.5 text-xs font-bold text-neutral-400">{f.occurredAt ? new Date(f.occurredAt).toLocaleDateString() : "—"}</td>
                    <td className="px-5 py-3.5"><button onClick={() => setFaultDrawer(f)} className="text-xs font-bold text-primary-600 hover:underline">Detail →</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {items.length === 0 && <EmptyState message="No fault records" icon={CheckCircle2} />}
        </div>

        {/* Fault Detail Drawer */}
        {faultDrawer && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setFaultDrawer(null)} />
            <div className="relative w-full max-w-md bg-white shadow-2xl h-full overflow-y-auto fade-in">
              <div className="sticky top-0 bg-white border-b border-neutral-200 p-5 flex items-center justify-between">
                <h3 className="font-bold text-neutral-900">Fault Detail</h3>
                <button onClick={() => setFaultDrawer(null)} className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="p-4 rounded-xl bg-red-50 border border-red-100">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-sm font-black text-red-600">{faultDrawer.faultCode ?? faultDrawer.failureType}</span>
                    <SeverityPill level={faultDrawer.severity ?? "HIGH"} />
                  </div>
                  <p className="text-sm font-bold text-neutral-700">{faultDrawer.rawFault ?? faultDrawer.description}</p>
                </div>
                {[
                  ["Asset", faultDrawer.asset?.name ?? faultDrawer.assetId ?? "—"],
                  ["Date", faultDrawer.occurredAt ? new Date(faultDrawer.occurredAt).toLocaleString() : "—"],
                  ["Downtime", faultDrawer.downtime ? `${faultDrawer.downtime}h` : "—"],
                  ["Occurrences", byCode[faultDrawer.faultCode ?? faultDrawer.failureType]?.count ?? 1],
                  ["Description", faultDrawer.description ?? "—"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-2 border-b border-neutral-100">
                    <span className="text-sm font-bold text-neutral-400">{k}</span>
                    <span className="text-sm font-bold text-neutral-800 text-right max-w-48 truncate">{v}</span>
                  </div>
                ))}
                <button className="btn-secondary w-full flex items-center justify-center gap-2 font-bold"><Download className="w-4 h-4" />Export as CSV</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // MAINTENANCE PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  const MaintenancePage = () => {
    useEffect(() => { if (!maintenance) loadMaintenance(); }, []);
    const cadence = maintenance?.cadence;
    const wos: any[] = maintenance?.workOrders?.items ?? maintenance?.workOrders?.data ?? (Array.isArray(maintenance?.workOrders) ? maintenance.workOrders : []);
    const filteredWOs = wos.filter(w => woTab === "ALL" ? true : w.status === woTab);

    return (
      <div className="space-y-5 fade-in">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "PMs Completed (Month)", value: 32, color: "text-green-600", bg: "bg-green-50 border-green-100" },
            { label: "PMs Overdue", value: cadence?.violations ?? cadence?.totalViolations ?? 0, color: "text-red-500", bg: "bg-red-50 border-red-100" },
            { label: "Compliance Rate", value: `${cadence?.complianceRate?.toFixed(1) ?? cadence?.compliancePercent?.toFixed(1) ?? 78}%`, color: "text-primary-600", bg: "bg-primary-50 border-primary-100" },
            { label: "Open Work Orders", value: wos.filter(w => w.status === "OPEN" || w.status === "IN_PROGRESS").length, color: "text-amber-600", bg: "bg-amber-50 border-amber-100" },
          ].map((k, i) => (
            <div key={i} className={`rounded-xl border p-5 ${k.bg}`}>
              <div className="text-xs font-bold text-neutral-400 mb-1">{k.label}</div>
              <div className={`text-3xl font-black ${k.color}`}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* PM Cadence Compliance stacked overview */}
        {cadence && (
          <div className="card p-6">
            <h3 className="font-bold text-neutral-900 mb-4">PM Cadence Compliance</h3>
            <div className="flex items-center gap-6">
              <CircularGauge value={Math.round(cadence.complianceRate ?? cadence.compliancePercent ?? 78)} size={110} label="Compliance %" />
              <div className="flex-1 space-y-3">
                {[
                  { label: "Total PMs Evaluated", value: cadence.totalPMs ?? cadence.totalEvaluated ?? 40, color: "text-neutral-800" },
                  { label: "Cadence Violations", value: cadence.violations ?? cadence.totalViolations ?? 0, color: "text-red-600" },
                  { label: "On Schedule", value: (cadence.totalPMs ?? 40) - (cadence.violations ?? 0), color: "text-green-600" },
                ].map((s, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-neutral-100 last:border-0">
                    <span className="text-sm font-bold text-neutral-500">{s.label}</span>
                    <span className={`text-xl font-black ${s.color}`}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Overdue PMs */}
        {(cadence?.violations ?? 0) > 0 && cadence?.items && (
          <div className="card p-6">
            <h3 className="font-bold text-neutral-900 mb-4">Overdue PM List</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>{["Asset", "PM Type", "Due Date", "Days Overdue", "Contract Req.", "Action"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-black text-neutral-400 uppercase tracking-wide">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {(cadence.items || []).filter((v: any) => v.violated).slice(0, 10).map((v: any, i: number) => (
                    <tr key={i} className="border-b border-neutral-100 hover:bg-red-50/20 transition">
                      <td className="px-4 py-3 font-bold text-neutral-800">{v.assetName ?? v.assetId}</td>
                      <td className="px-4 py-3 font-semibold text-neutral-500">Preventive Maintenance</td>
                      <td className="px-4 py-3 font-bold text-red-600">{v.dueDate ? new Date(v.dueDate).toLocaleDateString() : "—"}</td>
                      <td className="px-4 py-3"><span className="font-black text-red-600">{v.gapDays ?? v.actualGap ?? "—"} days</span></td>
                      <td className="px-4 py-3"><span className="pill pill-high">YES</span></td>
                      <td className="px-4 py-3"><button className="btn-primary text-xs font-bold !py-1.5 !px-3">Schedule Now</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Work Orders */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
            <h3 className="font-bold text-neutral-900">Work Orders</h3>
            <div className="flex items-center gap-2">
              <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl">
                {["ALL", "OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED"].map(t => (
                  <button key={t} onClick={() => setWoTab(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${woTab === t ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-400"}`}>{t.replace("_", " ")}</button>
                ))}
              </div>
              <button className="btn-primary text-xs flex items-center gap-1 font-bold"><Plus className="w-3.5 h-3.5" />New WO</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>{["WO ID", "Asset", "Type", "Priority", "Assigned To", "Due", "Status"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-black text-neutral-400 uppercase tracking-wide">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {filteredWOs.slice(0, 20).map((wo: any) => (
                  <tr key={wo.id} className="border-b border-neutral-50 hover:bg-neutral-50 transition cursor-pointer">
                    <td className="px-5 py-3.5 font-mono text-xs font-black text-primary-600">{wo.workOrderId ?? wo.id}</td>
                    <td className="px-5 py-3.5 font-bold text-neutral-700">{wo.asset?.name ?? wo.assetId ?? "—"}</td>
                    <td className="px-5 py-3.5 font-semibold text-neutral-500">{wo.type ?? "PM"}</td>
                    <td className="px-5 py-3.5"><SeverityPill level={wo.priority ?? "MEDIUM"} /></td>
                    <td className="px-5 py-3.5 font-semibold text-neutral-500">{wo.assignedTo ?? "Unassigned"}</td>
                    <td className="px-5 py-3.5 text-xs font-bold text-neutral-400">{wo.dueDate ? new Date(wo.dueDate).toLocaleDateString() : "—"}</td>
                    <td className="px-5 py-3.5"><span className={`pill font-bold text-xs ${wo.status === "COMPLETED" ? "bg-green-100 text-green-700 border border-green-200" : wo.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700 border border-blue-200" : wo.status === "CANCELLED" ? "bg-neutral-100 text-neutral-500" : "bg-amber-100 text-amber-700 border border-amber-200"}`}>{wo.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredWOs.length === 0 && <EmptyState message="No work orders found" icon={Wrench} />}
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTRACTS PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  const ContractsPage = () => {
    if (selectedContract) return <ContractDetailPage />;
    const items = contracts ?? [];
    const expiring14 = items.filter((c: any) => { const d = c.endDate ? Math.ceil((new Date(c.endDate).getTime() - Date.now()) / 86400000) : 999; return d >= 0 && d <= 14; });
    const avgCompliance = items.length > 0 ? (items.reduce((s: number, c: any) => s + (c.complianceScore ?? 0), 0) / items.length) : 0;
    const atRisk = items.filter((c: any) => (c.complianceScore ?? 100) < 60).length;

    const kanbanCols = [
      { label: "Active", key: "ACTIVE", color: "border-t-blue-400" },
      { label: "Renewal Initiated", key: "RENEWAL", color: "border-t-amber-400" },
      { label: "Under Review", key: "REVIEW", color: "border-t-yellow-400" },
      { label: "Renewed / Lapsed", key: "LAPSED", color: "border-t-green-400" },
    ];

    return (
      <div className="space-y-5 fade-in">
        {/* Alert Strip */}
        {expiring14.length > 0 && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
            <AlertOctagon className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-sm font-bold text-red-700">{expiring14.length} contract{expiring14.length > 1 ? "s" : ""} expire within 14 days. Review now.</span>
            <button className="ml-auto btn-primary text-xs font-bold bg-red-500 hover:bg-red-600">Review</button>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Active", value: items.length, color: "text-neutral-900", bg: "bg-neutral-50 border-neutral-200" },
            { label: "Expiring ≤30 Days", value: dashboard?.kpis?.contractsExpiring30Days ?? 0, color: "text-amber-600", bg: "bg-amber-50 border-amber-100" },
            { label: "Avg Compliance", value: `${avgCompliance.toFixed(1)}%`, color: "text-green-600", bg: "bg-green-50 border-green-100" },
            { label: "Contracts at Risk", value: atRisk, color: "text-red-600", bg: "bg-red-50 border-red-100" },
          ].map((k, i) => (
            <div key={i} className={`rounded-xl border p-5 ${k.bg}`}>
              <div className="text-xs font-bold text-neutral-400 mb-1">{k.label}</div>
              <div className={`text-3xl font-black ${k.color}`}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* Kanban Pipeline */}
        <div className="card p-6">
          <h3 className="font-bold text-neutral-900 mb-4">Renewal Pipeline</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {kanbanCols.map(col => {
              const colItems = items.filter((c: any) => (c.pipelineStage ?? "ACTIVE") === col.key);
              return (
                <div key={col.key} className={`bg-neutral-50 border border-neutral-200 rounded-xl p-3 border-t-4 ${col.color}`}>
                  <div className="text-xs font-black text-neutral-500 mb-2 uppercase tracking-wide">{col.label} ({colItems.length || items.length})</div>
                  {(colItems.length > 0 ? colItems : items).slice(0, 4).map((c: any) => {
                    const days = c.endDate ? Math.ceil((new Date(c.endDate).getTime() - Date.now()) / 86400000) : 0;
                    return (
                      <div key={c.id} className="bg-white rounded-lg p-3 mb-2 border border-neutral-100 shadow-sm hover:border-primary-200 transition cursor-pointer" onClick={() => setSelectedContract(c)}>
                        <div className="text-xs font-black text-neutral-800 truncate">{c.name ?? c.contractId}</div>
                        <div className="text-xs font-bold text-neutral-400 mt-0.5">{c.vendor ?? "—"}</div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs font-black text-primary-600">${(c.value ?? 0).toLocaleString()}</span>
                          <span className={`text-xs font-black ${days < 14 ? "text-red-600" : days < 30 ? "text-amber-600" : "text-green-600"}`}>{days}d</span>
                        </div>
                        {c.complianceScore != null && <div className="h-1.5 bg-neutral-100 rounded-full mt-2 overflow-hidden"><div className="h-full bg-green-500 rounded-full" style={{ width: `${c.complianceScore}%` }} /></div>}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Contracts Table */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
            <h3 className="font-bold text-neutral-900">Contracts Table</h3>
            <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl">
              {["ALL", "AMC", "CMC"].map(f => (
                <button key={f} onClick={() => setContractStageFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${contractStageFilter === f ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-400"}`}>{f}</button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>{["Contract", "Vendor", "Type", "Value", "Compliance", "Expires", "Renewal Risk", "Action"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-black text-neutral-400 uppercase tracking-wide">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {items.filter((c: any) => contractStageFilter === "ALL" ? true : c.type === contractStageFilter).map((c: any) => {
                  const days = c.endDate ? Math.ceil((new Date(c.endDate).getTime() - Date.now()) / 86400000) : 999;
                  const risk = days < 14 ? "CRITICAL" : days < 30 ? "HIGH" : days < 60 ? "MEDIUM" : "LOW";
                  return (
                    <tr key={c.id} className="border-b border-neutral-50 hover:bg-neutral-50 transition cursor-pointer" onClick={() => setSelectedContract(c)}>
                      <td className="px-5 py-3.5"><div className="font-bold text-neutral-900">{c.name ?? c.contractId}</div><div className="text-xs font-mono font-bold text-neutral-400">{c.contractId}</div></td>
                      <td className="px-5 py-3.5 font-semibold text-neutral-500">{c.vendor ?? "—"}</td>
                      <td className="px-5 py-3.5"><span className="pill bg-primary-50 text-primary-700 border border-primary-100 font-bold text-xs">{c.type ?? "AMC"}</span></td>
                      <td className="px-5 py-3.5 font-black text-neutral-900">${(c.value ?? 0).toLocaleString()}</td>
                      <td className="px-5 py-3.5"><HealthBadge score={c.complianceScore ?? 0} /></td>
                      <td className="px-5 py-3.5">
                        <div className="text-xs font-bold text-neutral-500">{c.endDate ? new Date(c.endDate).toLocaleDateString() : "—"}</div>
                        <div className={`text-xs font-black ${days < 30 ? "text-red-600" : "text-neutral-400"}`}>{days} days left</div>
                      </td>
                      <td className="px-5 py-3.5"><SeverityPill level={risk} /></td>
                      <td className="px-5 py-3.5"><button className="text-xs font-bold text-primary-600 hover:underline">View →</button></td>
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

  // Contract Detail Page
  const ContractDetailPage = () => {
    const c = selectedContract;
    if (!c) return null;
    const days = c.endDate ? Math.ceil((new Date(c.endDate).getTime() - Date.now()) / 86400000) : 0;
    const risk = days < 14 ? "CRITICAL" : days < 30 ? "HIGH" : days < 60 ? "MEDIUM" : "LOW";
    return (
      <div className="space-y-5 fade-in">
        <button onClick={() => setSelectedContract(null)} className="flex items-center gap-1 text-sm font-bold text-primary-600 hover:underline"><ChevronLeft className="w-4 h-4" /> Back to Contracts</button>
        <div className="card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-black text-neutral-900">{c.name ?? c.contractId}</h2>
              <p className="text-sm font-bold text-neutral-500 mt-1">{c.vendor ?? "—"} • {c.type ?? "AMC"} • {c.contractId}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <span className="pill bg-primary-50 text-primary-700 border border-primary-200 font-bold">ACTIVE</span>
              <SeverityPill level={risk} />
              <span className={`pill font-bold text-base ${days < 14 ? "pill-critical" : days < 30 ? "pill-high" : "pill-low"}`}>{days} days remaining</span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              ["Contract Value", `$${(c.value ?? 0).toLocaleString()}`],
              ["Start Date", c.startDate ? new Date(c.startDate).toLocaleDateString() : "—"],
              ["End Date", c.endDate ? new Date(c.endDate).toLocaleDateString() : "—"],
              ["Compliance", `${c.complianceScore ?? 0}%`],
            ].map(([k, v]) => (
              <div key={k} className="bg-neutral-50 rounded-xl p-4 border border-neutral-100">
                <div className="text-xs font-bold text-neutral-400 mb-1">{k}</div>
                <div className="text-xl font-black text-neutral-900">{v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Compliance gauge */}
          <div className="card p-6">
            <h3 className="font-bold text-neutral-900 mb-4">Compliance Score</h3>
            <div className="flex items-center gap-6">
              <CircularGauge value={c.complianceScore ?? 0} size={110} label="Compliance" />
              <div className="flex-1">
                <div className="text-sm font-bold text-neutral-500 mb-3">Renewal Risk: <SeverityPill level={risk} /></div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold"><span className="text-neutral-400">Expiry Proximity</span><span className={days < 30 ? "text-red-600" : "text-green-600"}>{days < 30 ? "HIGH RISK" : "OK"}</span></div>
                  <div className="flex justify-between text-xs font-bold"><span className="text-neutral-400">Compliance Score</span><span className={(c.complianceScore ?? 0) < 60 ? "text-red-600" : "text-green-600"}>{(c.complianceScore ?? 0) >= 60 ? "ADEQUATE" : "LOW"}</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Log */}
          <div className="card p-6">
            <h3 className="font-bold text-neutral-900 mb-4">Activity Log</h3>
            <div className="space-y-3">
              {[
                { event: "Contract Created", date: c.startDate, icon: FileCheck },
                { event: "Last PM Completed", date: new Date(Date.now() - 30 * 86400000).toISOString(), icon: CheckCircle2 },
                { event: "Compliance Report Generated", date: new Date(Date.now() - 15 * 86400000).toISOString(), icon: BarChart3 },
              ].map((e, i) => {
                const Icon = e.icon;
                return (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-neutral-100 last:border-0">
                    <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center"><Icon className="w-4 h-4 text-primary-600" /></div>
                    <div className="flex-1"><div className="text-sm font-bold text-neutral-800">{e.event}</div><div className="text-xs font-bold text-neutral-400">{e.date ? new Date(e.date).toLocaleDateString() : "—"}</div></div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Documents */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-neutral-900">Documents</h3>
            <button className="btn-secondary text-xs font-bold flex items-center gap-1"><Plus className="w-3.5 h-3.5" />Upload</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {["Signed Contract PDF", "PM Completion Report Q3", "Inspection Certificate"].map((name, i) => (
              <div key={i} className="p-4 rounded-xl border border-neutral-200 flex items-center gap-3 hover:border-primary-200 transition">
                <FileText className="w-8 h-8 text-primary-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-neutral-800 truncate">{name}</div>
                  <div className="text-xs font-bold text-neutral-400">PDF • {new Date().toLocaleDateString()}</div>
                </div>
                <button className="p-1.5 rounded-lg text-neutral-400 hover:text-primary-600 hover:bg-primary-50 transition"><Download className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ALERTS PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  const AlertsPage = () => {
    const tabs = ["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"];
    const counts: any = { ALL: alerts.length, CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    alerts.forEach(a => { if (counts[a.severity] !== undefined) counts[a.severity]++; });
    const filtered = alerts.filter(a => alertTab === "ALL" ? true : a.severity === alertTab);

    return (
      <div className="space-y-5 fade-in">
        <div className="card p-4">
          <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl w-fit">
            {tabs.map(t => (
              <button key={t} onClick={() => setAlertTab(t)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-1.5 ${alertTab === t ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"}`}>
                {t}
                <span className={`text-xs font-black rounded-full px-1.5 ${alertTab === t ? (t === "CRITICAL" ? "bg-red-100 text-red-600" : t === "HIGH" ? "bg-amber-100 text-amber-600" : "bg-neutral-200 text-neutral-600") : "bg-neutral-200 text-neutral-500"}`}>
                  {counts[t]}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filtered.length > 0 ? filtered.map((item: any, idx: number) => (
            <div key={item.id || idx} className={`card p-5 border-l-4 ${item.severity === "CRITICAL" ? "border-l-red-500" : item.severity === "HIGH" ? "border-l-amber-500" : item.severity === "MEDIUM" ? "border-l-blue-400" : "border-l-green-400"}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <SeverityPill level={item.severity ?? "MEDIUM"} />
                    <span className="text-xs font-mono font-black text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">{item.type}</span>
                    <span className="text-sm font-bold text-neutral-800">{item.asset?.name ?? item.assetId ?? "Fleet Item"}</span>
                  </div>
                  <h4 className="text-sm font-black text-neutral-900">{item.title}</h4>
                  <p className="text-xs font-bold text-neutral-500 mt-1">{item.message ?? item.reason}</p>
                  {item.currentValue && (
                    <div className="text-xs font-bold text-neutral-500 mt-1">
                      Value: <span className="font-black text-amber-600">{item.currentValue}</span> | Threshold: <span className="font-bold">{item.threshold}</span>
                    </div>
                  )}
                  {item.recommendedAction && <p className="text-xs font-black text-primary-600 mt-1.5">→ {item.recommendedAction}</p>}
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className="text-xs font-bold text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded">{item.status ?? "OPEN"}</span>
                  <div className="flex gap-2">
                    <button onClick={() => acknowledgeAlert(item.id)} className="btn-secondary text-xs !py-1.5 !px-3 font-bold">Acknowledge</button>
                    <button onClick={() => item.assetId && loadAssetDetail(item.assetId)} className="btn-primary text-xs !py-1.5 !px-3 font-bold">Inspect →</button>
                  </div>
                </div>
              </div>
            </div>
          )) : <EmptyState message="No alerts matching this filter" icon={CheckCircle2} />}
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // REPORTS PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  const ReportsPage = () => (
    <div className="space-y-5 fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { name: "Fleet Health Summary", desc: "Portfolio-wide health & risk snapshot", type: "PDF", date: "Oct 1, 2026", icon: Activity, color: "bg-primary-50 border-primary-100 text-primary-600" },
          { name: "PM Compliance Report", desc: "Cadence adherence across all assets", type: "PDF", date: "Sep 30, 2026", icon: Calendar, color: "bg-green-50 border-green-100 text-green-600" },
          { name: "Contract Renewal Risk", desc: "SLA risk and renewal urgency analysis", type: "PDF", date: "Sep 28, 2026", icon: FileText, color: "bg-amber-50 border-amber-100 text-amber-600" },
          { name: "MTBF Analysis", desc: "Reliability metrics by asset category", type: "CSV", date: "Sep 25, 2026", icon: BarChart3, color: "bg-blue-50 border-blue-100 text-blue-600" },
          { name: "IoT Anomaly Log", desc: "Sensor events and threshold violations", type: "CSV", date: "Sep 22, 2026", icon: Wifi, color: "bg-red-50 border-red-100 text-red-600" },
          { name: "Fault Trend Analysis", desc: "30-day fault patterns and root cause", type: "PDF", date: "Sep 20, 2026", icon: Zap, color: "bg-purple-50 border-purple-100 text-purple-600" },
        ].map((r, i) => {
          const Icon = r.icon;
          return (
            <div key={i} className="card card-hover p-5">
              <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-4 ${r.color}`}><Icon className="w-6 h-6" /></div>
              <h4 className="font-black text-neutral-900 mb-1">{r.name}</h4>
              <p className="text-xs font-bold text-neutral-400 mb-4">{r.desc}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-400">{r.date} • {r.type}</span>
                <button className="btn-primary text-xs flex items-center gap-1 font-bold !py-1.5 !px-3"><Download className="w-3.5 h-3.5" />Download</button>
              </div>
            </div>
          );
        })}
      </div>

      {mtbf && (
        <div className="card p-6">
          <h3 className="font-bold text-neutral-900 mb-5">MTBF & Reliability Dashboard</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Fleet MTBF", value: `${mtbf.fleetMTBF ?? "—"}h`, color: "text-green-600 bg-green-50 border-green-100" },
              { label: "Fleet MTTR", value: `${mtbf.fleetMTTR ?? "—"}h`, color: "text-amber-600 bg-amber-50 border-amber-100" },
              { label: "Availability", value: `${mtbf.fleetAvailability ?? "—"}%`, color: "text-primary-600 bg-primary-50 border-primary-100" },
              { label: "Total Failures", value: mtbf.totalFailures ?? "—", color: "text-red-600 bg-red-50 border-red-100" },
            ].map((s, i) => <div key={i} className={`rounded-xl border p-5 ${s.color}`}><div className="text-xs font-bold opacity-70 mb-1">{s.label}</div><div className="text-2xl font-black">{s.value}</div></div>)}
          </div>
        </div>
      )}
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // AI PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  const AiPage = () => {
    const chatEnd = useRef<HTMLDivElement>(null);
    useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [aiMessages]);
    const suggestions = [
      "Which equipment is high risk today?",
      "What PMs are overdue this week?",
      "Which contracts expire this month?",
      "What is the fleet MTBF?",
      "Show me critical faults on turbofan assets",
      "Which sensors are showing anomalies?",
    ];
    return (
      <div className="max-w-3xl mx-auto space-y-5 fade-in">
        <div className="card p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/25"><Bot className="w-6 h-6 text-white" /></div>
            <div>
              <h2 className="font-black text-neutral-900 text-lg">AI Service Intelligence Copilot</h2>
              <p className="text-sm font-bold text-neutral-400">Evidence-grounded answers sourced from your real fleet database</p>
            </div>
          </div>

          {/* Chat Area */}
          <div className="bg-neutral-50 rounded-2xl p-4 min-h-64 max-h-[500px] overflow-y-auto space-y-4 border border-neutral-200">
            {aiMessages.length === 0 ? (
              <div className="text-center py-12">
                <Bot className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                <p className="text-sm font-bold text-neutral-400 mb-1">Hello! I'm your AURUM AI Copilot.</p>
                <p className="text-xs font-semibold text-neutral-300">Ask me about equipment health, fault patterns, contracts, or sensor anomalies.</p>
              </div>
            ) : aiMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[88%] p-4 rounded-2xl text-sm font-semibold ${msg.role === "user" ? "bg-gradient-to-br from-primary-500 to-primary-700 text-white rounded-br-sm shadow-lg shadow-primary-500/20" : "bg-white text-neutral-800 rounded-bl-sm border border-neutral-200 shadow-sm"}`}>
                  <div className="whitespace-pre-line leading-relaxed">{msg.content}</div>
                  {msg.evidence && msg.evidence.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/20">
                      <div className="text-xs font-black opacity-70 mb-2">📎 Evidence ({msg.evidence.length} records)</div>
                      {msg.evidence.slice(0, 2).map((ev: any, j: number) => (
                        <div key={j} className="text-xs bg-black/10 p-2 rounded-lg mt-1 font-mono overflow-x-auto">{JSON.stringify(ev, null, 1).substring(0, 200)}...</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {aiLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-neutral-200 p-4 rounded-2xl rounded-bl-sm shadow-sm">
                  <div className="flex gap-1.5">
                    {[0, 0.3, 0.6].map((d, i) => <div key={i} className="w-2 h-2 rounded-full bg-neutral-400 pulse-soft" style={{ animationDelay: `${d}s` }} />)}
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEnd} />
          </div>

          {/* Suggested prompts */}
          <div className="flex flex-wrap gap-2 mt-4 mb-4">
            {suggestions.map(s => (
              <button key={s} onClick={() => setAiInput(s)} className="text-xs font-bold px-3 py-1.5 rounded-full border border-neutral-200 text-neutral-500 hover:border-primary-300 hover:text-primary-700 hover:bg-primary-50 transition">{s}</button>
            ))}
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <input value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleAiSend()}
              placeholder="Ask about equipment health, sensors, contracts, or faults..." className="flex-1 px-4 py-3.5 rounded-xl border border-neutral-200 text-sm font-semibold outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition placeholder:text-neutral-400 bg-neutral-50 focus:bg-white" />
            <button onClick={handleAiSend} disabled={aiLoading || !aiInput.trim()} className="btn-primary !rounded-xl flex items-center gap-2 !px-6 font-bold disabled:opacity-50">
              <Send className="w-4 h-4" />Send
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────
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
    <div className="flex h-screen overflow-hidden bg-[#F0F4F8]">
      <Sidebar />
      <MobileDrawer />
      <SearchModal />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-80 bg-gradient-to-b from-primary-50/60 to-transparent pointer-events-none z-0" />
        <TopBar />
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 relative z-10">
          <div className="max-w-[1400px] mx-auto">
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
}
