import { ReactNode, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSSE } from '../../hooks/useSSE';
import { useIncidents } from '../../api/incidents';
import { useHospitals, useVolunteers } from '../../api/resources';
import { useBroadcasts } from '../../api/broadcasts';
import {
  LogOut, LayoutDashboard, Activity,
  Megaphone, Settings, BarChart3, Shield, RefreshCw,
  TrendingUp, TrendingDown, AlertCircle, CheckCircle,
  Bell, AlertTriangle, Users,
} from 'lucide-react';
import { Badge } from '../../components/Badge';
import { StatusBadge } from '../../components/StatusBadge';
import { formatSeverity } from '../../lib/formatters';

// ─── Layout Shell ──────────────────────────────────────────────────────────────
interface GovPortalProps { children?: ReactNode }

export function GovPortal({ children }: GovPortalProps) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, logout } = useAuth();
  const { connectionState } = useSSE();

  const navItems = [
    { path: '/gov',            label: 'Dashboard',   icon: LayoutDashboard },
    { path: '/gov/broadcasts', label: 'Broadcasts',  icon: Megaphone },
    { path: '/gov/analytics',  label: 'Analytics',   icon: BarChart3 },
    { path: '/gov/settings',   label: 'Settings',    icon: Settings },
  ];

  const isActive = (path: string) => {
    if (path === '/gov') return location.pathname === '/gov';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-64 bg-white border-r border-paper-border flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-paper-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-navy rounded-sm flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <div>
              <span className="text-navy font-semibold text-sm">QuickAid</span>
              <span className="text-xs text-ink-muted block">Command</span>
            </div>
          </div>
        </div>
        <div className="px-6 py-3 border-b border-paper-border flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connectionState === 'connected' ? 'bg-teal' : 'bg-amber'}`} />
          <span className="text-xs font-mono text-ink-muted">
            {connectionState === 'connected' ? 'LIVE' : 'RECONNECTING'}
          </span>
        </div>
        <nav className="flex-1 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <button
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center gap-3 px-6 py-2.5 text-sm font-medium ${
                      isActive(item.path) ? 'bg-navy text-white' : 'text-ink hover:bg-paper-hover'
                    }`}
                  >
                    <Icon size={16} />{item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="p-4 border-t border-paper-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-navy-light rounded-full flex items-center justify-center">
              <Shield size={14} className="text-navy" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink truncate">{user?.fullName || 'Administrator'}</p>
              <Badge variant="success" className="text-[10px]">{user?.role || 'gov_admin'}</Badge>
            </div>
          </div>
          <button onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-ink-muted hover:text-ink hover:bg-paper-hover rounded-sm">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto bg-paper">{children}</main>
    </div>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────
// Government-focused: numbers, thresholds, AI suggestions, map, resources

interface Threshold {
  id: string;
  metric: string;
  warnAt: number;
  critAt: number;
  unit: string;
}

const DEFAULT_THRESHOLDS: Threshold[] = [
  { id: 'open_incidents',    metric: 'Open Incidents',        warnAt: 10, critAt: 20, unit: '' },
  { id: 'critical_severity', metric: 'Critical Severity',     warnAt: 3,  critAt: 5,  unit: '' },
  { id: 'bed_occupancy',     metric: 'Hospital Bed Occupancy', warnAt: 70, critAt: 85, unit: '%' },
  { id: 'avg_response',      metric: 'Avg Response Time',     warnAt: 8,  critAt: 12, unit: 'min' },
];

type AlertLevel = 'ok' | 'warn' | 'critical';
function getAlertLevel(value: number, t: Threshold): AlertLevel {
  if (value >= t.critAt) return 'critical';
  if (value >= t.warnAt) return 'warn';
  return 'ok';
}

const AI_SUGGESTIONS: Record<string, string[]> = {
  open_incidents: [
    'Based on historical patterns, surges above 20 open incidents typically correlate with major weather events. Consider pre-positioning additional responders in affected zones.',
    'Activate standby supervisor teams and request mutual aid from neighbouring regional command centres.',
  ],
  critical_severity: [
    'Critical case clusters historically require 2–3× resource deployment. Recommend activating the Emergency Operations Centre (EOC) protocol.',
    'Alert SGH and NUH trauma teams and request pre-positioning of mobile ICU support.',
  ],
  bed_occupancy: [
    'At >85% system occupancy, consider issuing a diversion advisory to route non-critical patients to Alexandra or CGH.',
    'Contact MOH for coordinated discharge of stable inpatients to community hospitals to free up acute beds.',
  ],
  avg_response: [
    'Response time deterioration above 8 min typically signals responder overload. Review current assignments and redistribute workload.',
    'Activate reserve responder teams on standby and consider dynamic zone rebalancing.',
  ],
};

export function GovDashboard() {
  const [thresholds, setThresholds] = useState<Threshold[]>(DEFAULT_THRESHOLDS);
  const [showThresholdEditor, setShowThresholdEditor] = useState(false);
  const [activeAlert, setActiveAlert] = useState<Threshold | null>(null);

  const { data: incidentsData,  isLoading: incL, refetch: refI } = useIncidents({ limit: 100 });
  const { data: hospitalsData,  isLoading: hosL, refetch: refH } = useHospitals();
  const { data: volunteersData, isLoading: volL, refetch: refV } = useVolunteers();
  const { data: broadcastsData, isLoading: brdL, refetch: refB } = useBroadcasts({ limit: 50 });

  const incidents  = incidentsData?.incidents   || [];
  const hospitals  = hospitalsData?.hospitals   || [];
  const volunteers = volunteersData?.volunteers || [];
  const broadcasts = broadcastsData?.broadcasts || [];

  const openIncidents      = incidents.filter(i => i.status !== 'resolved' && i.status !== 'closed');
  const criticalIncidents  = incidents.filter(i => i.severity === 1);
  const resolvedToday      = incidents.filter(i => i.status === 'resolved' || i.status === 'closed');
  const totalBeds          = hospitals.reduce((s, h) => s + h.totalBeds, 0);
  const availableBeds      = hospitals.reduce((s, h) => s + h.availableBeds, 0);
  const bedOccupancy       = totalBeds > 0 ? Math.round(((totalBeds - availableBeds) / totalBeds) * 100) : 0;
  const availableVolunteers = volunteers.filter(v => v.isAvailable);
  const avgResponseTime    = 4.2; // mock — would come from analytics API

  const metricValues: Record<string, number> = {
    open_incidents:    openIncidents.length,
    critical_severity: criticalIncidents.length,
    bed_occupancy:     bedOccupancy,
    avg_response:      avgResponseTime,
  };

  const alertedThresholds = thresholds.filter(t => getAlertLevel(metricValues[t.id] ?? 0, t) !== 'ok');

  const handleRefresh = () => { refI(); refH(); refV(); refB(); };
  const isRefreshing = incL || hosL || volL || brdL;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink mb-1">Command Dashboard</h1>
          <p className="text-sm text-ink-muted">Real-time national emergency overview</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowThresholdEditor(true)}
            className="flex items-center gap-2 px-4 py-2 border border-paper-border rounded-sm hover:bg-paper-hover text-sm text-ink">
            <Bell size={16} /> Thresholds
          </button>
          <button onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-sm hover:bg-navy-dark transition-colors text-sm">
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Active Threshold Alerts */}
      {alertedThresholds.length > 0 && (
        <div className="mb-6 space-y-2">
          {alertedThresholds.map(t => {
            const level = getAlertLevel(metricValues[t.id] ?? 0, t);
            return (
              <div key={t.id}
                className={`flex items-center justify-between p-4 rounded-sm border ${
                  level === 'critical'
                    ? 'bg-red-light border-red'
                    : 'bg-amber-light border-amber'
                }`}>
                <div className="flex items-center gap-3">
                  <AlertCircle size={18} className={level === 'critical' ? 'text-red' : 'text-amber-dark'} />
                  <div>
                    <p className={`font-semibold text-sm ${level === 'critical' ? 'text-red-dark' : 'text-amber-dark'}`}>
                      {level === 'critical' ? '🔴 CRITICAL' : '🟡 WARNING'}: {t.metric}
                    </p>
                    <p className={`text-xs ${level === 'critical' ? 'text-red-dark' : 'text-amber-dark'} opacity-80`}>
                      Current: <strong>{metricValues[t.id]}{t.unit}</strong> — threshold: {level === 'critical' ? t.critAt : t.warnAt}{t.unit}
                    </p>
                  </div>
                </div>
                <button onClick={() => setActiveAlert(t)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-sm ${
                    level === 'critical'
                      ? 'bg-red text-white hover:bg-red-dark'
                      : 'bg-amber text-white hover:bg-amber-dark'
                  } transition-colors`}>
                  AI Suggestion
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* KPI Cards — numbers focus */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard
          title="Total Incidents"
          value={incidents.length}
          sub={`${openIncidents.length} active`}
          icon={<AlertTriangle size={20} className="text-amber" />}
          trend={openIncidents.length > 10 ? 'up' : 'stable'}
          trendLabel={`${openIncidents.length} open`}
        />
        <KPICard
          title="Critical Cases"
          value={criticalIncidents.length}
          sub="severity level 1"
          icon={<AlertCircle size={20} className="text-red" />}
          trend={criticalIncidents.length > 3 ? 'up' : 'stable'}
          trendLabel={criticalIncidents.length > 0 ? 'Needs attention' : 'Under control'}
          alert={criticalIncidents.length > 3}
        />
        <KPICard
          title="Hospital Capacity"
          value={availableBeds}
          sub={`${bedOccupancy}% occupancy`}
          icon={<Activity size={20} className="text-teal" />}
          trend={bedOccupancy > 80 ? 'up' : 'stable'}
          trendLabel={`${totalBeds} total beds`}
          alert={bedOccupancy > 85}
        />
        <KPICard
          title="Resolved Today"
          value={resolvedToday.length}
          sub={`of ${incidents.length} total`}
          icon={<CheckCircle size={20} className="text-teal" />}
          trend="stable"
          trendLabel={`${Math.round((resolvedToday.length / Math.max(incidents.length, 1)) * 100)}% resolution rate`}
        />
      </div>

      {/* Second row KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard title="Avg Response Time" value={`${avgResponseTime}m`} sub="vs 5min target"
          icon={<BarChart3 size={20} className="text-navy" />} trend="stable" trendLabel="Within SLA" />
        <KPICard title="Available Volunteers" value={availableVolunteers.length} sub={`of ${volunteers.length} registered`}
          icon={<Users size={20} className="text-teal" />} trend="stable" trendLabel="Ready to deploy" />
        <KPICard title="Recent Broadcasts" value={broadcasts.slice(0, 5).length} sub="last 24 hours"
          icon={<Megaphone size={20} className="text-navy" />} trend="stable" trendLabel="Public comms" />
        <KPICard title="Agencies Active" value={7} sub="coordinating now"
          icon={<Shield size={20} className="text-navy" />} trend="stable" trendLabel="SCDF, SPF, MOH…" />
      </div>

      {/* Incident breakdown by type & severity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-paper-border rounded-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-paper-border">
            <h2 className="font-medium text-ink">Incidents by Type</h2>
          </div>
          <div className="p-4 space-y-3">
            {[
              { type: 'Medical',        count: incidents.filter(i => i.type === 'medical').length,        color: 'bg-red' },
              { type: 'Flood',          count: incidents.filter(i => i.type === 'flood').length,          color: 'bg-blue-500' },
              { type: 'Fire',           count: incidents.filter(i => i.type === 'fire').length,           color: 'bg-orange-500' },
              { type: 'Road',           count: incidents.filter(i => i.type === 'road').length,           color: 'bg-amber' },
              { type: 'Infrastructure', count: incidents.filter(i => i.type === 'infrastructure').length, color: 'bg-purple-500' },
              { type: 'Civil',          count: incidents.filter(i => i.type === 'civil').length,          color: 'bg-navy' },
              { type: 'Other',          count: incidents.filter(i => i.type === 'other').length,          color: 'bg-ink-muted' },
            ].filter(r => r.count > 0).map(row => {
              const pct = incidents.length > 0 ? Math.round((row.count / incidents.length) * 100) : 0;
              return (
                <div key={row.type}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-ink">{row.type}</span>
                    <span className="font-semibold text-ink">{row.count} <span className="text-ink-muted font-normal text-xs">({pct}%)</span></span>
                  </div>
                  <div className="h-2 bg-paper-border rounded-full overflow-hidden">
                    <div className={`h-full ${row.color} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {incidents.length === 0 && <p className="text-sm text-ink-muted text-center py-4">No incidents</p>}
          </div>
        </div>

        {/* Severity distribution */}
        <div className="bg-white border border-paper-border rounded-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-paper-border">
            <h2 className="font-medium text-ink">Severity Distribution</h2>
          </div>
          <div className="p-6">
            <div className="flex items-end justify-around gap-4 h-32 mb-4">
              {[
                { label: 'Critical (1)', count: incidents.filter(i => i.severity === 1).length, color: 'bg-red' },
                { label: 'High (2)',     count: incidents.filter(i => i.severity === 2).length, color: 'bg-amber' },
                { label: 'Medium (3)',   count: incidents.filter(i => i.severity === 3).length, color: 'bg-teal' },
              ].map(bar => {
                const maxCount = Math.max(...[1, 2, 3].map(s => incidents.filter(i => i.severity === s).length), 1);
                const heightPct = (bar.count / maxCount) * 100;
                return (
                  <div key={bar.label} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-lg font-bold text-ink">{bar.count}</span>
                    <div className="w-full flex items-end" style={{ height: '60px' }}>
                      <div className={`w-full ${bar.color} rounded-t`} style={{ height: `${Math.max(heightPct, 5)}%` }} />
                    </div>
                    <span className="text-xs text-ink-muted text-center">{bar.label}</span>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-paper-border pt-3 grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'Open',       count: incidents.filter(i => i.status === 'open').length },
                { label: 'Dispatched', count: incidents.filter(i => i.status === 'dispatched' || i.status === 'on_scene').length },
                { label: 'Resolved',   count: incidents.filter(i => i.status === 'resolved' || i.status === 'closed').length },
              ].map(s => (
                <div key={s.label}>
                  <p className="text-xl font-bold text-ink">{s.count}</p>
                  <p className="text-xs text-ink-muted">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Hospital capacity overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-paper-border rounded-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-paper-border">
            <h2 className="font-medium text-ink flex items-center gap-2">
              <Activity size={16} /> Hospital Capacity
            </h2>
          </div>
          <div className="p-4 space-y-3">
            {/* System summary */}
            <div className="grid grid-cols-3 gap-3 pb-3 border-b border-paper-border">
              {[
                { label: 'Available Beds', value: availableBeds, warn: availableBeds < totalBeds * 0.2 },
                { label: 'ICU Available',  value: hospitals.reduce((s, h) => s + h.icuAvailable, 0), warn: false },
                { label: 'Occupancy %',    value: `${bedOccupancy}%`, warn: bedOccupancy > 80 },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <p className={`text-xl font-bold ${s.warn ? 'text-red' : 'text-ink'}`}>{s.value}</p>
                  <p className="text-[10px] text-ink-muted">{s.label}</p>
                </div>
              ))}
            </div>
            {hospitals.slice(0, 4).map(hospital => {
              const pct = hospital.totalBeds > 0 ? (hospital.availableBeds / hospital.totalBeds) * 100 : 0;
              const bar = pct > 30 ? 'bg-teal' : pct > 10 ? 'bg-amber' : 'bg-red';
              return (
                <div key={hospital.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-ink">{hospital.name}</span>
                    <span className="text-sm text-ink-muted">{hospital.availableBeds}/{hospital.totalBeds}</span>
                  </div>
                  <div className="h-2 bg-paper-border rounded-full overflow-hidden">
                    <div className={`h-full ${bar} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Volunteer & resource summary */}
        <div className="bg-white border border-paper-border rounded-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-paper-border">
            <h2 className="font-medium text-ink flex items-center gap-2">
              <Users size={16} /> Resource Summary
            </h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Volunteers Available', value: availableVolunteers.length, total: volunteers.length, color: 'bg-teal' },
                { label: 'Hospitals Active',     value: hospitals.filter(h => h.availableBeds > 0).length, total: hospitals.length, color: 'bg-navy' },
              ].map(r => (
                <div key={r.label} className="bg-paper rounded-sm p-3 text-center">
                  <p className="text-2xl font-bold text-ink">{r.value}</p>
                  <p className="text-xs text-ink-muted mt-0.5">{r.label}</p>
                  <div className="h-1.5 bg-paper-border rounded-full overflow-hidden mt-2">
                    <div className={`h-full ${r.color} rounded-full`} style={{ width: `${r.total > 0 ? (r.value / r.total) * 100 : 0}%` }} />
                  </div>
                  <p className="text-[10px] text-ink-muted mt-1">of {r.total} total</p>
                </div>
              ))}
            </div>

            {/* Recent broadcasts */}
            <div>
              <p className="text-xs font-mono font-semibold text-ink-muted uppercase mb-2">Recent Broadcasts</p>
              {broadcasts.slice(0, 3).map(b => (
                <div key={b.id} className="flex items-center justify-between py-2 border-b border-paper-border last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{b.title}</p>
                    <p className="text-xs text-ink-muted">{b.sentBy.name}</p>
                  </div>
                  <Badge variant="info" className="text-[10px] ml-2">{b.audience}</Badge>
                </div>
              ))}
              {broadcasts.length === 0 && <p className="text-sm text-ink-muted">No recent broadcasts</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Threshold Editor Modal */}
      {showThresholdEditor && (
        <ThresholdEditorModal
          thresholds={thresholds}
          metricValues={metricValues}
          onSave={setThresholds}
          onClose={() => setShowThresholdEditor(false)}
        />
      )}

      {/* AI Suggestion Modal */}
      {activeAlert && (
        <AISuggestionModal
          threshold={activeAlert}
          currentValue={metricValues[activeAlert.id] ?? 0}
          suggestions={AI_SUGGESTIONS[activeAlert.id] || []}
          onClose={() => setActiveAlert(null)}
        />
      )}
    </div>
  );
}

// ─── KPI Card ──────────────────────────────────────────────────────────────────
function KPICard({
  title, value, sub, icon, trend, trendLabel, alert = false,
}: {
  title: string; value: string | number; sub: string; icon: React.ReactNode;
  trend: 'up' | 'down' | 'stable'; trendLabel: string; alert?: boolean;
}) {
  return (
    <div className={`bg-white border rounded-sm p-4 ${alert ? 'border-red' : 'border-paper-border'}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-xs font-medium text-ink">{title}</span>
        </div>
        {alert && <div className="w-2 h-2 rounded-full bg-red animate-pulse" />}
      </div>
      <div className="text-3xl font-bold text-ink mb-1">{value}</div>
      <p className="text-xs text-ink-muted mb-1">{sub}</p>
      <div className="flex items-center gap-1 text-xs">
        {trend === 'up' ? <TrendingUp size={12} className="text-red" /> :
         trend === 'down' ? <TrendingDown size={12} className="text-teal" /> :
         <span className="w-3 h-px bg-ink-muted inline-block" />}
        <span className={trend === 'up' ? 'text-red' : trend === 'down' ? 'text-teal' : 'text-ink-muted'}>
          {trendLabel}
        </span>
      </div>
    </div>
  );
}

// ─── Threshold Editor ──────────────────────────────────────────────────────────
function ThresholdEditorModal({
  thresholds, metricValues, onSave, onClose,
}: {
  thresholds: Threshold[]; metricValues: Record<string, number>;
  onSave: (t: Threshold[]) => void; onClose: () => void;
}) {
  const [local, setLocal] = useState<Threshold[]>(JSON.parse(JSON.stringify(thresholds)));

  const update = (id: string, field: 'warnAt' | 'critAt', value: string) => {
    setLocal(prev => prev.map(t => t.id === id ? { ...t, [field]: parseFloat(value) || 0 } : t));
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-sm w-full max-w-lg">
        <div className="px-6 py-4 border-b border-paper-border flex items-center justify-between">
          <h2 className="font-semibold text-ink flex items-center gap-2"><Bell size={18} /> Alert Thresholds</h2>
          <button onClick={onClose} className="text-ink-muted hover:text-ink text-xl">×</button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-ink-muted">Set warning and critical thresholds. Alerts will appear on the dashboard when values are exceeded.</p>
          {local.map(t => {
            const current = metricValues[t.id] ?? 0;
            const level = getAlertLevel(current, t);
            return (
              <div key={t.id} className="bg-paper rounded-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-ink">{t.metric}</span>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                    level === 'critical' ? 'bg-red-light text-red-dark' :
                    level === 'warn' ? 'bg-amber-light text-amber-dark' :
                    'bg-teal-light text-teal-dark'
                  }`}>
                    Current: {current}{t.unit}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-amber-dark mb-1">⚠ Warning at</label>
                    <div className="flex items-center gap-1">
                      <input type="number" value={t.warnAt}
                        onChange={e => update(t.id, 'warnAt', e.target.value)}
                        className="w-full px-3 py-1.5 border border-paper-border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-amber"
                      />
                      {t.unit && <span className="text-xs text-ink-muted">{t.unit}</span>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-red-dark mb-1">🔴 Critical at</label>
                    <div className="flex items-center gap-1">
                      <input type="number" value={t.critAt}
                        onChange={e => update(t.id, 'critAt', e.target.value)}
                        className="w-full px-3 py-1.5 border border-paper-border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-red"
                      />
                      {t.unit && <span className="text-xs text-ink-muted">{t.unit}</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="px-6 py-4 border-t border-paper-border flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-paper-border rounded-sm text-sm hover:bg-paper-hover">Cancel</button>
          <button onClick={() => { onSave(local); onClose(); }}
            className="px-4 py-2 bg-navy text-white rounded-sm text-sm hover:bg-navy-dark">
            Save Thresholds
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── AI Suggestion Modal ───────────────────────────────────────────────────────
function AISuggestionModal({
  threshold, currentValue, suggestions, onClose,
}: {
  threshold: Threshold; currentValue: number; suggestions: string[]; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-sm w-full max-w-lg">
        <div className="px-6 py-4 border-b border-paper-border flex items-center justify-between">
          <h2 className="font-semibold text-ink flex items-center gap-2">
            <Shield size={18} className="text-navy" /> AI Recommendation
          </h2>
          <button onClick={onClose} className="text-ink-muted hover:text-ink text-xl">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-red-light border border-red rounded-sm p-3">
            <p className="text-sm font-semibold text-red-dark">{threshold.metric}</p>
            <p className="text-xs text-red-dark opacity-80">
              Current value: <strong>{currentValue}{threshold.unit}</strong> (critical threshold: {threshold.critAt}{threshold.unit})
            </p>
          </div>
          <div>
            <p className="text-xs font-mono font-semibold text-ink-muted uppercase mb-3">Recommended Actions (based on historical data)</p>
            <div className="space-y-3">
              {suggestions.map((s, i) => (
                <div key={i} className="flex gap-3 bg-paper p-3 rounded-sm">
                  <div className="w-6 h-6 bg-navy text-white rounded-full text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-sm text-ink leading-relaxed">{s}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-ink-muted bg-paper-hover rounded-sm p-2.5">
            These suggestions are generated based on historical incident patterns and current resource levels. Final decisions remain with the command officer on duty.
          </p>
        </div>
        <div className="px-6 py-4 border-t border-paper-border flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-navy text-white rounded-sm text-sm hover:bg-navy-dark">
            Acknowledged
          </button>
        </div>
      </div>
    </div>
  );
}