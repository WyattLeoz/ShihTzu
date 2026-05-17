import { useState } from 'react';
import { useIncidents } from '../../api/incidents';
import { formatIncidentType, formatSeverity, getSeverityBorderColor } from '../../lib/formatters';
import { StatusBadge } from '../../components/StatusBadge';
import { IncidentListItem } from '../../types';
import { Search, Filter, ArrowUpDown, Download, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Badge } from '../../components/Badge';

export function IncidentManagement() {
  console.log('IncidentManagement rendered');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'severity' | 'status'>('created_at');

  const { data: incidentsData, isLoading } = useIncidents({ limit: 100 });
  const incidents = incidentsData?.incidents || [];

  const filteredIncidents = incidents.filter(incident => {
    const matchesSearch = incident.title.toLowerCase().includes(search.toLowerCase()) ||
                         incident.locationText.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || incident.status === filterStatus;
    const matchesSeverity = filterSeverity === 'all' ||
                           (filterSeverity === 'critical' && incident.severity === 3) ||
                           (filterSeverity === 'high' && incident.severity === 2) ||
                           (filterSeverity === 'medium' && incident.severity === 1);

    return matchesSearch && matchesStatus && matchesSeverity;
  });

  const sortedIncidents = [...filteredIncidents].sort((a, b) => {
    switch (sortBy) {
      case 'created_at':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'severity':
        return b.severity - a.severity;
      case 'status':
        return a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-ink mb-1">Incident Management</h1>
          <p className="text-sm text-ink-muted">Monitor and manage all emergency incidents</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-paper-border rounded-sm hover:bg-paper-hover transition-colors">
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-paper-border rounded-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-ink">Total Incidents</span>
            <Badge variant="info" className="text-xs">All Time</Badge>
          </div>
          <div className="text-2xl font-bold text-ink">{incidents.length}</div>
          <div className="text-xs text-ink-muted mt-1">across all zones</div>
        </div>

        <div className="bg-white border border-paper-border rounded-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-ink">Active</span>
            <Badge variant="warning" className="text-xs">Ongoing</Badge>
          </div>
          <div className="text-2xl font-bold text-ink">
            {incidents.filter(i => i.status === 'open' || i.status === 'dispatched' || i.status === 'on_scene').length}
          </div>
          <div className="text-xs text-ink-muted mt-1">requiring attention</div>
        </div>

        <div className="bg-white border border-paper-border rounded-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-ink">Critical</span>
            <Badge variant="error" className="text-xs">High Priority</Badge>
          </div>
          <div className="text-2xl font-bold text-ink">
            {incidents.filter(i => i.severity === 3).length}
          </div>
          <div className="text-xs text-ink-muted mt-1">severity level 3</div>
        </div>

        <div className="bg-white border border-paper-border rounded-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-ink">Resolved Today</span>
            <Badge variant="success" className="text-xs">Today</Badge>
          </div>
          <div className="text-2xl font-bold text-ink">
            {incidents.filter(i => i.status === 'resolved' || i.status === 'closed').length}
          </div>
          <div className="text-xs text-ink-muted mt-1">successfully handled</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-paper-border rounded-sm p-4 mb-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-muted" />
              <input
                type="text"
                placeholder="Search incidents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-paper-border rounded-sm focus:outline-none focus:ring-2 focus:ring-teal text-sm"
              />
            </div>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-paper-border rounded-sm focus:outline-none focus:ring-2 focus:ring-teal text-sm"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="dispatched">Dispatched</option>
            <option value="on_scene">On Scene</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-4 py-2 border border-paper-border rounded-sm focus:outline-none focus:ring-2 focus:ring-teal text-sm"
          >
            <option value="all">All Severity</option>
            <option value="critical">Critical (3)</option>
            <option value="high">High (2)</option>
            <option value="medium">Medium (1)</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 border border-paper-border rounded-sm focus:outline-none focus:ring-2 focus:ring-teal text-sm"
          >
            <option value="created_at">Sort by Date</option>
            <option value="severity">Sort by Severity</option>
            <option value="status">Sort by Status</option>
          </select>
        </div>
      </div>

      {/* Incident List */}
      <div className="bg-white border border-paper-border rounded-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal"></div>
            <p className="text-ink-muted mt-2">Loading incidents...</p>
          </div>
        ) : sortedIncidents.length === 0 ? (
          <div className="p-8 text-center text-ink-muted">
            <AlertCircle className="mx-auto h-12 w-12 mb-2 opacity-50" />
            <p>No incidents found</p>
          </div>
        ) : (
          <div className="divide-y divide-paper-border">
            {sortedIncidents.map((incident) => (
              <div
                key={incident.id}
                className={`p-4 hover:bg-paper-hover cursor-pointer transition-colors ${getSeverityBorderColor(incident.severity)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-ink">{incident.title}</h3>
                      <StatusBadge status={incident.status} />
                      <Badge variant="info" className="text-xs">{formatIncidentType(incident.type)}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-ink-muted">
                      <span>{incident.locationText}</span>
                      <span>•</span>
                      <span>{formatSeverity(incident.severity)}</span>
                      <span>•</span>
                      <span>{new Date(incident.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {incident.severity === 3 && (
                      <div className="flex items-center gap-1 text-red text-xs">
                        <AlertCircle size={12} />
                        Critical
                      </div>
                    )}
                    {(incident.status === 'open' || incident.status === 'dispatched') && (
                      <div className="flex items-center gap-1 text-amber text-xs">
                        <Clock size={12} />
                        {incident.status === 'open' ? 'Pending' : 'In Progress'}
                      </div>
                    )}
                    {incident.status === 'resolved' && (
                      <div className="flex items-center gap-1 text-teal text-xs">
                        <CheckCircle size={12} />
                        Resolved
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}