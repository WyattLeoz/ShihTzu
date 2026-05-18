import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIncidents, useClaimIncident } from '../../api/incidents';
import { authStore } from '../../stores/authStore';
import { IncidentListItem } from '../../types';
import { formatIncidentType } from '../../lib/formatters';
import { StatusBadge } from '../../components/StatusBadge';
import {
  Plus, AlertCircle, Clock, MapPin, UserPlus, Eye,
  RefreshCw, Search, AlertTriangle, Activity, Siren,
  Flame, Droplets, Heart, Car, Building2, Flag, HelpCircle,
  ChevronRight, Users, CheckCircle, TrendingUp, Phone,
  FileText, Shield,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_ICONS: Record<string, React.ReactNode> = {
  fire:           <Flame      size={13} className="text-orange-600" />,
  flood:          <Droplets   size={13} className="text-blue-600"   />,
  medical:        <Heart      size={13} className="text-red-600"    />,
  road:           <Car        size={13} className="text-yellow-600" />,
  infrastructure: <Building2  size={13} className="text-purple-600" />,
  civil:          <Flag       size={13} className="text-navy"       />,
  other:          <HelpCircle size={13} className="text-ink-muted"  />,
};

const SEV: Record<number, { dot: string; badge: string; text: string; label: string }> = {
  1: { dot: 'bg-red',   badge: 'bg-red-light border-red',         text: 'text-red-dark',   label: 'Critical' },
  2: { dot: 'bg-amber', badge: 'bg-amber-light border-amber',     text: 'text-amber-dark', label: 'High'     },
  3: { dot: 'bg-teal',  badge: 'bg-teal-light border-teal',       text: 'text-teal-dark',  label: 'Medium'   },
};

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function elapsedMin(d: string) {
  return Math.floor((Date.now() - new Date(d).getTime()) / 60000);
}

function isOverdue(i: IncidentListItem) {
  const threshold = i.severity === 1 ? 5 : i.severity === 2 ? 10 : 20;
  return i.status === 'open' && !i.assignedTo && elapsedMin(i.createdAt) > threshold;
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function StatsBar({ all, needsReview, mine, inProgress }: {
  all: IncidentListItem[];
  needsReview: number;
  mine: number;
  inProgress: number;
}) {
  const critical = all.filter(i => i.severity === 1 && !['resolved', 'closed'].includes(i.status)).length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
      {[
        {
          label: 'Needs Review',
          value: needsReview,
          icon: <AlertCircle size={18} className="text-red" />,
          sub: 'awaiting a responder',
          alert: needsReview > 0,
        },
        {
          label: 'Critical Active',
          value: critical,
          icon: <Siren size={18} className="text-red" />,
          sub: 'severity 1 — immediate',
          alert: critical > 0,
        },
        {
          label: 'My Assigned',
          value: mine,
          icon: <Users size={18} className="text-navy" />,
          sub: 'currently yours',
          alert: false,
        },
        {
          label: 'In Progress',
          value: inProgress,
          icon: <Activity size={18} className="text-teal" />,
          sub: 'dispatched / on scene',
          alert: false,
        },
      ].map(s => (
        <div key={s.label} className={`bg-white border rounded-sm p-4 ${s.alert ? 'border-red' : 'border-paper-border'}`}>
          <div className="flex items-start justify-between mb-2">
            {s.icon}
            {s.alert && <div className="w-2 h-2 bg-red rounded-full animate-pulse" />}
          </div>
          <div className="text-2xl font-bold text-ink">{s.value}</div>
          <div className="text-xs text-ink-muted mt-0.5">{s.label}</div>
          <div className="text-[10px] text-ink-muted">{s.sub}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Needs Review Card ────────────────────────────────────────────────────────

function NeedsReviewCard({
  incident,
  onClaim,
  onView,
  claiming,
}: {
  incident: IncidentListItem;
  onClaim: () => void;
  onView: () => void;
  claiming: boolean;
}) {
  const sev      = SEV[incident.severity] || SEV[3];
  const overdue  = isOverdue(incident);
  const elapsed  = elapsedMin(incident.createdAt);
  const isSuperCritical = incident.severity === 1 && elapsed > 5;

  return (
    <div className={`bg-white border rounded-sm overflow-hidden hover:shadow-sm transition-shadow ${
      isSuperCritical ? 'border-red ring-1 ring-red' : 'border-paper-border'
    }`}>
      {/* Severity stripe */}
      <div className={`h-1.5 ${sev.dot}`} />

      <div className="p-4">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="font-mono text-xs text-ink-muted font-bold">{incident.ticketNumber}</span>
              <span className={`flex items-center gap-1 text-[10px] font-semibold`}>
                {TYPE_ICONS[incident.type]}
                {formatIncidentType(incident.type)}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${sev.badge} ${sev.text}`}>
                {sev.label}
              </span>
              {incident.severity === 1 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red text-white animate-pulse">
                  CRITICAL
                </span>
              )}
            </div>
            <h3 className="text-sm font-semibold text-ink leading-snug">{incident.title}</h3>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-ink-muted flex-wrap">
              <span className="flex items-center gap-1"><MapPin size={10} />{incident.locationText}</span>
            </div>
          </div>

          {/* Elapsed timer */}
          <div className={`flex-shrink-0 text-center px-3 py-2 rounded border ${
            overdue ? 'bg-red-light border-red' : 'bg-paper border-paper-border'
          }`}>
            <p className={`text-xl font-bold font-mono leading-none ${overdue ? 'text-red' : 'text-ink'}`}>
              {elapsed}
            </p>
            <p className={`text-[9px] font-bold uppercase mt-0.5 ${overdue ? 'text-red-dark' : 'text-ink-muted'}`}>
              {overdue ? 'OVERDUE' : 'min'}
            </p>
          </div>
        </div>

        {/* Source badge */}
        <div className="mt-3 flex items-center gap-2">
          <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 bg-navy-light text-navy-mid border border-navy-border rounded">
            <FileText size={9} /> PUBLIC REPORT
          </span>
          {overdue && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-red">
              <AlertTriangle size={10} /> Response time exceeded
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-3.5">
          <button
            onClick={onClaim}
            disabled={claiming}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-navy text-white text-xs font-bold rounded-sm hover:bg-navy-dark disabled:opacity-50 transition-colors"
          >
            {claiming
              ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Claiming…</>
              : <><UserPlus size={13} /> Claim & Review</>}
          </button>
          <button
            onClick={onView}
            className="flex items-center justify-center gap-2 px-4 py-2.5 border border-paper-border rounded-sm text-xs font-medium hover:bg-paper-hover transition-colors"
          >
            <Eye size={13} /> View
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Queue Table Row ──────────────────────────────────────────────────────────

function QueueRow({
  incident,
  onClick,
  showClaimBtn,
  onClaim,
  claiming,
}: {
  incident: IncidentListItem;
  onClick: () => void;
  showClaimBtn?: boolean;
  onClaim?: () => void;
  claiming?: boolean;
}) {
  const sev     = SEV[incident.severity] || SEV[3];
  const overdue = isOverdue(incident);

  const borderLeft =
    incident.severity === 1 ? 'border-l-red' :
    incident.severity === 2 ? 'border-l-amber' : 'border-l-teal';

  return (
    <tr
      onClick={onClick}
      className={`border-b border-paper-border cursor-pointer hover:bg-paper-hover border-l-4 ${borderLeft}`}
    >
      {/* Priority */}
      <td className="px-4 py-3 w-10">
        <div className={`w-2.5 h-2.5 rounded-full ${sev.dot}`} />
      </td>
      {/* Ticket + type */}
      <td className="px-4 py-3 w-32">
        <div className="font-mono text-xs font-bold text-ink">{incident.ticketNumber}</div>
        <div className="flex items-center gap-1 mt-0.5 text-[10px] text-ink-muted">
          {TYPE_ICONS[incident.type]} {formatIncidentType(incident.type)}
        </div>
      </td>
      {/* Incident */}
      <td className="px-4 py-3">
        <p className="text-sm font-semibold text-ink">{incident.title}</p>
        <p className="text-xs text-ink-muted mt-0.5 flex items-center gap-1">
          <MapPin size={9} />{incident.locationText}
        </p>
      </td>
      {/* Status */}
      <td className="px-4 py-3 w-28">
        <StatusBadge status={incident.status} />
      </td>
      {/* Assigned to */}
      <td className="px-4 py-3 w-44">
        {incident.assignedTo
          ? <div>
              <p className="text-xs font-medium text-ink">{incident.assignedTo.name}</p>
              <p className="text-[10px] text-ink-muted">{incident.assignedTo.unit}</p>
            </div>
          : <span className="text-[10px] text-ink-muted italic px-2 py-1 bg-paper rounded border border-paper-border">
              Unassigned
            </span>}
      </td>
      {/* Age */}
      <td className="px-4 py-3 w-24">
        <span className={`text-xs font-mono ${overdue ? 'text-red font-bold' : 'text-ink-muted'}`}>
          {timeAgo(incident.createdAt)}
        </span>
      </td>
      {/* Action */}
      <td className="px-4 py-3 w-32">
        {showClaimBtn && onClaim ? (
          <button
            onClick={e => { e.stopPropagation(); onClaim(); }}
            disabled={claiming}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-navy text-white text-[10px] font-bold rounded hover:bg-navy-dark disabled:opacity-50"
          >
            {claiming ? '…' : <><UserPlus size={10} /> Claim</>}
          </button>
        ) : (
          <span className="flex items-center gap-1 text-xs text-teal">
            View <ChevronRight size={11} />
          </span>
        )}
      </td>
    </tr>
  );
}

// ─── Empty States ─────────────────────────────────────────────────────────────

function EmptyState({ icon, title, sub, action }: {
  icon: React.ReactNode; title: string; sub: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-ink-muted">
      <div className="mb-3 opacity-30">{icon}</div>
      <p className="text-sm font-medium text-ink">{title}</p>
      <p className="text-xs mt-1">{sub}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ─── Table Wrapper ────────────────────────────────────────────────────────────

function IncidentTable({
  rows,
  navigate,
  showClaim,
  claimingId,
  onClaim,
}: {
  rows: IncidentListItem[];
  navigate: (path: string) => void;
  showClaim?: boolean;
  claimingId: string | null;
  onClaim: (i: IncidentListItem) => void;
}) {
  if (rows.length === 0) return null;
  return (
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
          {rows.map(incident => (
            <QueueRow
              key={incident.id}
              incident={incident}
              onClick={() => navigate(`/responder/ticket/${incident.id}`)}
              showClaimBtn={showClaim}
              onClaim={() => onClaim(incident)}
              claiming={claimingId === incident.id}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main QueueView ───────────────────────────────────────────────────────────

export function QueueView() {
  const navigate    = useNavigate();
  const user        = authStore(s => s.user);
  const isSupervisor = user?.role === 'supervisor' || user?.role === 'gov_admin';

  const [activeTab,  setActiveTab]  = useState<'review' | 'mine' | 'active' | 'resolved'>('review');
  const [search,     setSearch]     = useState('');
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useIncidents({ limit: 200 });
  const { mutate: claimIncident } = useClaimIncident();

  const all = data?.incidents || [];

  // ── Tab buckets ──
  const needsReview = useMemo(() =>
    all
      .filter(i => i.status === 'open' && !i.assignedTo)
      .sort((a, b) => a.severity - b.severity || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [all]);

  const mine = useMemo(() =>
    all.filter(i =>
      i.assignedTo?.id === user?.id &&
      !['resolved', 'closed'].includes(i.status)
    ), [all, user?.id]);

  const active = useMemo(() =>
    all.filter(i => ['triaging', 'dispatched', 'on_scene'].includes(i.status))
       .sort((a, b) => a.severity - b.severity),
    [all]);

  const resolved = useMemo(() =>
    all
      .filter(i => ['resolved', 'closed'].includes(i.status))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [all]);

  // ── Search filter ──
  const applySearch = (list: IncidentListItem[]) =>
    search.trim()
      ? list.filter(i =>
          i.title.toLowerCase().includes(search.toLowerCase()) ||
          i.locationText.toLowerCase().includes(search.toLowerCase()) ||
          i.ticketNumber.toLowerCase().includes(search.toLowerCase())
        )
      : list;

  const tabMap = { review: needsReview, mine, active, resolved };
  const filtered = applySearch(tabMap[activeTab]);

  // ── Claim handler ──
  const handleClaim = (incident: IncidentListItem) => {
    setClaimingId(incident.id);
    claimIncident(incident.id, {
      onSuccess: () => { setClaimingId(null); navigate(`/responder/ticket/${incident.id}`); },
      onError:   () => { setClaimingId(null); navigate(`/responder/ticket/${incident.id}`); },
    });
  };

  const criticalUnassigned = needsReview.filter(i => i.severity === 1).length;

  const TABS = [
    { id: 'review'   as const, label: 'Needs Review',  count: needsReview.length, urgent: needsReview.length > 0 },
    { id: 'mine'     as const, label: 'My Work',        count: mine.length,        urgent: false },
    { id: 'active'   as const, label: 'In Progress',    count: active.length,      urgent: false },
    { id: 'resolved' as const, label: 'Resolved',       count: resolved.length,    urgent: false },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Incident Queue</h1>
          <p className="text-sm text-ink-muted">
            {all.length} total · Citizens report incidents publicly → Responders claim & resolve here
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => refetch()}
            className="flex items-center gap-2 px-3 py-2 border border-paper-border rounded-sm hover:bg-paper-hover text-sm text-ink-muted">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={() => navigate('/responder/new')}
            className="flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-sm hover:bg-navy-dark text-sm font-semibold">
            <Plus size={16} /> New Incident
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <StatsBar
        all={all}
        needsReview={needsReview.length}
        mine={mine.length}
        inProgress={active.length}
      />

      {/* ── Critical banner ── */}
      {criticalUnassigned > 0 && (
        <div className="mb-5 flex items-center gap-3 bg-red-light border border-red rounded-sm px-4 py-3">
          <Siren size={16} className="text-red flex-shrink-0 animate-pulse" />
          <p className="text-sm font-bold text-red-dark">
            {criticalUnassigned} CRITICAL unreviewed incident{criticalUnassigned > 1 ? 's' : ''} —
            response time threshold exceeded. Claim immediately.
          </p>
          <button
            onClick={() => setActiveTab('review')}
            className="ml-auto text-xs text-red-dark font-semibold underline whitespace-nowrap"
          >
            View →
          </button>
        </div>
      )}

      {/* ── Flow explanation (first-time guidance) ── */}
      {needsReview.length === 0 && all.length === 0 && !isLoading && (
        <div className="mb-5 bg-navy-light border border-navy-border rounded-sm p-4 flex gap-4 items-start">
          <Shield size={18} className="text-navy flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-navy">How the incident flow works</p>
            <div className="flex items-center gap-2 mt-2 text-xs text-ink-muted flex-wrap">
              <span className="bg-white border border-paper-border rounded px-2 py-1">① Citizen reports via Public Portal</span>
              <ChevronRight size={12} />
              <span className="bg-white border border-paper-border rounded px-2 py-1">② Appears here under "Needs Review"</span>
              <ChevronRight size={12} />
              <span className="bg-white border border-paper-border rounded px-2 py-1">③ Responder claims & triages</span>
              <ChevronRight size={12} />
              <span className="bg-white border border-paper-border rounded px-2 py-1">④ Dispatched → On Scene → Resolved</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex items-end border-b border-paper-border mb-5">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-navy text-navy'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            {tab.label}
            <span className={`min-w-[20px] h-5 flex items-center justify-center rounded-full text-[10px] font-bold px-1.5 ${
              tab.urgent && activeTab !== tab.id
                ? 'bg-red text-white animate-pulse'
                : activeTab === tab.id
                ? 'bg-navy text-white'
                : 'bg-paper-border text-ink-muted'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
        {/* Search */}
        <div className="ml-auto pb-2 flex items-center">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search title, location, ticket…"
              className="pl-8 pr-3 py-1.5 border border-paper-border rounded-sm text-xs focus:outline-none focus:ring-1 focus:ring-navy w-52"
            />
          </div>
        </div>
      </div>

      {/* ── Loading ── */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-navy mb-3" />
            <p className="text-sm text-ink-muted">Loading queue…</p>
          </div>
        </div>
      )}

      {/* ── Needs Review tab ── */}
      {!isLoading && activeTab === 'review' && (
        <div>
          {filtered.length === 0 ? (
            <EmptyState
              icon={<CheckCircle size={40} className="text-teal" />}
              title="All clear — no incidents waiting for review"
              sub="When citizens submit reports via the Public Portal, they appear here immediately."
            />
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 bg-amber-light border border-amber rounded-sm px-3 py-2.5 text-xs font-medium text-amber-dark">
                  <AlertTriangle size={13} />
                  {filtered.length} citizen report{filtered.length !== 1 ? 's' : ''} waiting —
                  sorted by severity, then time elapsed. Claim to take ownership.
                </div>
                {isSupervisor && (
                  <p className="text-xs text-ink-muted">
                    As supervisor, you can also assign incidents to specific responders after viewing.
                  </p>
                )}
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {filtered.map(incident => (
                  <NeedsReviewCard
                    key={incident.id}
                    incident={incident}
                    onClaim={() => handleClaim(incident)}
                    onView={() => navigate(`/responder/ticket/${incident.id}`)}
                    claiming={claimingId === incident.id}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── My Work tab ── */}
      {!isLoading && activeTab === 'mine' && (
        <div>
          {filtered.length === 0 ? (
            <EmptyState
              icon={<Activity size={40} />}
              title="No incidents assigned to you"
              sub="Claim incidents from the 'Needs Review' tab to start working on them."
              action={
                <button
                  onClick={() => setActiveTab('review')}
                  className="flex items-center gap-2 px-4 py-2 bg-navy text-white text-sm font-semibold rounded-sm hover:bg-navy-dark"
                >
                  Go to Needs Review <ChevronRight size={14} />
                </button>
              }
            />
          ) : (
            <>
              <p className="text-sm text-ink-muted mb-4">
                These incidents are assigned to you. Click any row to view full details and update status.
              </p>
              <IncidentTable
                rows={filtered}
                navigate={navigate}
                claimingId={claimingId}
                onClaim={handleClaim}
              />
            </>
          )}
        </div>
      )}

      {/* ── In Progress tab ── */}
      {!isLoading && activeTab === 'active' && (
        <div>
          {filtered.length === 0 ? (
            <EmptyState
              icon={<Activity size={40} />}
              title="No incidents in progress"
              sub="Incidents move here once they are dispatched or on scene."
            />
          ) : (
            <>
              <p className="text-sm text-ink-muted mb-4">
                All active incidents currently being handled. Sorted by severity.
              </p>
              <IncidentTable
                rows={filtered}
                navigate={navigate}
                claimingId={claimingId}
                onClaim={handleClaim}
              />
            </>
          )}
        </div>
      )}

      {/* ── Resolved tab ── */}
      {!isLoading && activeTab === 'resolved' && (
        <div>
          {filtered.length === 0 ? (
            <EmptyState
              icon={<CheckCircle size={40} />}
              title="No resolved incidents yet"
              sub="Incidents resolved today will appear here."
            />
          ) : (
            <>
              <p className="text-sm text-ink-muted mb-4">
                {filtered.length} resolved incident{filtered.length !== 1 ? 's' : ''} — most recent first.
              </p>
              <IncidentTable
                rows={filtered}
                navigate={navigate}
                claimingId={claimingId}
                onClaim={handleClaim}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}