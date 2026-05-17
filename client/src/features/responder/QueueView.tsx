import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIncidents } from '../../api/incidents';
import { IncidentType, IncidentStatus, IncidentSeverity } from '../../types';
import { INCIDENT_TYPES, SEVERITY_LEVELS } from '../../lib/constants';
import { getSeverityBorderColor, formatTimeAgo } from '../../lib/formatters';
import { StatusBadge } from '../../components/StatusBadge';
import { SkeletonRow } from '../../components/SkeletonRow';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { Button } from '../../components/Button';
import { Search, Plus, Filter, ArrowUpDown } from 'lucide-react';

export function QueueView() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<IncidentType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<IncidentStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'severity' | 'ai_score'>('created_at');

  const debouncedSearch = useMemo(
    () => debounce((value: string) => setSearch(value), 300),
    []
  );

  const {
    data: incidentsData,
    isLoading,
    error,
    refetch,
  } = useIncidents({
    q: search || undefined,
    type: filterType === 'all' ? undefined : filterType,
    status: filterStatus === 'all' ? undefined : filterStatus,
    sortBy,
  });

  const incidents = incidentsData?.incidents || [];
  const openCount = incidents.filter((i) => i.status === 'open').length;

  // Auto-update elapsed times
  const [, setUpdate] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setUpdate((u) => u + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Incident Queue</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-ink-muted">
              {incidentsData?.total || 0} total
            </span>
            {openCount > 0 && (
              <Badge variant="success">{openCount} open</Badge>
            )}
          </div>
        </div>
        <Button onClick={() => navigate('/responder/new')}>
          <Plus size={16} className="mr-2" />
          New Incident
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            placeholder="Search incidents..."
            onChange={(e) => debouncedSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-paper-border rounded-sm
              text-sm placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-navy
            "
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={16} className="text-ink-muted" />
          {['all', ...INCIDENT_TYPES.map((t) => t.value)].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type as IncidentType | 'all')}
              className={`
                px-3 py-1.5 text-xs font-medium rounded-sm
                ${filterType === type
                  ? 'bg-navy text-white'
                  : 'bg-white text-ink border border-paper-border hover:bg-paper-hover'
                }
              `}
            >
              {type === 'all' ? 'All' : INCIDENT_TYPES.find((t) => t.value === type)?.label}
            </button>
          ))}
        </div>

        <button
          onClick={() =>
            setSortBy(
              sortBy === 'created_at' ? 'severity' : sortBy === 'severity' ? 'ai_score' : 'created_at'
            )
          }
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium
            bg-white border border-paper-border rounded-sm hover:bg-paper-hover
          "
        >
          <ArrowUpDown size={14} />
          {sortBy === 'created_at' ? 'Newest' : sortBy === 'severity' ? 'Severity' : 'AI Score'}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-paper-border rounded-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-paper sticky top-0">
            <tr>
              <th className="w-4 px-4 py-3 text-left text-xs font-mono font-semibold text-ink-muted uppercase" />
              <th className="w-[100px] px-4 py-3 text-left text-xs font-mono font-semibold text-ink-muted uppercase">
                Ticket
              </th>
              <th className="px-4 py-3 text-left text-xs font-mono font-semibold text-ink-muted uppercase">
                Incident
              </th>
              <th className="w-[80px] px-4 py-3 text-left text-xs font-mono font-semibold text-ink-muted uppercase">
                AI Score
              </th>
              <th className="w-[100px] px-4 py-3 text-left text-xs font-mono font-semibold text-ink-muted uppercase">
                Status
              </th>
              <th className="w-[80px] px-4 py-3 text-left text-xs font-mono font-semibold text-ink-muted uppercase">
                Elapsed
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : error ? (
              <tr>
                <td colSpan={6}>
                  <ErrorState onRetry={() => refetch()} />
                </td>
              </tr>
            ) : incidents.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState
                    title="No incidents found"
                    description={search ? 'Try adjusting your search or filters' : 'No incidents in queue'}
                  />
                </td>
              </tr>
            ) : (
              incidents.map((incident) => {
                const typeInfo = INCIDENT_TYPES.find((t) => t.value === incident.type);
                const severityInfo = SEVERITY_LEVELS.find((s) => s.value === incident.severity);
                const isOldOpen =
                  incident.status === 'open' &&
                  Date.now() - new Date(incident.createdAt).getTime() > 15 * 60 * 1000;

                return (
                  <tr
                    key={incident.id}
                    onClick={() => navigate(`/responder/ticket/${incident.id}`)}
                    className={`
                      border-b border-paper-border cursor-pointer hover:bg-paper-hover
                      border-l-4 ${getSeverityBorderColor(incident.severity)}
                    `}
                  >
                    <td className="px-4 py-3" />
                    <td className="px-4 py-3">
                      <div className="font-mono text-sm text-ink">{incident.ticketNumber}</div>
                      {typeInfo && (
                        <div className="text-lg mt-1">{typeInfo.emoji}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-sm text-ink">{incident.title}</div>
                      <div className="font-mono text-xs text-ink-muted mt-0.5">
                        {incident.locationText}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {incident.aiTriageData ? (
                        <span
                          className={`
                            inline-block px-2 py-1 text-xs font-mono font-semibold rounded-sm
                            ${incident.aiTriageData.options[0]?.confidence >= 80
                              ? 'bg-teal-light text-teal-dark'
                              : incident.aiTriageData.options[0]?.confidence >= 50
                                ? 'bg-amber-light text-amber-dark'
                                : 'bg-red-light text-red-dark'
                            }
                          `}
                        >
                          {incident.aiTriageData.options[0]?.confidence || '—'}
                        </span>
                      ) : (
                        <span className="text-ink-muted font-mono text-sm">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={incident.status} />
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-mono text-xs ${isOldOpen ? 'text-red' : 'text-ink-muted'}`}
                      >
                        {formatTimeAgo(incident.createdAt)}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Debounce utility
function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): T {
  let timeoutId: NodeJS.Timeout;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  }) as T;
}