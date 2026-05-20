import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIncidents } from '../../api/incidents';
import { authStore } from '../../stores/authStore';
import { IncidentListItem } from '../../types';
import { formatIncidentType } from '../../lib/formatters';
import { StatusBadge } from '../../components/StatusBadge';
import {
  RefreshCw, Search, CheckCircle, Clock, MapPin, Eye, Activity, AlertTriangle,
  Flame, Droplets, Heart, Car, Building2, Flag, HelpCircle, User, LayoutDashboard,
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

function QueueRow({ incident, onClick }: { incident: IncidentListItem; onClick: () => void }) {
  const TYPE_ICONS: Record<string, React.ReactNode> = {
    fire:           <Flame      size={13} className="text-orange-600" />,
    flood:          <Droplets   size={13} className="text-blue-600"   />,
    medical:        <Heart      size={13} className="text-red-600"    />,
    road:           <Car        size={13} className="text-yellow-600" />,
    infrastructure: <Building2  size={13} className="text-purple-600" />,
    civil:          <Flag       size={13} className="text-navy"       />,
    other:          <HelpCircle size={13} className="text-ink-muted"  />,
  };

  return (
    <tr
      onClick={onClick}
      className="border-b border-paper-border cursor-pointer hover:bg-paper-hover border-l-4 border-l-navy"
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
        <span className="text-xs font-mono text-ink-muted">{timeAgo(incident.createdAt)}</span>
      </td>
      <td className="px-4 py-3 w-32">
        <span className="flex items-center gap-1 text-xs text-teal">
          View <Activity size={11} />
        </span>
      </td>
    </tr>
  );
}

export function MyWorkView() {
  const navigate = useNavigate();
  const user = authStore(s => s.user);
  const [search, setSearch] = useState('');

  const { data, isLoading, refetch } = useIncidents({ limit: 200 });
  const incidents = data?.incidents || [];

  const myIncidents = useMemo(() => {
    let filtered = incidents.filter(i =>
      i.assignedTo?.unit === user?.unit &&
      !['resolved', 'closed'].includes(i.status)
    );

    if (search.trim()) {
      filtered = filtered.filter(i =>
        i.title.toLowerCase().includes(search.toLowerCase()) ||
        i.locationText.toLowerCase().includes(search.toLowerCase()) ||
        i.ticketNumber.toLowerCase().includes(search.toLowerCase())
      );
    }

    return filtered.sort((a, b) => a.severity - b.severity);
  }, [incidents, user?.unit, search]);

  const activeCount = myIncidents.filter(i => ['triaging', 'dispatched', 'on_scene'].includes(i.status)).length;
  const reviewCount = myIncidents.filter(i => i.status === 'open').length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-ink mb-1">Incident Queue</h1>
          <p className="text-sm text-ink-muted">
            Incidents assigned to your team/unit: <span className="font-semibold">{user?.unit || 'Unknown'}</span>
          </p>
        </div>
        <button onClick={() => refetch()}
          className="flex items-center gap-2 px-3 py-2 border border-paper-border rounded-sm hover:bg-paper-hover text-sm text-ink-muted">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {[
          { label: 'Active', value: activeCount, icon: <Activity size={20} className="text-teal" />, sub: 'dispatched / on scene' },
          { label: 'Review', value: reviewCount, icon: <LayoutDashboard size={20} className="text-navy" />, sub: 'awaiting validation' },
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-paper-border rounded-sm p-4">
            <div className="flex items-start justify-between mb-2">
              {stat.icon}
            </div>
            <div className="text-2xl font-bold text-ink">{stat.value}</div>
            <div className="text-xs text-ink-muted mt-0.5">{stat.label}</div>
            <div className="text-[10px] text-ink-muted">{stat.sub}</div>
          </div>
        ))}
      </div>

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
            <p className="text-sm text-ink-muted">Loading your incidents…</p>
          </div>
        </div>
      ) : myIncidents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-ink-muted">
          <User size={40} className="opacity-30 mb-3" />
          <p className="text-sm font-medium text-ink">No incidents assigned to your team</p>
          <p className="text-xs mt-1">Supervisors will assign incidents to your unit - they will appear here</p>
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
              {myIncidents.map(incident => (
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