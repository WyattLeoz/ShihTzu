import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIncidents } from '../../api/incidents';
import { IncidentListItem } from '../../types';
import { formatIncidentType } from '../../lib/formatters';
import {
  RefreshCw, Search, CheckCircle, MapPin, Clock, TrendingUp, Calendar,
  Flame, Droplets, Heart, Car, Building2, Flag, HelpCircle, Shield,
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

function formatDateTime(d: string) {
  const date = new Date(d);
  if (isNaN(date.getTime())) return 'unknown';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function QueueRow({ incident, onClick }: { incident: IncidentListItem; onClick: () => void }) {
  const isResolved = incident.status === 'resolved';
  const isClosed = incident.status === 'closed';

  return (
    <tr
      onClick={onClick}
      className={`border-b border-paper-border cursor-pointer hover:bg-paper-hover border-l-4 ${
        isResolved ? 'border-l-teal' : 'border-l-ink-muted'
      }`}
    >
      <td className="px-4 py-3 w-10">
        <div className={`w-2.5 h-2.5 rounded-full ${
          isResolved ? 'bg-teal' : 'bg-ink-muted'
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
        <span className={`text-xs font-semibold px-2 py-1 rounded ${
          isResolved ? 'bg-teal-light text-teal-dark' :
          'bg-paper text-ink-muted'
        }`}>
          {incident.status === 'resolved' ? 'Resolved' : 'Closed'}
        </span>
      </td>
      <td className="px-4 py-3 w-44">
        {incident.assignedTo
          ? <div>
              <p className="text-xs font-medium text-ink">{incident.assignedTo.name}</p>
              <p className="text-[10px] text-ink-muted">{incident.assignedTo.unit}</p>
            </div>
          : <span className="text-[10px] text-ink-muted italic">Unassigned</span>}
      </td>
      <td className="px-4 py-3 w-32">
        <div className="text-xs text-ink-muted">
          <div className="flex items-center gap-1">
            <Clock size={9} /> {formatDateTime(incident.updatedAt)}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 w-24">
        <span className="text-xs font-mono text-ink-muted">{timeAgo(incident.createdAt)}</span>
      </td>
      <td className="px-4 py-3 w-32">
        <span className="flex items-center gap-1 text-xs text-teal">
          View Details →
        </span>
      </td>
    </tr>
  );
}

export function ResolvedView() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('week');

  const { data, isLoading, refetch } = useIncidents({ limit: 1000 });
  const incidents = data?.incidents || [];

  const resolvedIncidents = useMemo(() => {
    let filtered = incidents.filter(i =>
      ['resolved', 'closed'].includes(i.status)
    );

    // Date filter
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(todayStart);
    monthStart.setDate(monthStart.getDate() - 30);

    if (dateFilter === 'today') {
      filtered = filtered.filter(i => {
        const date = new Date(i.updatedAt);
        return !isNaN(date.getTime()) && date >= todayStart;
      });
    } else if (dateFilter === 'week') {
      filtered = filtered.filter(i => {
        const date = new Date(i.updatedAt);
        return !isNaN(date.getTime()) && date >= weekStart;
      });
    } else if (dateFilter === 'month') {
      filtered = filtered.filter(i => {
        const date = new Date(i.updatedAt);
        return !isNaN(date.getTime()) && date >= monthStart;
      });
    }

    // Search filter
    if (search.trim()) {
      filtered = filtered.filter(i =>
        i.title.toLowerCase().includes(search.toLowerCase()) ||
        i.locationText.toLowerCase().includes(search.toLowerCase()) ||
        i.ticketNumber.toLowerCase().includes(search.toLowerCase())
      );
    }

    return filtered.sort((a, b) => {
      const dateA = new Date(a.updatedAt);
      const dateB = new Date(b.updatedAt);
      return (isNaN(dateB.getTime()) ? 0 : dateB.getTime()) - (isNaN(dateA.getTime()) ? 0 : dateA.getTime());
    });
  }, [incidents, search, dateFilter]);

  const resolvedCount = resolvedIncidents.filter(i => i.status === 'resolved').length;
  const closedCount = resolvedIncidents.filter(i => i.status === 'closed').length;
  const todayResolved = resolvedIncidents.filter(i => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const date = new Date(i.updatedAt);
    return i.status === 'resolved' && !isNaN(date.getTime()) && date >= todayStart;
  }).length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-ink mb-1">Resolved Incidents</h1>
          <p className="text-sm text-ink-muted">
            Historical incident data and resolution records
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
            label: 'Total Resolved',
            value: resolvedIncidents.length,
            icon: <CheckCircle size={20} className="text-teal" />,
            sub: `${dateFilter === 'all' ? 'all time' : `last ${dateFilter}`}`,
          },
          {
            label: 'Today Resolved',
            value: todayResolved,
            icon: <TrendingUp size={20} className="text-teal-dark" />,
            sub: 'completed today',
          },
          {
            label: 'Closed',
            value: closedCount,
            icon: <Shield size={20} className="text-ink-muted" />,
            sub: 'not genuine emergencies',
          },
          {
            label: 'Resolution Rate',
            value: `${Math.round((resolvedCount / Math.max(resolvedIncidents.length, 1)) * 100)}%`,
            icon: <Calendar size={20} className="text-navy" />,
            sub: 'resolved vs total',
          },
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

      {/* Filters */}
      <div className="mb-4 flex items-center gap-3">
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
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-muted">Time Period:</span>
          {(['today', 'week', 'month', 'all'] as const).map(period => (
            <button
              key={period}
              onClick={() => setDateFilter(period)}
              className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors capitalize ${
                dateFilter === period
                  ? 'bg-navy text-white'
                  : 'bg-white border border-paper-border text-ink hover:bg-paper-hover'
              }`}
            >
              {period === 'all' ? 'All Time' : period}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-navy mb-3" />
            <p className="text-sm text-ink-muted">Loading resolved incidents…</p>
          </div>
        </div>
      ) : resolvedIncidents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-ink-muted">
          <CheckCircle size={40} className="opacity-30 mb-3" />
          <p className="text-sm font-medium text-ink">No resolved incidents</p>
          <p className="text-xs mt-1">Resolved incidents will appear here</p>
        </div>
      ) : (
        <div className="bg-white border border-paper-border rounded-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-paper border-b border-paper-border">
              <tr>
                {['', 'Ticket', 'Incident', 'Status', 'Resolved By', 'Resolved At', 'Age', ''].map((h, i) => (
                  <th key={i} className="text-left px-4 py-3 text-xs font-mono font-semibold text-ink-muted uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {resolvedIncidents.map(incident => (
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