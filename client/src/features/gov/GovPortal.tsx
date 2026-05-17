import { ReactNode, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSSE } from '../../hooks/useSSE';
import { useIncidents } from '../../api/incidents';
import { useHospitals, useVolunteers } from '../../api/resources';
import { useBroadcasts } from '../../api/broadcasts';
import {
  LogOut,
  LayoutDashboard,
  AlertTriangle,
  Activity,
  Users,
  Megaphone,
  Settings,
  BarChart3,
  Shield,
  RefreshCw,
} from 'lucide-react';
import { Badge } from '../../components/Badge';
import { StatusBadge } from '../../components/StatusBadge';
import { formatSeverity } from '../../lib/formatters';
import { IncidentListItem } from '../../types';

// ─── Layout Shell ──────────────────────────────────────────────────────────────

interface GovPortalProps {
  children?: ReactNode;
}

export function GovPortal({ children }: GovPortalProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { connectionState } = useSSE();

  const navItems = [
    { path: '/gov',            label: 'Dashboard',   icon: LayoutDashboard },
    { path: '/gov/incidents',  label: 'Incidents',   icon: AlertTriangle },
    { path: '/gov/resources',  label: 'Resources',   icon: Activity },
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
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-paper-border flex flex-col">
        {/* Logo */}
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

        {/* Connection indicator */}
        <div className="px-6 py-3 border-b border-paper-border flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              connectionState === 'connected' ? 'bg-teal' : 'bg-amber'
            }`}
          />
          <span className="text-xs font-mono text-ink-muted">
            {connectionState === 'connected' ? 'LIVE' : 'RECONNECTING'}
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <button
                    onClick={() => navigate(item.path)}
                    className={`
                      w-full flex items-center gap-3 px-6 py-2.5 text-sm font-medium
                      ${
                        isActive(item.path)
                          ? 'bg-navy text-white'
                          : 'text-ink hover:bg-paper-hover'
                      }
                    `}
                  >
                    <Icon size={16} />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-paper-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-navy-light rounded-full flex items-center justify-center">
              <Shield size={14} className="text-navy" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink truncate">
                {user?.fullName || 'Administrator'}
              </p>
              <Badge variant="success" className="text-[10px]">
                {user?.role || 'gov_admin'}
              </Badge>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2
              text-sm text-ink-muted hover:text-ink hover:bg-paper-hover rounded-sm
            "
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content — renders whatever Routes the parent passes in */}
      <main className="flex-1 overflow-auto bg-paper">
        {children}
      </main>
    </div>
  );
}

// ─── Dashboard View ────────────────────────────────────────────────────────────

export function GovDashboard() {
  const {
    data: incidentsData,
    isLoading: incidentsLoading,
    refetch: refetchIncidents,
  } = useIncidents({ limit: 100 });
  const {
    data: hospitalsData,
    isLoading: hospitalsLoading,
    refetch: refetchHospitals,
  } = useHospitals();
  const {
    data: volunteersData,
    isLoading: volunteersLoading,
    refetch: refetchVolunteers,
  } = useVolunteers();
  const {
    data: broadcastsData,
    isLoading: broadcastsLoading,
    refetch: refetchBroadcasts,
  } = useBroadcasts({ limit: 50 });

  const incidents  = incidentsData?.incidents   || [];
  const hospitals  = hospitalsData?.hospitals   || [];
  const volunteers = volunteersData?.volunteers || [];
  const broadcasts = broadcastsData?.broadcasts || [];

  const criticalIncidents    = incidents.filter((i) => i.severity === 3);
  const highSeverityIncidents = incidents.filter((i) => i.severity === 2);
  const openIncidents        = incidents.filter((i) => i.status !== 'resolved' && i.status !== 'closed');
  const availableVolunteers  = volunteers.filter((v) => v.isAvailable);
  const totalBeds            = hospitals.reduce((s, h) => s + h.totalBeds,     0);
  const availableBeds        = hospitals.reduce((s, h) => s + h.availableBeds, 0);

  const handleRefresh = () => {
    refetchIncidents();
    refetchHospitals();
    refetchVolunteers();
    refetchBroadcasts();
  };

  const isRefreshing = incidentsLoading || hospitalsLoading || volunteersLoading || broadcastsLoading;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-ink mb-1">Command Dashboard</h1>
            <p className="text-sm text-ink-muted">Real-time emergency response overview</p>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-sm
              hover:bg-navy-dark transition-colors"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Status Banner */}
      {(criticalIncidents.length > 0 || highSeverityIncidents.length > 0) && (
        <div className="mb-6 bg-red-light border border-red rounded-sm p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className="text-red" />
            <div>
              <p className="font-medium text-red">Active Emergency Response</p>
              <p className="text-sm text-red-dark">
                {criticalIncidents.length} critical and {highSeverityIncidents.length}{' '}
                high-severity incidents require immediate attention.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Active Incidents"
          value={openIncidents.length}
          total={incidents.length}
          icon={<AlertTriangle size={20} className="text-amber" />}
          trend={criticalIncidents.length > 0 ? 'critical' : 'normal'}
        />
        <StatCard
          title="Hospital Capacity"
          value={availableBeds}
          total={totalBeds}
          icon={<Activity size={20} className="text-teal" />}
          unit="beds"
          trend={totalBeds > 0 && availableBeds / totalBeds < 0.2 ? 'critical' : 'normal'}
        />
        <StatCard
          title="Available Volunteers"
          value={availableVolunteers.length}
          total={volunteers.length}
          icon={<Users size={20} className="text-navy" />}
          trend="normal"
        />
        <StatCard
          title="Recent Broadcasts"
          value={broadcasts.slice(0, 5).length}
          total={broadcasts.length}
          icon={<Megaphone size={20} className="text-teal" />}
          trend="normal"
        />
      </div>

      {/* Recent Incidents */}
      <div className="bg-white border border-paper-border rounded-sm overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-paper-border flex items-center justify-between">
          <h2 className="font-medium text-ink">Recent Incidents</h2>
          <button className="text-sm text-teal hover:text-teal-dark">View All</button>
        </div>
        <div className="divide-y divide-paper-border">
          {incidents.slice(0, 5).map((incident) => (
            <div key={incident.id} className="px-4 py-3 hover:bg-paper-hover">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-ink">{incident.title}</h3>
                    <StatusBadge status={incident.status} />
                  </div>
                  <div className="flex items-center gap-3 text-sm text-ink-muted">
                    <span>{incident.locationText}</span>
                    <span>·</span>
                    <span>{formatSeverity(incident.severity)}</span>
                  </div>
                </div>
                <div className="text-xs text-ink-muted">
                  {new Date(incident.createdAt).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          {incidents.length === 0 && (
            <div className="px-4 py-8 text-center text-ink-muted">No recent incidents</div>
          )}
        </div>
      </div>

      {/* System Resources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Hospital Status */}
        <div className="bg-white border border-paper-border rounded-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-paper-border">
            <h2 className="font-medium text-ink flex items-center gap-2">
              <Activity size={16} />
              Hospital Status
            </h2>
          </div>
          <div className="p-4 space-y-3">
            {hospitals.slice(0, 4).map((hospital) => {
              const pct = hospital.totalBeds > 0
                ? (hospital.availableBeds / hospital.totalBeds) * 100
                : 0;
              const bar =
                pct > 30 ? 'bg-teal' : pct > 10 ? 'bg-amber' : 'bg-red';
              return (
                <div key={hospital.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-ink">{hospital.name}</span>
                    <span className="text-sm text-ink-muted">
                      {hospital.availableBeds}/{hospital.totalBeds}
                    </span>
                  </div>
                  <div className="h-2 bg-paper-border rounded-full overflow-hidden">
                    <div
                      className={`h-full ${bar} rounded-full transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Broadcasts */}
        <div className="bg-white border border-paper-border rounded-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-paper-border">
            <h2 className="font-medium text-ink flex items-center gap-2">
              <Megaphone size={16} />
              Recent Broadcasts
            </h2>
          </div>
          <div className="divide-y divide-paper-border">
            {broadcasts.slice(0, 4).map((broadcast) => (
              <div key={broadcast.id} className="px-4 py-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-ink text-sm mb-1">
                      {broadcast.title}
                    </h3>
                    <p className="text-sm text-ink-muted line-clamp-2">
                      {broadcast.message}
                    </p>
                  </div>
                  <Badge variant="info" className="text-xs ml-2">
                    {broadcast.audience}
                  </Badge>
                </div>
              </div>
            ))}
            {broadcasts.length === 0 && (
              <div className="px-4 py-8 text-center text-ink-muted">
                No recent broadcasts
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  title,
  value,
  total,
  icon,
  unit,
  trend,
}: {
  title: string;
  value: number;
  total: number;
  icon: React.ReactNode;
  unit?: string;
  trend: 'normal' | 'critical';
}) {
  const percentage   = total > 0 ? Math.round((value / total) * 100) : 0;
  const dotColor     = trend === 'critical' ? 'bg-red' : 'bg-teal';

  return (
    <div className="bg-white border border-paper-border rounded-sm p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium text-ink">{title}</span>
        </div>
        <div className={`w-2 h-2 rounded-full ${dotColor}`} />
      </div>
      <div className="text-2xl font-bold text-ink mb-1">
        {value}
        {unit && <span className="text-sm font-normal text-ink-muted ml-1">{unit}</span>}
      </div>
      <div className="text-xs text-ink-muted">
        {percentage}% of {total} total
      </div>
    </div>
  );
}