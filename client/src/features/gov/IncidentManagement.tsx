import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIncidents, useUpdateIncidentStatus } from '../../api/incidents';
import { formatIncidentType, formatSeverity } from '../../lib/formatters';
import { StatusBadge } from '../../components/StatusBadge';
import { IncidentListItem, IncidentStatus, IncidentType, IncidentSeverity } from '../../types';
import {
  Search, Filter, Download, AlertCircle, CheckCircle, Clock,
  ChevronRight, X, MapPin, User, Shield, Activity, Zap,
  AlertTriangle, Radio, FileText, TrendingUp, Users, RefreshCw,
  ArrowUpDown, Siren, Phone, Send, Flame, Droplets, Heart,
  Car, Building2, Flag, HelpCircle, ExternalLink, BarChart3,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type SortKey = 'created_at' | 'severity' | 'status' | 'type';
type SortDir = 'asc' | 'desc';
type TabId   = 'all' | 'needs_review' | 'active' | 'resolved';

// ─── Shared constants ─────────────────────────────────────────────────────────

const STATUS_FLOW: IncidentStatus[] = [
  'open', 'triaging', 'dispatched', 'on_scene', 'resolved',
];

const STATUS_CFG: Record<IncidentStatus, { label: string; color: string; bg: string; border: string }> = {
  open:       { label: 'Open',       color: 'text-ink',        bg: 'bg-paper',        border: 'border-paper-border' },
  triaging:   { label: 'Triaging',   color: 'text-amber-dark', bg: 'bg-amber-light',  border: 'border-amber'        },
  dispatched: { label: 'Dispatched', color: 'text-teal-dark',  bg: 'bg-teal-light',   border: 'border-teal'         },
  on_scene:   { label: 'On Scene',   color: 'text-navy-mid',   bg: 'bg-navy-light',   border: 'border-navy-border'  },
  resolved:   { label: 'Resolved',   color: 'text-teal-dark',  bg: 'bg-teal-light',   border: 'border-teal'         },
  closed:     { label: 'Closed',     color: 'text-ink-muted',  bg: 'bg-paper-border', border: 'border-paper-border' },
};

const SEV_CFG: Record<number, { label: string; color: string; bg: string; border: string; dot: string; bar: string }> = {
  1: { label: 'Critical', color: 'text-red-dark',   bg: 'bg-red-light',   border: 'border-red',         dot: 'bg-red',   bar: 'bg-red'   },
  2: { label: 'High',     color: 'text-amber-dark', bg: 'bg-amber-light', border: 'border-amber',       dot: 'bg-amber', bar: 'bg-amber' },
  3: { label: 'Medium',   color: 'text-teal-dark',  bg: 'bg-teal-light',  border: 'border-teal',        dot: 'bg-teal',  bar: 'bg-teal'  },
};

const TYPE_ICON: Record<IncidentType, { icon: React.ReactNode; color: string }> = {
  fire:           { icon: <Flame      size={13} />, color: 'text-orange-600' },
  flood:          { icon: <Droplets   size={13} />, color: 'text-blue-600'   },
  medical:        { icon: <Heart      size={13} />, color: 'text-red-600'    },
  road:           { icon: <Car        size={13} />, color: 'text-yellow-600' },
  infrastructure: { icon: <Building2  size={13} />, color: 'text-purple-600' },
  civil:          { icon: <Flag       size={13} />, color: 'text-navy'       },
  other:          { icon: <HelpCircle size={13} />, color: 'text-ink-muted'  },
};

// Agencies to notify per incident type
const INCIDENT_AGENCIES: Record<IncidentType, { name: string; role: string; contact: string }[]> = {
  flood:          [
    { name: 'SCDF',         role: 'Flood Response',   contact: '995'            },
    { name: 'PUB',          role: 'Drainage Control', contact: '1800 284 6600'  },
    { name: 'PA',           role: 'Evac Centre',      contact: '6225 5322'      },
    { name: 'SPF',          role: 'Cordon & Traffic', contact: '999'            },
    { name: 'Town Council', role: 'Resident Comms',   contact: 'Varies'         },
  ],
  medical:        [
    { name: 'SCDF EMS', role: 'Ambulance Dispatch',   contact: '995'            },
    { name: 'MOH',      role: 'Hospital Coord',        contact: '1800 333 9999' },
    { name: 'SPF',      role: 'Scene Security',        contact: '999'           },
  ],
  fire:           [
    { name: 'SCDF',     role: 'Fire & Rescue',         contact: '995'            },
    { name: 'SPF',      role: 'Road Closure',          contact: '999'            },
    { name: 'SP Group', role: 'Utilities Safety',      contact: '1800 752 1234'  },
    { name: 'LTA',      role: 'Traffic Diversion',     contact: '1800 2255 582'  },
  ],
  road:           [
    { name: 'Traffic Police', role: 'Investigation',   contact: '6547 0000'     },
    { name: 'SCDF EMS',       role: 'Medical Response', contact: '995'          },
    { name: 'LTA',            role: 'Road Advisory',   contact: '1800 2255 582' },
  ],
  infrastructure: [
    { name: 'SCDF',     role: 'Structural Assessment', contact: '1777'          },
    { name: 'BCA',      role: 'Building Safety',       contact: '1800 342 5222' },
    { name: 'SP Group', role: 'Utilities',             contact: '1800 752 1234' },
    { name: 'SPF',      role: 'Perimeter Cordon',      contact: '999'           },
  ],
  civil:          [
    { name: 'SPF',      role: 'Law & Order',           contact: '999'           },
    { name: 'SCDF EMS', role: 'Medical Standby',       contact: '995'           },
  ],
  other:          [
    { name: 'SCDF', role: 'First Response',            contact: '1777'          },
    { name: 'SPF',  role: 'Support',                   contact: '999'           },
  ],
};

// AI recommendations per type (top 3 actions)
const AI_ACTIONS: Record<IncidentType, { action: string; confidence: number }[]> = {
  flood:          [
    { action: 'Deploy SCDF pump trucks + rescue boat to site',  confidence: 92 },
    { action: 'Activate nearest CC as evacuation centre',        confidence: 85 },
    { action: 'Issue public advisory via gov.sg / 938Live',      confidence: 78 },
  ],
  medical:        [
    { action: 'Dispatch ALS ambulance to scene immediately',     confidence: 95 },
    { action: 'Pre-alert nearest A&E for incoming patient',      confidence: 88 },
    { action: 'Request myResponder bystander CPR support',       confidence: 62 },
  ],
  fire:           [
    { action: 'Deploy 2× fire engines + ladder platform',        confidence: 94 },
    { action: 'Evacuate building + establish 50m cordon',        confidence: 89 },
    { action: 'Alert SP Group for utilities shut-off',           confidence: 71 },
  ],
  road:           [
    { action: 'Deploy Traffic Police to accident scene',         confidence: 91 },
    { action: 'Activate SCDF EMS if casualties reported',        confidence: 84 },
    { action: 'Issue LTA One Motoring diversion alert',          confidence: 77 },
  ],
  infrastructure: [
    { action: 'Deploy SCDF for structural risk assessment',      confidence: 90 },
    { action: 'Evacuate building + establish safe perimeter',    confidence: 88 },
    { action: 'Notify BCA for certified inspection',             confidence: 82 },
  ],
  civil:          [
    { action: 'Deploy SPF rapid response unit',                  confidence: 93 },
    { action: 'Seal inner + outer cordon around site',           confidence: 86 },
    { action: 'Place SCDF EMS on standby at perimeter',          confidence: 70 },
  ],
  other:          [
    { action: 'Deploy first response assessment team',           confidence: 75 },
    { action: 'Establish incident command post at scene',        confidence: 68 },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleString('en-SG', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function isOverdue(i: IncidentListItem) {
  const thr = i.severity === 1 ? 5 : i.severity === 2 ? 10 : 20;
  return i.status === 'open' && !i.assignedTo &&
    Math.floor((Date.now() - new Date(i.createdAt).getTime()) / 60000) > thr;
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function StatsBar({ incidents }: { incidents: IncidentListItem[] }) {
  const unassigned = incidents.filter(i => i.status === 'open' && !i.assignedTo).length;
  const critical   = incidents.filter(i => i.severity === 1 && !['resolved', 'closed'].includes(i.status)).length;
  const active     = incidents.filter(i => !['resolved', 'closed'].includes(i.status)).length;
  const resolved   = incidents.filter(i => ['resolved', 'closed'].includes(i.status)).length;
  const resRate    = incidents.length > 0 ? Math.round((resolved / incidents.length) * 100) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
      {[
        { label: 'Needs Review',  value: unassigned,        sub: 'unassigned open',    icon: <AlertCircle size={16} className="text-red"   />, alert: unassigned > 0 },
        { label: 'Total Active',  value: active,            sub: 'not yet resolved',   icon: <Activity    size={16} className="text-amber" />, alert: active > 10    },
        { label: 'Critical',      value: critical,          sub: 'severity 1',         icon: <Siren       size={16} className="text-red"   />, alert: critical > 0   },
        { label: 'Total',         value: incidents.length,  sub: 'all incidents',      icon: <BarChart3   size={16} className="text-navy"  />, alert: false          },
        { label: 'Resolution',    value: `${resRate}%`,     sub: `${resolved} done`,   icon: <TrendingUp  size={16} className="text-teal"  />, alert: false          },
      ].map(s => (
        <div key={s.label} className={`bg-white border rounded-sm p-4 ${s.alert ? 'border-red' : 'border-paper-border'}`}>
          <div className="flex items-start justify-between mb-1.5">
            {s.icon}
            {s.alert && <div className="w-2 h-2 bg-red rounded-full animate-pulse" />}
          </div>
          <div className="text-2xl font-bold text-ink">{s.value}</div>
          <div className="text-[10px] text-ink-muted mt-0.5">{s.label}</div>
          <div className="text-[9px] text-ink-muted">{s.sub}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Incident Row (list item) ─────────────────────────────────────────────────

function IncidentRow({
  incident, selected, onClick,
}: {
  incident: IncidentListItem; selected: boolean; onClick: () => void;
}) {
  const sev     = SEV_CFG[incident.severity] || SEV_CFG[3];
  const typ     = TYPE_ICON[incident.type]   || TYPE_ICON.other;
  const overdue = isOverdue(incident);

  return (
    <div
      onClick={onClick}
      className={`px-4 py-3.5 cursor-pointer transition-all border-l-4 ${
        incident.severity === 1 ? 'border-l-red' :
        incident.severity === 2 ? 'border-l-amber' : 'border-l-teal'
      } ${selected ? 'bg-navy-light' : 'hover:bg-paper-hover'}`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 ${sev.dot}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-mono text-[10px] text-ink-muted font-bold">{incident.ticketNumber}</span>
            <span className={`flex items-center gap-1 text-[10px] font-semibold ${typ.color}`}>
              {typ.icon}{formatIncidentType(incident.type)}
            </span>
            <StatusBadge status={incident.status} />
            {!incident.assignedTo && incident.status === 'open' && (
              <span className="text-[9px] font-bold text-red bg-red-light px-1.5 py-0.5 rounded border border-red">
                UNASSIGNED
              </span>
            )}
          </div>
          <p className={`text-sm font-semibold truncate ${selected ? 'text-navy' : 'text-ink'}`}>
            {incident.title}
          </p>
          <div className="flex items-center gap-3 mt-1 text-xs text-ink-muted flex-wrap">
            <span className="flex items-center gap-1"><MapPin size={9} />{incident.locationText}</span>
            <span className={`flex items-center gap-1 ${overdue ? 'text-red font-semibold' : ''}`}>
              <Clock size={9} />{timeAgo(incident.createdAt)}{overdue ? ' ⚠' : ''}
            </span>
            {incident.assignedTo && (
              <span className="flex items-center gap-1 text-teal-dark font-medium">
                <User size={9} />{incident.assignedTo.name}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function DetailPanel({
  incident,
  onClose,
  navigate,
}: {
  incident: IncidentListItem;
  onClose: () => void;
  navigate: (path: string) => void;
}) {
  type PanelTab = 'overview' | 'agencies' | 'ai' | 'timeline';

  const [tab,      setTab]      = useState<PanelTab>('overview');
  const [alerted,  setAlerted]  = useState<Set<string>>(new Set());
  const [checked,  setChecked]  = useState<Record<string, boolean>>({});
  const [note,     setNote]     = useState('');
  const [notes,    setNotes]    = useState<{ text: string; time: string }[]>([]);
  const [aiRan,    setAiRan]    = useState(false);
  const [aiLoading, setAiLoad]  = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  const { mutate: updateStatus } = useUpdateIncidentStatus(incident.id);

  const sev      = SEV_CFG[incident.severity] || SEV_CFG[3];
  const typ      = TYPE_ICON[incident.type]   || TYPE_ICON.other;
  const agencies = INCIDENT_AGENCIES[incident.type] || [];
  const aiRecs   = AI_ACTIONS[incident.type] || [];
  const curIdx   = STATUS_FLOW.indexOf(incident.status);
  const nextStatus = STATUS_FLOW[curIdx + 1];
  const overdue  = isOverdue(incident);

  const handleAdvance = () => {
    if (!nextStatus) return;
    setStatusLoading(true);
    updateStatus(nextStatus, {
      onSuccess: () => setStatusLoading(false),
      onError:   () => setStatusLoading(false),
    });
  };

  const TABS: { id: PanelTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview',  label: 'Overview',  icon: <FileText size={11} /> },
    { id: 'agencies',  label: 'Agencies',  icon: <Radio    size={11} /> },
    { id: 'ai',        label: 'AI Triage', icon: <Zap      size={11} /> },
    { id: 'timeline',  label: 'Timeline',  icon: <Activity size={11} /> },
  ];

  // Timeline entries (derived from what we know)
  const timelineEntries = [
    { dot: 'bg-navy',    label: 'Incident reported',               sub: 'Via Public Portal — citizen report', time: incident.createdAt },
    ...(incident.assignedTo ? [
      { dot: 'bg-teal',  label: `Claimed by ${incident.assignedTo.name}`, sub: incident.assignedTo.unit, time: incident.updatedAt },
    ] : []),
    ...(incident.status !== 'open' ? [
      { dot: 'bg-amber', label: `Status → ${STATUS_CFG[incident.status].label}`, sub: 'Status updated', time: incident.updatedAt },
    ] : []),
    ...notes.map(n => ({
      dot: 'bg-ink-muted', label: 'Field note added',
      sub: n.text.slice(0, 60) + (n.text.length > 60 ? '…' : ''), time: n.time,
    })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return (
    <div className="flex flex-col h-full bg-white">

      {/* ── Header ── */}
      <div className={`px-5 py-4 border-b border-paper-border flex-shrink-0 ${
        incident.severity === 1 ? 'bg-red-light' :
        incident.severity === 2 ? 'bg-amber-light' : 'bg-white'
      }`}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-mono text-xs font-bold text-ink-muted">{incident.ticketNumber}</span>
              <StatusBadge status={incident.status} />
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${sev.bg} ${sev.color} ${sev.border}`}>
                SEV {incident.severity} · {sev.label}
              </span>
              {overdue && (
                <span className="text-[9px] font-bold text-red animate-pulse">⚠ OVERDUE</span>
              )}
            </div>
            <h2 className="font-bold text-ink text-sm leading-snug">{incident.title}</h2>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-ink-muted flex-wrap">
              <span className="flex items-center gap-1"><MapPin size={9} />{incident.locationText}</span>
              <span className="flex items-center gap-1"><Clock  size={9} />{timeAgo(incident.createdAt)}</span>
              <span className={`flex items-center gap-1 font-medium ${typ.color}`}>
                {typ.icon}{formatIncidentType(incident.type)}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-ink-muted hover:text-ink flex-shrink-0 mt-0.5">
            <X size={16} />
          </button>
        </div>

        {/* Compact ownership strip */}
        <div className="flex items-center gap-1.5 text-[10px] text-ink-muted mb-3 flex-wrap">
          <span className="flex items-center gap-1 px-2 py-0.5 bg-white border border-paper-border rounded">
            <FileText size={9} /> Public Report
          </span>
          <ChevronRight size={9} />
          {incident.assignedTo ? (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-teal-light border border-teal rounded text-teal-dark font-semibold">
              <User size={9} /> {incident.assignedTo.name}
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-red-light border border-red rounded text-red-dark font-semibold animate-pulse">
              <AlertCircle size={9} /> Needs a Reviewer
            </span>
          )}
          {incident.assignedTo && (
            <>
              <ChevronRight size={9} />
              <span className="flex items-center gap-1 px-2 py-0.5 bg-navy-light border border-navy-border rounded text-navy-mid font-semibold">
                <Shield size={9} /> {incident.assignedTo.unit}
              </span>
            </>
          )}
        </div>

        {/* Status stepper */}
        <div className="flex items-center gap-1 overflow-x-auto mb-3">
          {STATUS_FLOW.map((s, i) => {
            const done = i < curIdx; const active = i === curIdx;
            return (
              <div key={s} className="flex items-center gap-1 flex-shrink-0">
                <span className={`text-[9px] font-bold px-2 py-1 rounded border ${
                  active ? `${STATUS_CFG[s].bg} ${STATUS_CFG[s].color} ${STATUS_CFG[s].border} ring-1 ring-offset-1 ring-current` :
                  done   ? 'bg-teal-light text-teal-dark border-teal' :
                           'bg-paper text-ink-muted border-paper-border opacity-40'
                }`}>
                  {done && '✓ '}{STATUS_CFG[s].label}
                </span>
                {i < STATUS_FLOW.length - 1 && <ChevronRight size={9} className="text-paper-border" />}
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {nextStatus && !['resolved', 'closed'].includes(incident.status) && (
            <button
              onClick={handleAdvance}
              disabled={statusLoading}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-navy text-white text-xs font-bold rounded-sm hover:bg-navy-dark disabled:opacity-50"
            >
              {statusLoading
                ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><ChevronRight size={11} /> → {STATUS_CFG[nextStatus].label}</>}
            </button>
          )}
          <button
            onClick={() => navigate(`/responder/ticket/${incident.id}`)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 border border-navy text-navy text-xs font-bold rounded-sm hover:bg-navy-light flex-shrink-0"
          >
            <ExternalLink size={11} /> Full Detail
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-paper-border flex-shrink-0">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-[10px] font-semibold border-b-2 transition-colors ${
              tab === t.id ? 'border-navy text-navy' : 'border-transparent text-ink-muted hover:text-ink'
            }`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div className="flex-1 overflow-y-auto">

        {/* Overview */}
        {tab === 'overview' && (
          <div className="p-4 space-y-4">

            {/* Key facts grid */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { l: 'Ticket',     v: incident.ticketNumber },
                { l: 'Type',       v: formatIncidentType(incident.type) },
                { l: 'Severity',   v: `${sev.label} (Level ${incident.severity})` },
                { l: 'Status',     v: STATUS_CFG[incident.status].label },
                { l: 'Location',   v: incident.locationText },
                { l: 'Reported',   v: fmtDate(incident.createdAt) },
              ].map(f => (
                <div key={f.l} className="bg-paper rounded-sm p-2.5">
                  <p className="text-[9px] text-ink-muted mb-0.5">{f.l}</p>
                  <p className="text-xs font-semibold text-ink leading-snug">{f.v}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            <div>
              <p className="text-[10px] font-mono font-semibold text-ink-muted uppercase tracking-wider mb-1.5">Description</p>
              <p className="text-xs text-ink leading-relaxed bg-paper rounded-sm p-3 border border-paper-border">
                {incident.description || 'No description provided.'}
              </p>
            </div>

            {/* Ownership chain — detailed */}
            <div>
              <p className="text-[10px] font-mono font-semibold text-ink-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Users size={10} /> Incident Ownership
              </p>
              <div className="space-y-1.5">
                {[
                  {
                    n: '①', label: 'Reported By',
                    val: 'Public / Citizen',
                    sub: `Submitted via Public Portal · ${timeAgo(incident.createdAt)}`,
                    done: true,
                  },
                  {
                    n: '②', label: 'Reviewed By',
                    val: incident.assignedTo?.name || 'Awaiting a responder',
                    sub: incident.assignedTo ? 'Claimed and reviewing' : 'Not yet claimed — visible in Queue',
                    done: !!incident.assignedTo,
                  },
                  {
                    n: '③', label: 'Assigned To',
                    val: incident.assignedTo
                      ? `${incident.assignedTo.name} · ${incident.assignedTo.unit}`
                      : 'Not yet assigned',
                    sub: incident.assignedTo ? 'Active responder on this incident' : 'Assign via Responder Portal',
                    done: !!incident.assignedTo,
                  },
                ].map(s => (
                  <div key={s.n} className={`flex items-center gap-3 px-3 py-2.5 rounded-sm border transition-all ${
                    s.done ? 'bg-navy-light border-navy-border' : 'bg-paper border-paper-border opacity-60'
                  }`}>
                    <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 ${
                      s.done ? 'bg-navy text-white' : 'bg-paper-border text-ink-muted'
                    }`}>{s.n}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] text-ink-muted">{s.label}</p>
                      <p className="text-xs font-semibold text-ink truncate">{s.val}</p>
                      <p className="text-[9px] text-ink-muted truncate">{s.sub}</p>
                    </div>
                    {s.done && <CheckCircle size={12} className="text-teal flex-shrink-0" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Response health */}
            <div>
              <p className="text-[10px] font-mono font-semibold text-ink-muted uppercase tracking-wider mb-2">Response Health</p>
              <div className="space-y-1.5">
                {[
                  {
                    l: 'Response target',
                    v: incident.severity === 1 ? '< 5 min' : incident.severity === 2 ? '< 10 min' : '< 20 min',
                    ok: true,
                  },
                  {
                    l: 'Time elapsed',
                    v: timeAgo(incident.createdAt),
                    ok: incident.status !== 'open' || !!incident.assignedTo,
                  },
                  {
                    l: 'Assignment status',
                    v: incident.assignedTo ? `${incident.assignedTo.name}` : 'Unassigned',
                    ok: !!incident.assignedTo,
                  },
                ].map(r => (
                  <div key={r.l} className="flex items-center justify-between bg-paper rounded-sm px-3 py-2 text-xs">
                    <span className="text-ink-muted">{r.l}</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`font-semibold text-xs ${r.ok ? 'text-teal-dark' : 'text-red-dark'}`}>{r.v}</span>
                      {r.ok
                        ? <CheckCircle size={10} className="text-teal" />
                        : <AlertCircle size={10} className="text-red" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <p className="text-[10px] font-mono font-semibold text-ink-muted uppercase tracking-wider mb-2">Field Notes</p>
              {notes.map((n, i) => (
                <div key={i} className="text-xs text-ink bg-paper rounded px-3 py-2 mb-1.5 border border-paper-border">
                  {n.text}
                  <p className="text-[9px] text-ink-muted mt-0.5 font-mono">{fmtDate(n.time)}</p>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && note.trim()) {
                      setNotes(p => [...p, { text: note, time: new Date().toISOString() }]);
                      setNote('');
                    }
                  }}
                  placeholder="Add field note…"
                  className="flex-1 px-2.5 py-1.5 border border-paper-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-navy"
                />
                <button
                  onClick={() => {
                    if (note.trim()) {
                      setNotes(p => [...p, { text: note, time: new Date().toISOString() }]);
                      setNote('');
                    }
                  }}
                  className="px-2.5 py-1.5 bg-navy text-white text-xs rounded hover:bg-navy-dark"
                >
                  <Send size={11} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Agencies */}
        {tab === 'agencies' && (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-ink-muted">Mark agencies as alerted after contacting them.</p>
              <span className={`text-[10px] font-bold ${alerted.size === agencies.length && agencies.length > 0 ? 'text-teal-dark' : 'text-amber-dark'}`}>
                {alerted.size}/{agencies.length}
              </span>
            </div>
            <div className="h-1 bg-paper-border rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-teal rounded-full transition-all"
                style={{ width: `${agencies.length > 0 ? (alerted.size / agencies.length) * 100 : 0}%` }}
              />
            </div>

            {agencies.map(ag => {
              const done = alerted.has(ag.name);
              return (
                <div key={ag.name} className={`border rounded-sm p-3 transition-all ${done ? 'border-teal bg-teal-light/30' : 'border-paper-border bg-white'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold text-ink">{ag.name}</p>
                        {done && <CheckCircle size={11} className="text-teal" />}
                      </div>
                      <p className="text-[10px] text-ink-muted">{ag.role}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <a
                        href={`tel:${ag.contact.replace(/\s/g, '')}`}
                        className="text-[10px] px-2 py-1 border border-paper-border rounded hover:bg-paper-hover flex items-center gap-1"
                      >
                        <Phone size={9} /> {ag.contact}
                      </a>
                      <button
                        onClick={() => setAlerted(p => {
                          const n = new Set(p);
                          n.has(ag.name) ? n.delete(ag.name) : n.add(ag.name);
                          return n;
                        })}
                        className={`text-[10px] px-2.5 py-1 rounded font-bold transition-colors ${
                          done ? 'bg-paper border border-paper-border text-ink-muted' : 'bg-teal text-white hover:bg-teal-dark'
                        }`}
                      >
                        {done ? 'Undo' : '✓ Alert'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="mt-2 pt-3 border-t border-paper-border">
              <p className="text-[10px] text-ink-muted mb-2">For full agency communication & coordination tools:</p>
              <button
                onClick={() => navigate(`/responder/ticket/${incident.id}`)}
                className="w-full flex items-center justify-center gap-2 py-2 border border-navy text-navy text-xs font-semibold rounded-sm hover:bg-navy-light"
              >
                <ExternalLink size={11} /> Open Agency Comm Hub
              </button>
            </div>
          </div>
        )}

        {/* AI Triage */}
        {tab === 'ai' && (
          <div className="p-4 space-y-4">
            {!aiRan && !aiLoading && (
              <div className="text-center py-8 bg-paper border border-paper-border rounded-sm">
                <Zap size={24} className="text-navy mx-auto mb-2 opacity-40" />
                <p className="text-xs font-semibold text-ink mb-1">AI Triage Not Run</p>
                <p className="text-[11px] text-ink-muted mb-4 max-w-[200px] mx-auto">
                  Get ranked response recommendations with confidence scores.
                </p>
                <button
                  onClick={() => {
                    setAiLoad(true);
                    setTimeout(() => { setAiLoad(false); setAiRan(true); }, 1800);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-navy text-white text-xs font-semibold rounded-sm hover:bg-navy-dark mx-auto"
                >
                  <Zap size={12} /> Run AI Triage
                </button>
              </div>
            )}

            {aiLoading && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-7 w-7 border-b-2 border-navy mb-2" />
                <p className="text-xs text-ink-muted">Analysing incident data…</p>
              </div>
            )}

            {aiRan && !aiLoading && (
              <>
                <div className="flex items-center gap-2 bg-teal-light border border-teal rounded-sm px-3 py-2">
                  <CheckCircle size={12} className="text-teal" />
                  <p className="text-[11px] font-semibold text-teal-dark">
                    AI Triage Complete · {incident.severity === 1 ? '91' : incident.severity === 2 ? '82' : '71'}% confidence
                  </p>
                </div>

                <div className="space-y-2">
                  {aiRecs.map((rec, i) => (
                    <div key={i} className="bg-white border border-paper-border rounded-sm p-3">
                      <div className="flex items-start gap-2.5">
                        <div className="w-5 h-5 bg-navy text-white text-[9px] font-bold rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-ink">{rec.action}</p>
                          <div className="mt-1.5 h-1 bg-paper-border rounded-full overflow-hidden">
                            <div className={`h-full ${rec.confidence >= 80 ? 'bg-teal' : 'bg-amber'} rounded-full`}
                              style={{ width: `${rec.confidence}%` }} />
                          </div>
                          <p className="text-[10px] text-ink-muted mt-0.5">{rec.confidence}% confidence</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <p className="text-[10px] text-ink-muted bg-paper-hover rounded p-2.5 mb-3">
                    For full triage with resource estimates, approval workflow, and operational dispatch tools:
                  </p>
                  <button
                    onClick={() => navigate(`/responder/ticket/${incident.id}`)}
                    className="w-full flex items-center justify-center gap-2 py-2 border border-navy text-navy text-xs font-bold rounded-sm hover:bg-navy-light"
                  >
                    <ExternalLink size={11} /> Open Full Triage View
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Timeline */}
        {tab === 'timeline' && (
          <div className="p-4">
            <p className="text-[10px] font-mono font-semibold text-ink-muted uppercase tracking-wider mb-4">
              {timelineEntries.length} event{timelineEntries.length !== 1 ? 's' : ''} · Most recent first
            </p>
            <div className="space-y-0">
              {timelineEntries.map((entry, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${entry.dot}`} />
                    {i < timelineEntries.length - 1 && <div className="w-px flex-1 bg-paper-border mt-1" />}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="text-xs font-semibold text-ink">{entry.label}</p>
                    <p className="text-[11px] text-ink-muted mt-0.5">{entry.sub}</p>
                    <p className="text-[10px] text-ink-muted font-mono mt-1">{fmtDate(entry.time)}</p>
                  </div>
                </div>
              ))}
              {timelineEntries.length === 0 && (
                <p className="text-xs text-ink-muted text-center py-4">No timeline entries yet.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main IncidentManagement ──────────────────────────────────────────────────

export function IncidentManagement() {
  const navigate = useNavigate();

  const [search,      setSearch]      = useState('');
  const [filterStatus, setFStatus]    = useState<IncidentStatus | 'all'>('all');
  const [filterSev,    setFSev]       = useState<IncidentSeverity | 'all'>('all');
  const [filterType,   setFType]      = useState<IncidentType | 'all'>('all');
  const [sortKey,      setSortKey]    = useState<SortKey>('created_at');
  const [sortDir,      setSortDir]    = useState<SortDir>('desc');
  const [selected,     setSelected]   = useState<IncidentListItem | null>(null);
  const [showFilters,  setShowFilters]= useState(false);
  const [activeTab,    setActiveTab]  = useState<TabId>('all');

  const { data, isLoading, refetch } = useIncidents({ limit: 200 });
  const all = data?.incidents || [];

  // Tab buckets
  const TAB_DATA = useMemo((): Record<TabId, IncidentListItem[]> => ({
    all:          all,
    needs_review: all.filter(i => i.status === 'open' && !i.assignedTo),
    active:       all.filter(i => ['triaging', 'dispatched', 'on_scene'].includes(i.status)),
    resolved:     all.filter(i => ['resolved', 'closed'].includes(i.status)),
  }), [all]);

  // Filtered + sorted
  const incidents = useMemo(() => {
    let list = TAB_DATA[activeTab].filter(i => {
      const q  = search.toLowerCase();
      const ms = !q || i.title.toLowerCase().includes(q) ||
                      i.locationText.toLowerCase().includes(q) ||
                      i.ticketNumber.toLowerCase().includes(q);
      const mst = filterStatus === 'all' || i.status   === filterStatus;
      const msv = filterSev    === 'all' || i.severity === Number(filterSev);
      const mt  = filterType   === 'all' || i.type     === filterType;
      return ms && mst && msv && mt;
    });
    list = [...list].sort((a, b) => {
      let c = 0;
      if (sortKey === 'created_at') c = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortKey === 'severity')   c = a.severity - b.severity;
      if (sortKey === 'status')     c = a.status.localeCompare(b.status);
      if (sortKey === 'type')       c = a.type.localeCompare(b.type);
      return sortDir === 'asc' ? -c : c;
    });
    return list;
  }, [TAB_DATA, activeTab, search, filterStatus, filterSev, filterType, sortKey, sortDir]);

  const handleExport = () => {
    const rows = [
      ['Ticket', 'Type', 'Title', 'Location', 'Severity', 'Status', 'Assigned To', 'Reporter', 'Created'].join(','),
      ...incidents.map(i => [
        i.ticketNumber,
        formatIncidentType(i.type),
        `"${i.title.replace(/"/g, '""')}"`,
        `"${i.locationText.replace(/"/g, '""')}"`,
        formatSeverity(i.severity),
        i.status,
        i.assignedTo?.name || 'Unassigned',
        'Public',
        fmtDate(i.createdAt),
      ].join(',')),
    ].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([rows], { type: 'text/csv' }));
    a.download = `incidents-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const unassigned    = all.filter(i => i.status === 'open' && !i.assignedTo).length;
  const criticalCount = all.filter(i => i.severity === 1 && !['resolved', 'closed'].includes(i.status)).length;

  const TABS: { id: TabId; label: string; alert?: boolean }[] = [
    { id: 'all',          label: 'All Incidents'        },
    { id: 'needs_review', label: 'Needs Review',  alert: unassigned > 0 },
    { id: 'active',       label: 'In Progress'          },
    { id: 'resolved',     label: 'Resolved'             },
  ];

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-paper">

      {/* Page header */}
      <div className="bg-white border-b border-paper-border px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-2xl font-semibold text-ink">Incident Management</h1>
            <p className="text-sm text-ink-muted">
              National overview · {all.length} incidents
              {unassigned > 0 && <span className="text-red font-semibold"> · {unassigned} unreviewed</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => refetch()}
              className="flex items-center gap-2 px-3 py-2 border border-paper-border rounded-sm hover:bg-paper-hover text-sm text-ink-muted">
              <RefreshCw size={14} /> Refresh
            </button>
            <button onClick={handleExport}
              className="flex items-center gap-2 px-3 py-2 border border-paper-border rounded-sm hover:bg-paper-hover text-sm text-ink">
              <Download size={14} /> Export
            </button>
          </div>
        </div>

        {/* Critical banner */}
        {criticalCount > 0 && (
          <div className="mt-3 flex items-center gap-3 bg-red-light border border-red rounded-sm px-4 py-2.5">
            <Siren size={14} className="text-red animate-pulse flex-shrink-0" />
            <p className="text-sm font-bold text-red-dark">
              {criticalCount} CRITICAL incident{criticalCount > 1 ? 's' : ''} active — immediate action required
            </p>
            <button
              onClick={() => { setActiveTab('all'); setFSev(1 as IncidentSeverity); }}
              className="ml-auto text-xs text-red-dark font-semibold underline"
            >
              Filter →
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="px-6 pt-4 flex-shrink-0">
        <StatsBar incidents={all} />
      </div>

      {/* Split panel */}
      <div className="flex-1 overflow-hidden flex">

        {/* Left: list */}
        <div className={`flex flex-col border-r border-paper-border bg-white overflow-hidden transition-all ${
          selected ? 'w-[440px] flex-shrink-0' : 'flex-1'
        }`}>

          {/* Tabs */}
          <div className="flex border-b border-paper-border flex-shrink-0">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === t.id ? 'border-navy text-navy' : 'border-transparent text-ink-muted hover:text-ink'
                }`}>
                {t.label}
                <span className={`text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 ${
                  t.alert && activeTab !== t.id ? 'bg-red text-white animate-pulse' :
                  activeTab === t.id ? 'bg-navy text-white' : 'bg-paper-border text-ink-muted'
                }`}>{TAB_DATA[t.id].length}</span>
              </button>
            ))}
          </div>

          {/* Search + filters */}
          <div className="px-3 py-2.5 border-b border-paper-border space-y-2 flex-shrink-0">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Title, ticket, location…"
                  className="w-full pl-8 pr-2 py-1.5 border border-paper-border rounded-sm text-xs focus:outline-none focus:ring-1 focus:ring-navy"
                />
              </div>
              <button
                onClick={() => setShowFilters(v => !v)}
                className={`flex items-center gap-1 px-2.5 py-1.5 border rounded-sm text-xs ${
                  showFilters ? 'border-navy bg-navy text-white' : 'border-paper-border hover:bg-paper-hover text-ink'
                }`}
              >
                <Filter size={12} />
                {(filterStatus !== 'all' || filterSev !== 'all' || filterType !== 'all') && (
                  <span className="w-3.5 h-3.5 bg-red text-white text-[8px] font-bold rounded-full flex items-center justify-center">!</span>
                )}
              </button>
            </div>

            {showFilters && (
              <div className="grid grid-cols-3 gap-1.5">
                <select value={filterStatus} onChange={e => setFStatus(e.target.value as any)}
                  className="px-2 py-1.5 border border-paper-border rounded text-[10px] bg-white focus:outline-none">
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="triaging">Triaging</option>
                  <option value="dispatched">Dispatched</option>
                  <option value="on_scene">On Scene</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                <select value={filterSev} onChange={e => setFSev(e.target.value as any)}
                  className="px-2 py-1.5 border border-paper-border rounded text-[10px] bg-white focus:outline-none">
                  <option value="all">All Severity</option>
                  <option value={1}>Critical (1)</option>
                  <option value={2}>High (2)</option>
                  <option value={3}>Medium (3)</option>
                </select>
                <select value={filterType} onChange={e => setFType(e.target.value as any)}
                  className="px-2 py-1.5 border border-paper-border rounded text-[10px] bg-white focus:outline-none">
                  <option value="all">All Types</option>
                  <option value="medical">Medical</option>
                  <option value="flood">Flood</option>
                  <option value="fire">Fire</option>
                  <option value="road">Road</option>
                  <option value="infrastructure">Infrastructure</option>
                  <option value="civil">Civil</option>
                  <option value="other">Other</option>
                </select>
              </div>
            )}

            <div className="flex items-center justify-between">
              <p className="text-[10px] text-ink-muted">{incidents.length} result{incidents.length !== 1 ? 's' : ''}</p>
              <div className="flex items-center gap-1">
                {(['created_at', 'severity', 'status'] as SortKey[]).map(k => (
                  <button key={k}
                    onClick={() => { if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortKey(k); setSortDir('desc'); } }}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                      sortKey === k ? 'bg-navy text-white' : 'bg-paper text-ink-muted hover:bg-paper-hover'
                    }`}>
                    {k === 'created_at' ? 'Date' : k.charAt(0).toUpperCase() + k.slice(1)}
                    {sortKey === k && (sortDir === 'desc' ? '↓' : '↑')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-paper-border">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="inline-block animate-spin rounded-full h-7 w-7 border-b-2 border-navy" />
              </div>
            ) : incidents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-ink-muted">
                <AlertCircle size={32} className="mb-3 opacity-30" />
                <p className="text-sm">No incidents found</p>
                <button
                  onClick={() => { setSearch(''); setFStatus('all'); setFSev('all'); setFType('all'); }}
                  className="mt-2 text-xs text-teal hover:underline"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              incidents.map(incident => (
                <IncidentRow
                  key={incident.id}
                  incident={incident}
                  selected={selected?.id === incident.id}
                  onClick={() => setSelected(prev => prev?.id === incident.id ? null : incident)}
                />
              ))
            )}
          </div>
        </div>

        {/* Right: detail panel */}
        {selected && (
          <div className="flex-1 overflow-hidden">
            <DetailPanel
              incident={selected}
              onClose={() => setSelected(null)}
              navigate={navigate}
            />
          </div>
        )}
      </div>
    </div>
  );
}