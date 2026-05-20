import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIncidents } from '../../api/incidents';
import { IncidentListItem } from '../../types';
import { formatIncidentType } from '../../lib/formatters';
import { StatusBadge } from '../../components/StatusBadge';
import {
  RefreshCw, Search, Activity, MapPin, Clock, Siren, AlertTriangle,
  Flame, Droplets, Heart, Car, Building2, Flag, HelpCircle, Users,
} from 'lucide-react';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  fire:           <Flame      size={13} className="text-orange-600" />,
  flood:          <Droplets   size={13} className="text-blue-600"   />,
  medical:        <Heart      size={13} className="text-red-600"    />,
  road:           <Car        size={13} className="text-yellow-600" />,
  infrastructure: <Building2  size={13} className="text-purple-600" />,
  civil:          <Flag       size={13} className="text-navy"       />,
  other:          <HelpCircle size={13} className="text-ink-muted"  />,
};

function timeAgo(d: string) {
  const date = new Date(d);
  if (isNaN(date.getTime())) return 'unknown';
  const m = Math.floor((Date.now() - date.getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function elapsedMin(d: string) {
  const date = new Date(d);
  if (isNaN(date.getTime())) return 0;
  return Math.floor((Date.now() - date.getTime()) / 60000);
}

function QueueRow({ incident, onClick }: { incident: IncidentListItem; onClick: () => void }) {
  const sev = incident.severity === 1 ? 'border-l-red' :
            incident.severity === 2 ? 'border-l-amber' : 'border-l-teal';
  const elapsed = elapsedMin(incident.createdAt);
  const isOverdue = incident.severity === 1 && elapsed > 10 ||
                   incident.severity === 2 && elapsed > 20 ||
                   incident.severity === 3 && elapsed > 30;

  return (
    <tr
      onClick={onClick}
      className={`border-b border-paper-border cursor-pointer hover:bg-paper-hover border-l-4 ${sev}`}
    >
      <td className="px-4 py-3 w-10">
        <div className={`w-2.5 h-2.5 rounded-full ${
          incident.severity === 1 ? 'bg-red' :
          incident.severity === 2 ? 'bg-amber' : 'bg-teal'
        }`} />
      </td>
      <td className="px-4 py-3 w-32">
        <div className="font-mono text-xs font-bold text-ink">{incident.ticketNumber}</div>
        <div className="flex items-center gap-1 mt-0.5 text-[10px] text-ink-muted">
          {TYPE_ICONS[incident.type]} {formatIncidentType(incident.type)}
        </div>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm font-semibold text-ink">{incident.title}</p>
        <p className="text-xs text-ink-muted mt-0.5 flex items-center gap-1">
          <MapPin size={9} />{incident.locationText}
        </p>
      </td>
      <td className="px-4 py-3 w-28">
        <StatusBadge status={incident.status} />
      </td>
      <td className="px-4 py-3 w-44">
        {incident.assignedTo
          ? <div>
              <p className="text-xs font-medium text-ink">{incident.assignedTo.name}</p>
              <p className="text-[10px] text-ink-muted">{incident.assignedTo.unit}</p>
            </div>
          : <span className="text-[10px] text-ink-muted italic">Unassigned</span>}
      </td>
      <td className="px-4 py-3 w-24">
        <span className={`text-xs font-mono ${isOverdue ? 'text-red font-bold' : 'text-ink-muted'}`}>
          {timeAgo(incident.createdAt)}
        </span>
      </td>
      <td className="px-4 py-3 w-32">
        <span className="flex items-center gap-1 text-xs text-teal">
          Details →
        </span>
      </td>
    </tr>
  );
}

export function InProgressView() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data, isLoading, refetch } = useIncidents({ limit: 200 });
  const incidents = data?.incidents || [];

  const activeIncidents = useMemo(() => {
    let filtered = incidents.filter(i =>
      ['triaging', 'dispatched', 'on_scene'].includes(i.status)
    );

    if (search.trim()) {
      filtered = filtered.filter(i =>
        i.title.toLowerCase().includes(search.toLowerCase()) ||
        i.locationText.toLowerCase().includes(search.toLowerCase()) ||
        i.ticketNumber.toLowerCase().includes(search.toLowerCase())
      );
    }

    return filtered.sort((a, b) => {
      // Sort by severity first, then by status priority
      if (a.severity !== b.severity) return a.severity - b.severity;

      const statusPriority = { 'on_scene': 1, 'dispatched': 2, 'triaging': 3 };
      const priorityA = statusPriority[a.status as keyof typeof statusPriority] || 4;
      const priorityB = statusPriority[b.status as keyof typeof statusPriority] || 4;

      if (priorityA !== priorityB) return priorityA - priorityB;

      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return (isNaN(dateA.getTime()) ? 0 : dateA.getTime()) - (isNaN(dateB.getTime()) ? 0 : dateB.getTime());
    });
  }, [incidents, search]);

  const criticalCount = activeIncidents.filter(i => i.severity === 1).length;
  const onSceneCount = activeIncidents.filter(i => i.status === 'on_scene').length;
  const dispatchedCount = activeIncidents.filter(i => i.status === 'dispatched').length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-ink mb-1">Active Incidents</h1>
          <p className="text-sm text-ink-muted">
            All incidents currently being handled by responders
          </p>
        </div>
        <button onClick={() => refetch()}
          className="flex items-center gap-2 px-3 py-2 border border-paper-border rounded-sm hover:bg-paper-hover text-sm text-ink-muted">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: 'Total Active',
            value: activeIncidents.length,
            icon: <Activity size={20} className="text-teal" />,
            sub: 'being handled now',
            alert: activeIncidents.length > 0,
          },
          {
            label: 'On Scene',
            value: onSceneCount,
            icon: <Users size={20} className="text-navy" />,
            sub: 'responders at location',
            alert: onSceneCount > 0,
          },
          {
            label: 'Dispatched',
            value: dispatchedCount,
            icon: <Activity size={20} className="text-amber-dark" />,
            sub: 'en route to location',
            alert: false,
          },
          {
            label: 'Critical',
            value: criticalCount,
            icon: <Siren size={20} className="text-red" />,
            sub: 'severity 1 — priority',
            alert: criticalCount > 0,
          },
        ].map((stat, i) => (
          <div key={i} className={`bg-white border rounded-sm p-4 ${stat.alert ? 'border-red' : 'border-paper-border'}`}>
            <div className="flex items-start justify-between mb-2">
              {stat.icon}
              {stat.alert && <div className="w-2 h-2 bg-red rounded-full animate-pulse" />}
            </div>
            <div className="text-2xl font-bold text-ink">{stat.value}</div>
            <div className="text-xs text-ink-muted mt-0.5">{stat.label}</div>
            <div className="text-[10px] text-ink-muted">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Critical alert banner */}
      {criticalCount > 0 && (
        <div className="mb-6 flex items-center gap-3 bg-red-light border border-red rounded-sm px-4 py-3">
          <AlertTriangle size={16} className="text-red flex-shrink-0 animate-pulse" />
          <p className="text-sm font-bold text-red-dark">
            {criticalCount} CRITICAL incident{criticalCount > 1 ? 's' : ''} active — immediate attention required
          </p>
        </div>
      )}

      {/* Search */}
      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search title, location, ticket…"
            className="w-full pl-8 pr-3 py-2 border border-paper-border rounded-sm text-xs focus:outline-none focus:ring-1 focus:ring-navy"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-navy mb-3" />
            <p className="text-sm text-ink-muted">Loading active incidents…</p>
          </div>
        </div>
      ) : activeIncidents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-ink-muted">
          <Activity size={40} className="opacity-30 mb-3" />
          <p className="text-sm font-medium text-ink">No active incidents</p>
          <p className="text-xs mt-1">Incidents being handled will appear here</p>
        </div>
      ) : (
        <div className="bg-white border border-paper-border rounded-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-paper border-b border-paper-border">
              <tr>
                {['', 'Ticket', 'Incident', 'Status', 'Assigned To', 'Age', ''].map((h, i) => (
                  <th key={i} className="text-left px-4 py-3 text-xs font-mono font-semibold text-ink-muted uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeIncidents.map(incident => (
                <QueueRow
                  key={incident.id}
                  incident={incident}
                  onClick={() => navigate(`/responder/ticket/${incident.id}`)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}