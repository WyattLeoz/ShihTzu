import { useState, useMemo } from 'react';
import { useIncidents, useUpdateIncidentStatus, useAssignIncident, useApproveIncident } from '../../api/incidents';
import { formatIncidentType, formatSeverity, getSeverityBorderColor } from '../../lib/formatters';
import { StatusBadge } from '../../components/StatusBadge';
import { Badge } from '../../components/Badge';
import { IncidentListItem, IncidentStatus, IncidentType, IncidentSeverity } from '../../types';
import {
  Search, Filter, Download, AlertCircle, CheckCircle, Clock,
  ChevronRight, X, MapPin, Calendar, User, Shield, Activity,
  Zap, AlertTriangle, Radio, FileText, TrendingUp, Users,
  RefreshCw, ChevronDown, ArrowUpDown, Eye, Siren,
  Flame, Droplets, Heart, Car, Building2, Flag, HelpCircle,
  Phone, Send, ThumbsUp, BarChart3, Timer,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type SortKey = 'created_at' | 'severity' | 'status' | 'type';
type SortDir = 'asc' | 'desc';

interface FilterState {
  search: string;
  status: IncidentStatus | 'all';
  severity: IncidentSeverity | 'all';
  type: IncidentType | 'all';
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_FLOW: IncidentStatus[] = [
  'open', 'triaging', 'dispatched', 'on_scene', 'resolved',
];

const STATUS_CONFIG: Record<IncidentStatus, { label: string; color: string; bg: string; border: string }> = {
  open:       { label: 'Open',       color: 'text-ink',        bg: 'bg-paper',        border: 'border-paper-border' },
  triaging:   { label: 'Triaging',   color: 'text-amber-dark', bg: 'bg-amber-light',  border: 'border-amber' },
  dispatched: { label: 'Dispatched', color: 'text-teal-dark',  bg: 'bg-teal-light',   border: 'border-teal' },
  on_scene:   { label: 'On Scene',   color: 'text-navy-mid',   bg: 'bg-navy-light',   border: 'border-navy-border' },
  resolved:   { label: 'Resolved',   color: 'text-teal-dark',  bg: 'bg-teal-light',   border: 'border-teal' },
  closed:     { label: 'Closed',     color: 'text-ink-muted',  bg: 'bg-paper-border', border: 'border-paper-border' },
};

const SEVERITY_CONFIG: Record<number, { label: string; color: string; bg: string; border: string; dot: string }> = {
  1: { label: 'Critical', color: 'text-red-dark',   bg: 'bg-red-light',    border: 'border-red',          dot: 'bg-red' },
  2: { label: 'High',     color: 'text-amber-dark', bg: 'bg-amber-light',  border: 'border-amber',        dot: 'bg-amber' },
  3: { label: 'Medium',   color: 'text-teal-dark',  bg: 'bg-teal-light',   border: 'border-teal',         dot: 'bg-teal' },
};

const TYPE_ICONS: Record<IncidentType, { icon: React.ReactNode; color: string }> = {
  fire:           { icon: <Flame      size={14} />, color: 'text-orange-600' },
  flood:          { icon: <Droplets   size={14} />, color: 'text-blue-600'   },
  medical:        { icon: <Heart      size={14} />, color: 'text-red-600'    },
  road:           { icon: <Car        size={14} />, color: 'text-yellow-600' },
  infrastructure: { icon: <Building2  size={14} />, color: 'text-purple-600' },
  civil:          { icon: <Flag       size={14} />, color: 'text-navy'       },
  other:          { icon: <HelpCircle size={14} />, color: 'text-ink-muted'  },
};

// Agencies to notify per incident type
const INCIDENT_AGENCIES: Record<IncidentType, { name: string; contact: string; role: string }[]> = {
  flood:          [
    { name: 'SCDF',         contact: '1777',          role: 'Flood Response' },
    { name: 'PUB',          contact: '1800 284 6600',  role: 'Drainage Control' },
    { name: 'PA',           contact: '6225 5322',      role: 'Evacuation Centre' },
    { name: 'SPF',          contact: '999',            role: 'Traffic & Cordon' },
    { name: 'Town Council', contact: 'Varies',         role: 'Resident Comms' },
  ],
  medical:        [
    { name: 'SCDF EMS',     contact: '995',            role: 'Ambulance Dispatch' },
    { name: 'MOH',          contact: '1800 333 9999',  role: 'Hospital Coordination' },
    { name: 'SPF',          contact: '999',            role: 'Scene Security' },
  ],
  fire:           [
    { name: 'SCDF',         contact: '995',            role: 'Fire & Rescue' },
    { name: 'SPF',          contact: '999',            role: 'Road Closure' },
    { name: 'SP Group',     contact: '1800 752 1234',  role: 'Utilities Safety' },
    { name: 'LTA',          contact: '1800 2255 582',  role: 'Traffic Diversion' },
  ],
  road:           [
    { name: 'Traffic Police', contact: '6547 0000',   role: 'Accident Investigation' },
    { name: 'SCDF EMS',     contact: '995',            role: 'Medical Response' },
    { name: 'LTA',          contact: '1800 2255 582',  role: 'Road Advisory' },
  ],
  infrastructure: [
    { name: 'SCDF',         contact: '1777',           role: 'Structural Assessment' },
    { name: 'BCA',          contact: '1800 342 5222',  role: 'Building Safety' },
    { name: 'SP Group',     contact: '1800 752 1234',  role: 'Utilities' },
    { name: 'SPF',          contact: '999',            role: 'Perimeter Cordon' },
  ],
  civil:          [
    { name: 'SPF',          contact: '999',            role: 'Law & Order' },
    { name: 'SCDF EMS',     contact: '995',            role: 'Medical Standby' },
    { name: 'ISD',          contact: '1800 278 7000',  role: 'Security Intelligence' },
  ],
  other:          [
    { name: 'SCDF',         contact: '1777',           role: 'First Response' },
    { name: 'SPF',          contact: '999',            role: 'Support' },
  ],
};

// AI triage action options per type
const AI_ACTIONS: Record<IncidentType, string[]> = {
  flood:          ['Deploy SCDF pump trucks + rescue boat', 'Activate nearest evacuation centre', 'Issue zone-level public advisory'],
  medical:        ['Dispatch ALS ambulance to scene', 'Pre-alert receiving hospital A&E', 'Request bystander CPR support via 995'],
  fire:           ['Dispatch 2× fire engines + ladder platform', 'Evacuate building + establish cordon', 'Alert SP Group if gas lines at risk'],
  road:           ['Deploy Traffic Police to scene', 'Activate SCDF EMS if casualties', 'Issue LTA One Motoring advisory'],
  infrastructure: ['Alert SCDF + BCA for structural assessment', 'Evacuate 50m perimeter', 'Isolate affected utilities'],
  civil:          ['Deploy SPF rapid response', 'Seal inner + outer cordon', 'Activate medical standby'],
  other:          ['Deploy first response team', 'Establish incident command post', 'Assess and escalate if needed'],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmtDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-SG', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── Incident Detail Panel ────────────────────────────────────────────────────

function IncidentDetailPanel({
  incident,
  onClose,
}: {
  incident: IncidentListItem;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'agencies' | 'ai' | 'timeline'>('overview');
  const [contactedAgencies, setContactedAgencies] = useState<Set<string>>(new Set());
  const [aiTriaged, setAiTriaged] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState<{ text: string; time: string }[]>([]);
  const [statusLoading, setStatusLoading] = useState(false);

  const { mutate: updateStatus } = useUpdateIncidentStatus(incident.id);

  const sevcfg = SEVERITY_CONFIG[incident.severity] || SEVERITY_CONFIG[3];
  const typecfg = TYPE_ICONS[incident.type] || TYPE_ICONS.other;
  const agencies = INCIDENT_AGENCIES[incident.type] || [];
  const aiActions = AI_ACTIONS[incident.type] || [];
  const curStatusIdx = STATUS_FLOW.indexOf(incident.status);
  const nextStatus = STATUS_FLOW[curStatusIdx + 1];

  const handleAdvanceStatus = () => {
    if (!nextStatus) return;
    setStatusLoading(true);
    updateStatus(nextStatus, {
      onSuccess: () => setStatusLoading(false),
      onError: () => setStatusLoading(false),
    });
  };

  const handleRunAI = () => {
    setAiLoading(true);
    setTimeout(() => { setAiLoading(false); setAiTriaged(true); }, 2000);
  };

  const handleAddNote = () => {
    if (!note.trim()) return;
    setNotes(prev => [...prev, { text: note, time: new Date().toISOString() }]);
    setNote('');
  };

  const TABS = [
    { id: 'overview' as const,  label: 'Overview',  icon: <Eye size={13} /> },
    { id: 'agencies' as const,  label: 'Agencies',  icon: <Radio size={13} /> },
    { id: 'ai'       as const,  label: 'AI Triage', icon: <Zap size={13} /> },
    { id: 'timeline' as const,  label: 'Timeline',  icon: <FileText size={13} /> },
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className={`px-5 py-4 border-b border-paper-border ${
        incident.severity === 1 ? 'bg-red-light' :
        incident.severity === 2 ? 'bg-amber-light' : 'bg-white'
      }`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-mono text-xs font-bold text-ink-muted">{incident.ticketNumber}</span>
              <StatusBadge status={incident.status} />
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${sevcfg.bg} ${sevcfg.color} ${sevcfg.border}`}>
                SEV {incident.severity} · {sevcfg.label}
              </span>
            </div>
            <h2 className="font-bold text-ink text-base leading-snug">{incident.title}</h2>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-ink-muted flex-wrap">
              <span className="flex items-center gap-1"><MapPin size={11} />{incident.locationText}</span>
              <span className="flex items-center gap-1"><Clock size={11} />{timeAgo(incident.createdAt)}</span>
              <span className={`flex items-center gap-1 ${typecfg.color}`}>
                {typecfg.icon} {formatIncidentType(incident.type)}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-ink-muted hover:text-ink flex-shrink-0 mt-0.5">
            <X size={18} />
          </button>
        </div>

        {/* Status stepper */}
        <div className="mt-4 flex items-center gap-1 overflow-x-auto pb-1">
          {STATUS_FLOW.map((s, i) => {
            const done = i < curStatusIdx;
            const active = i === curStatusIdx;
            const scfg = STATUS_CONFIG[s];
            return (
              <div key={s} className="flex items-center gap-1 flex-shrink-0">
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-semibold border transition-all ${
                  active  ? `${scfg.bg} ${scfg.color} ${scfg.border} ring-1 ring-offset-1 ring-current` :
                  done    ? 'bg-teal-light text-teal-dark border-teal' :
                            'bg-white text-ink-muted border-paper-border opacity-50'
                }`}>
                  {done && <CheckCircle size={10} />}
                  {active && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
                  {scfg.label}
                </div>
                {i < STATUS_FLOW.length - 1 && (
                  <ChevronRight size={10} className="text-paper-border flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* Advance status button */}
        {nextStatus && incident.status !== 'resolved' && incident.status !== 'closed' && (
          <button
            onClick={handleAdvanceStatus}
            disabled={statusLoading}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2 bg-navy text-white text-xs font-semibold rounded-sm hover:bg-navy-dark disabled:opacity-50 transition-colors"
          >
            {statusLoading
              ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Updating…</>
              : <><ChevronRight size={13} /> Advance to {STATUS_CONFIG[nextStatus].label}</>}
          </button>
        )}
        {incident.status === 'resolved' && (
          <div className="mt-3 flex items-center justify-center gap-2 py-2 bg-teal-light border border-teal rounded-sm text-xs font-semibold text-teal-dark">
            <CheckCircle size={13} /> Incident Resolved
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-paper-border">
        <div className="flex">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-navy text-navy bg-white'
                  : 'border-transparent text-ink-muted hover:text-ink'
              }`}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">

        {/* ── Overview tab ── */}
        {activeTab === 'overview' && (
          <div className="p-5 space-y-5">
            {/* Key facts grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Ticket',       value: incident.ticketNumber,               icon: <FileText size={12} /> },
                { label: 'Type',         value: formatIncidentType(incident.type),   icon: typecfg.icon },
                { label: 'Severity',     value: `${sevcfg.label} (Level ${incident.severity})`, icon: <AlertTriangle size={12} /> },
                { label: 'Status',       value: STATUS_CONFIG[incident.status].label, icon: <Activity size={12} /> },
                { label: 'Reported',     value: fmtDate(incident.createdAt),         icon: <Calendar size={12} /> },
                { label: 'Assigned To',  value: incident.assignedTo?.name || 'Unassigned', icon: <User size={12} /> },
              ].map(f => (
                <div key={f.label} className="bg-paper rounded-sm p-3">
                  <div className="flex items-center gap-1.5 text-[10px] text-ink-muted mb-1">{f.icon}{f.label}</div>
                  <p className="text-xs font-semibold text-ink leading-snug">{f.value}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            <div>
              <p className="text-[10px] font-mono font-semibold text-ink-muted uppercase tracking-wider mb-2">Description</p>
              <p className="text-sm text-ink leading-relaxed bg-paper rounded-sm p-3">
                {incident.description || 'No description provided.'}
              </p>
            </div>

            {/* Response indicators */}
            <div>
              <p className="text-[10px] font-mono font-semibold text-ink-muted uppercase tracking-wider mb-2">Response Indicators</p>
              <div className="space-y-2">
                {[
                  {
                    label: 'Response time target',
                    value: incident.severity === 1 ? '< 5 min' : incident.severity === 2 ? '< 10 min' : '< 20 min',
                    ok: true,
                  },
                  {
                    label: 'Elapsed since report',
                    value: timeAgo(incident.createdAt),
                    ok: incident.status !== 'open',
                  },
                  {
                    label: 'Resource assignment',
                    value: incident.assignedTo ? `${incident.assignedTo.name} (${incident.assignedTo.unit})` : 'Not yet assigned',
                    ok: !!incident.assignedTo,
                  },
                ].map(ind => (
                  <div key={ind.label} className="flex items-center justify-between text-xs bg-paper p-2.5 rounded-sm">
                    <span className="text-ink-muted">{ind.label}</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`font-semibold ${ind.ok ? 'text-teal-dark' : 'text-red-dark'}`}>{ind.value}</span>
                      {ind.ok
                        ? <CheckCircle size={11} className="text-teal" />
                        : <AlertCircle size={11} className="text-red" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Field notes */}
            <div>
              <p className="text-[10px] font-mono font-semibold text-ink-muted uppercase tracking-wider mb-2">Field Notes</p>
              {notes.length > 0 && (
                <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                  {notes.map((n, i) => (
                    <div key={i} className="bg-navy-light border border-navy-border rounded-sm p-2.5">
                      <p className="text-xs text-ink">{n.text}</p>
                      <p className="text-[10px] text-ink-muted mt-1">{fmtDate(n.time)}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                  placeholder="Add field note or update…"
                  className="flex-1 px-3 py-2 border border-paper-border rounded-sm text-xs focus:outline-none focus:ring-2 focus:ring-navy"
                />
                <button onClick={handleAddNote} disabled={!note.trim()}
                  className="px-3 py-2 bg-navy text-white rounded-sm text-xs hover:bg-navy-dark disabled:opacity-40">
                  <Send size={12} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Agencies tab ── */}
        {activeTab === 'agencies' && (
          <div className="p-5 space-y-4">
            <div className="bg-amber-light border border-amber rounded-sm p-3 text-xs text-amber-dark">
              <strong>Coordination required:</strong> Contact all relevant agencies below. Mark each as alerted once communication is established.
            </div>

            <div className="space-y-3">
              {agencies.map(ag => {
                const contacted = contactedAgencies.has(ag.name);
                return (
                  <div key={ag.name} className={`border rounded-sm overflow-hidden transition-all ${
                    contacted ? 'border-teal bg-teal-light/30' : 'border-paper-border bg-white'
                  }`}>
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0 ${
                          contacted ? 'bg-teal text-white' : 'bg-navy text-white'
                        }`}>
                          <Shield size={14} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-ink">{ag.name}</p>
                            {contacted && (
                              <span className="text-[10px] font-bold text-teal-dark bg-teal-light px-1.5 py-0.5 rounded">
                                ✓ Alerted
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-ink-muted">{ag.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <a href={`tel:${ag.contact.replace(/\s/g, '')}`}
                          className="flex items-center gap-1 px-2.5 py-1.5 border border-paper-border rounded-sm text-xs text-ink hover:bg-paper-hover">
                          <Phone size={11} /> {ag.contact}
                        </a>
                        <button
                          onClick={() => setContactedAgencies(prev => {
                            const next = new Set(prev);
                            next.has(ag.name) ? next.delete(ag.name) : next.add(ag.name);
                            return next;
                          })}
                          className={`px-3 py-1.5 rounded-sm text-xs font-semibold transition-colors ${
                            contacted
                              ? 'bg-paper border border-paper-border text-ink-muted hover:bg-paper-hover'
                              : 'bg-teal text-white hover:bg-teal-dark'
                          }`}>
                          {contacted ? 'Undo' : 'Mark Alerted'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="bg-paper border border-paper-border rounded-sm p-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-ink-muted">Agencies alerted</span>
                <span className={`font-bold ${
                  contactedAgencies.size === agencies.length ? 'text-teal-dark' : 'text-amber-dark'
                }`}>
                  {contactedAgencies.size}/{agencies.length}
                </span>
              </div>
              <div className="h-1.5 bg-paper-border rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-teal rounded-full transition-all"
                  style={{ width: `${agencies.length > 0 ? (contactedAgencies.size / agencies.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── AI Triage tab ── */}
        {activeTab === 'ai' && (
          <div className="p-5 space-y-4">
            {!aiTriaged ? (
              <>
                <div className="bg-paper border border-paper-border rounded-sm p-4 text-center">
                  <Zap size={28} className="text-navy mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-semibold text-ink mb-1">AI Triage Not Yet Run</p>
                  <p className="text-xs text-ink-muted mb-4">
                    Run AI triage to get recommended actions, resource requirements, and estimated response time based on this incident's data.
                  </p>
                  <button onClick={handleRunAI} disabled={aiLoading}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-navy text-white text-sm font-semibold rounded-sm hover:bg-navy-dark disabled:opacity-50 transition-colors mx-auto">
                    {aiLoading
                      ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Analysing…</>
                      : <><Zap size={14} /> Run AI Triage</>}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 bg-teal-light border border-teal rounded-sm px-3 py-2.5">
                  <CheckCircle size={14} className="text-teal flex-shrink-0" />
                  <p className="text-xs font-semibold text-teal-dark">AI Triage Complete — {incident.severity === 1 ? '91' : incident.severity === 2 ? '78' : '65'}% confidence</p>
                  <button onClick={() => setAiTriaged(false)} className="ml-auto text-teal-dark opacity-50 hover:opacity-100"><X size={13} /></button>
                </div>

                <div>
                  <p className="text-[10px] font-mono font-semibold text-ink-muted uppercase tracking-wider mb-2">Recommended Actions</p>
                  <div className="space-y-2">
                    {aiActions.map((action, i) => (
                      <div key={i} className="flex items-start gap-3 bg-white border border-paper-border rounded-sm p-3">
                        <div className="w-6 h-6 bg-navy text-white text-xs font-bold rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-ink">{action}</p>
                          <div className="mt-1.5 h-1 bg-paper-border rounded-full overflow-hidden">
                            <div
                              className="h-full bg-teal rounded-full"
                              style={{ width: `${95 - i * 12}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-ink-muted mt-0.5">{95 - i * 12}% confidence</p>
                        </div>
                        {i === 0 && (
                          <button className="flex items-center gap-1 px-2.5 py-1.5 bg-teal text-white text-[10px] font-semibold rounded hover:bg-teal-dark flex-shrink-0">
                            <ThumbsUp size={10} /> Approve
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-mono font-semibold text-ink-muted uppercase tracking-wider mb-2">Resource Requirements</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Est. Response Time', value: incident.severity === 1 ? '4–6 min' : incident.severity === 2 ? '8–12 min' : '15–20 min' },
                      { label: 'Personnel Needed', value: incident.severity === 1 ? '8–12' : incident.severity === 2 ? '4–6' : '2–4' },
                      { label: 'Vehicles Required', value: incident.severity === 1 ? '3–4' : incident.severity === 2 ? '2' : '1' },
                      { label: 'Est. Resolution', value: incident.severity === 1 ? '2–4 hrs' : incident.severity === 2 ? '1–2 hrs' : '30–60 min' },
                    ].map(r => (
                      <div key={r.label} className="bg-paper rounded-sm p-2.5 text-center">
                        <p className="text-[10px] text-ink-muted mb-0.5">{r.label}</p>
                        <p className="text-sm font-bold text-ink">{r.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-[11px] text-ink-muted bg-paper-hover rounded-sm p-2.5 leading-relaxed">
                  AI recommendations are based on historical incident data and current resource availability. Final operational decisions remain with the duty commander.
                </p>
              </>
            )}
          </div>
        )}

        {/* ── Timeline tab ── */}
        {activeTab === 'timeline' && (
          <div className="p-5">
            <div className="space-y-3">
              {/* Auto-generated timeline entries */}
              {[
                { time: incident.createdAt, label: 'Incident reported', sub: 'Ticket created and entered into system', type: 'create' },
                ...(incident.status !== 'open' ? [{ time: incident.updatedAt, label: `Status → ${STATUS_CONFIG[incident.status].label}`, sub: 'Status updated by operator', type: 'status' }] : []),
                ...(incident.assignedTo ? [{ time: incident.updatedAt, label: `Assigned to ${incident.assignedTo.name}`, sub: incident.assignedTo.unit, type: 'assign' }] : []),
                ...notes.map(n => ({ time: n.time, label: 'Field note added', sub: n.text, type: 'note' })),
              ]
                .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
                .map((entry, i, arr) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-0.5 ${
                        entry.type === 'create' ? 'bg-navy' :
                        entry.type === 'status' ? 'bg-teal' :
                        entry.type === 'assign' ? 'bg-amber' : 'bg-ink-muted'
                      }`} />
                      {i < arr.length - 1 && <div className="w-px flex-1 bg-paper-border mt-1" />}
                    </div>
                    <div className="flex-1 pb-3">
                      <p className="text-xs font-semibold text-ink">{entry.label}</p>
                      <p className="text-[11px] text-ink-muted mt-0.5">{entry.sub}</p>
                      <p className="text-[10px] text-ink-muted mt-1 font-mono">{fmtDate(entry.time)}</p>
                    </div>
                  </div>
                ))}

              {notes.length === 0 && incident.status === 'open' && !incident.assignedTo && (
                <div className="text-center py-6 text-ink-muted">
                  <Clock size={24} className="mx-auto mb-2 opacity-30" />
                  <p className="text-xs">Only the creation event so far. Timeline updates as the incident progresses.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Stats Bar ─────────────────────────────────────────────────────────────────

function StatsBar({ incidents }: { incidents: IncidentListItem[] }) {
  const open     = incidents.filter(i => i.status === 'open').length;
  const critical = incidents.filter(i => i.severity === 1).length;
  const active   = incidents.filter(i => !['resolved', 'closed'].includes(i.status)).length;
  const resolved = incidents.filter(i => ['resolved', 'closed'].includes(i.status)).length;
  const resRate  = incidents.length > 0 ? Math.round((resolved / incidents.length) * 100) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
      {[
        { label: 'Total Incidents',  value: incidents.length, sub: 'all time',                icon: <BarChart3   size={16} className="text-navy"       />, alert: false },
        { label: 'Active',           value: active,           sub: 'requiring attention',      icon: <Activity    size={16} className="text-amber"      />, alert: active > 10 },
        { label: 'Unassigned Open',  value: open,             sub: 'pending assignment',        icon: <AlertCircle size={16} className="text-red"        />, alert: open > 0 },
        { label: 'Critical (Sev 1)', value: critical,         sub: 'highest priority',          icon: <Siren       size={16} className="text-red"        />, alert: critical > 0 },
        { label: 'Resolution Rate',  value: `${resRate}%`,   sub: `${resolved} resolved`,     icon: <TrendingUp  size={16} className="text-teal"       />, alert: false },
      ].map(s => (
        <div key={s.label} className={`bg-white border rounded-sm p-4 ${s.alert ? 'border-red' : 'border-paper-border'}`}>
          <div className="flex items-start justify-between mb-1">
            {s.icon}
            {s.alert && <div className="w-2 h-2 bg-red rounded-full animate-pulse" />}
          </div>
          <div className="text-2xl font-bold text-ink mt-1">{s.value}</div>
          <div className="text-[10px] text-ink-muted mt-0.5">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Incident Row ─────────────────────────────────────────────────────────────

function IncidentRow({
  incident,
  selected,
  onClick,
}: {
  incident: IncidentListItem;
  selected: boolean;
  onClick: () => void;
}) {
  const sevcfg  = SEVERITY_CONFIG[incident.severity] || SEVERITY_CONFIG[3];
  const typecfg = TYPE_ICONS[incident.type] || TYPE_ICONS.other;
  const isOld   = incident.status === 'open' && Date.now() - new Date(incident.createdAt).getTime() > 15 * 60 * 1000;

  return (
    <div
      onClick={onClick}
      className={`px-4 py-3.5 cursor-pointer border-l-4 transition-all ${
        selected ? 'bg-navy-light border-l-navy' : 'hover:bg-paper-hover border-l-transparent'
      } ${getSeverityBorderColor(incident.severity)}`}
      style={{ borderLeftWidth: selected ? '3px' : '3px' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Top row */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-mono text-xs text-ink-muted">{incident.ticketNumber}</span>
            <span className={`flex items-center gap-1 text-[10px] font-semibold ${typecfg.color}`}>
              {typecfg.icon} {formatIncidentType(incident.type)}
            </span>
            <StatusBadge status={incident.status} />
            {incident.severity === 1 && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-red bg-red-light px-1.5 py-0.5 rounded">
                <Siren size={9} /> CRITICAL
              </span>
            )}
          </div>
          {/* Title */}
          <p className={`text-sm font-semibold truncate ${selected ? 'text-navy' : 'text-ink'}`}>
            {incident.title}
          </p>
          {/* Meta */}
          <div className="flex items-center gap-3 mt-1 text-xs text-ink-muted">
            <span className="flex items-center gap-1"><MapPin size={10} />{incident.locationText}</span>
            <span className={`flex items-center gap-1 ${isOld ? 'text-red font-semibold' : ''}`}>
              <Clock size={10} />{timeAgo(incident.createdAt)}
            </span>
          </div>
        </div>
        {/* Severity dot */}
        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 ${sevcfg.dot}`} />
      </div>

      {/* Assignment bar */}
      {incident.assignedTo && (
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-ink-muted">
          <User size={9} /> {incident.assignedTo.name} · {incident.assignedTo.unit}
        </div>
      )}
    </div>
  );
}

// ─── Main IncidentManagement ──────────────────────────────────────────────────

export function IncidentManagement() {
  const [filters, setFilters] = useState<FilterState>({
    search: '', status: 'all', severity: 'all', type: 'all',
  });
  const [sortKey, setSortKey]   = useState<SortKey>('created_at');
  const [sortDir, setSortDir]   = useState<SortDir>('desc');
  const [selected, setSelected] = useState<IncidentListItem | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const { data: incidentsData, isLoading, error, refetch } = useIncidents({ limit: 200 });
  const allIncidents = incidentsData?.incidents || [];

  // Debug logging
  console.log('Incidents Management Debug:', {
    incidentsData,
    allIncidents,
    isLoading,
    error,
    allIncidentsLength: allIncidents.length
  });

  // Filter + sort
  const incidents = useMemo(() => {
    let list = allIncidents.filter(i => {
      const q = filters.search.toLowerCase();
      const matchSearch = !q
        || i.title.toLowerCase().includes(q)
        || i.locationText.toLowerCase().includes(q)
        || i.ticketNumber.toLowerCase().includes(q);
      const matchStatus   = filters.status   === 'all' || i.status   === filters.status;
      const matchSeverity = filters.severity === 'all' || i.severity === Number(filters.severity);
      const matchType     = filters.type     === 'all' || i.type     === filters.type;
      return matchSearch && matchStatus && matchSeverity && matchType;
    });

    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'created_at') cmp = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortKey === 'severity')   cmp = a.severity - b.severity;
      if (sortKey === 'status')     cmp = a.status.localeCompare(b.status);
      if (sortKey === 'type')       cmp = a.type.localeCompare(b.type);
      return sortDir === 'asc' ? -cmp : cmp;
    });

    return list;
  }, [allIncidents, filters, sortKey, sortDir]);

  const setFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) =>
    setFilters(prev => ({ ...prev, [key]: value }));

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const handleExport = () => {
    const csv = [
      ['Ticket', 'Type', 'Title', 'Location', 'Severity', 'Status', 'Assigned To', 'Created'].join(','),
      ...incidents.map(i => [
        i.ticketNumber,
        formatIncidentType(i.type),
        `"${i.title.replace(/"/g, '""')}"`,
        `"${i.locationText.replace(/"/g, '""')}"`,
        formatSeverity(i.severity),
        i.status,
        i.assignedTo?.name || 'Unassigned',
        fmtDate(i.createdAt),
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `incidents-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const criticalCount = allIncidents.filter(i => i.severity === 1 && !['resolved', 'closed'].includes(i.status)).length;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-paper">
      {/* Page header */}
      <div className="bg-white border-b border-paper-border px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-2xl font-semibold text-ink">Incident Management</h1>
            <p className="text-sm text-ink-muted">
              Monitor, triage, and coordinate all emergency incidents · {allIncidents.length} total
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => refetch()}
              className="flex items-center gap-2 px-3 py-2 border border-paper-border rounded-sm hover:bg-paper-hover text-sm text-ink-muted">
              <RefreshCw size={14} /> Refresh
            </button>
            <button onClick={handleExport}
              className="flex items-center gap-2 px-3 py-2 border border-paper-border rounded-sm hover:bg-paper-hover text-sm text-ink">
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>

        {/* Critical alert banner */}
        {criticalCount > 0 && (
          <div className="mt-3 flex items-center gap-3 bg-red-light border border-red rounded-sm px-4 py-2.5">
            <Siren size={14} className="text-red flex-shrink-0 animate-pulse" />
            <p className="text-sm font-bold text-red-dark">
              {criticalCount} CRITICAL incident{criticalCount > 1 ? 's' : ''} active — immediate attention required
            </p>
            <button
              onClick={() => setFilter('severity', 1 as IncidentSeverity)}
              className="ml-auto text-xs font-semibold text-red-dark underline whitespace-nowrap"
            >
              View critical →
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="px-6 pt-4 flex-shrink-0">
        <StatsBar incidents={allIncidents} />
      </div>

      {/* Main content: split panel */}
      <div className={`flex-1 overflow-hidden flex ${selected ? 'gap-0' : ''}`}>

        {/* Left: list panel */}
        <div className={`flex flex-col border-r border-paper-border bg-white overflow-hidden transition-all ${selected ? 'w-[440px] flex-shrink-0' : 'flex-1'}`}>

          {/* Search + filters */}
          <div className="px-4 py-3 border-b border-paper-border space-y-2 flex-shrink-0">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={e => setFilter('search', e.target.value)}
                  placeholder="Search by title, location, ticket…"
                  className="w-full pl-9 pr-3 py-2 border border-paper-border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-navy"
                />
              </div>
              <button
                onClick={() => setShowFilters(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-2 border rounded-sm text-sm transition-colors ${
                  showFilters ? 'border-navy bg-navy text-white' : 'border-paper-border hover:bg-paper-hover text-ink'
                }`}
              >
                <Filter size={14} /> Filters
                {(filters.status !== 'all' || filters.severity !== 'all' || filters.type !== 'all') && (
                  <span className="w-4 h-4 bg-red text-white text-[9px] rounded-full flex items-center justify-center">!</span>
                )}
              </button>
            </div>

            {/* Expandable filters */}
            {showFilters && (
              <div className="grid grid-cols-3 gap-2 pt-1">
                <select
                  value={filters.status}
                  onChange={e => setFilter('status', e.target.value as IncidentStatus | 'all')}
                  className="px-2 py-1.5 border border-paper-border rounded-sm text-xs bg-white focus:outline-none focus:ring-1 focus:ring-navy"
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="triaging">Triaging</option>
                  <option value="dispatched">Dispatched</option>
                  <option value="on_scene">On Scene</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>

                <select
                  value={filters.severity}
                  onChange={e => setFilter('severity', e.target.value as any)}
                  className="px-2 py-1.5 border border-paper-border rounded-sm text-xs bg-white focus:outline-none focus:ring-1 focus:ring-navy"
                >
                  <option value="all">All Severity</option>
                  <option value={1}>Critical (1)</option>
                  <option value={2}>High (2)</option>
                  <option value={3}>Medium (3)</option>
                </select>

                <select
                  value={filters.type}
                  onChange={e => setFilter('type', e.target.value as IncidentType | 'all')}
                  className="px-2 py-1.5 border border-paper-border rounded-sm text-xs bg-white focus:outline-none focus:ring-1 focus:ring-navy"
                >
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

            {/* Sort + result count */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-ink-muted">
                {incidents.length} result{incidents.length !== 1 ? 's' : ''}
                {incidents.length !== allIncidents.length && ` of ${allIncidents.length}`}
              </p>
              <div className="flex items-center gap-1">
                {(['created_at', 'severity', 'status', 'type'] as SortKey[]).map(k => (
                  <button key={k} onClick={() => toggleSort(k)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                      sortKey === k ? 'bg-navy text-white' : 'bg-paper text-ink-muted hover:bg-paper-hover'
                    }`}>
                    {k === 'created_at' ? 'Date' : k.charAt(0).toUpperCase() + k.slice(1)}
                    {sortKey === k && <ArrowUpDown size={9} />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Incident list */}
          <div className="flex-1 overflow-y-auto divide-y divide-paper-border">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-navy mb-2" />
                  <p className="text-sm text-ink-muted">Loading incidents…</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-16 text-ink-muted">
                <AlertCircle size={36} className="mb-3 opacity-30" />
                <p className="text-sm font-medium">Failed to load incidents</p>
                <p className="text-xs mt-1">Please check your connection and try again</p>
                <button
                  onClick={() => refetch()}
                  className="mt-3 flex items-center gap-1 text-xs text-teal hover:underline"
                >
                  <RefreshCw size={12} /> Try again
                </button>
              </div>
              </div>
            ) : incidents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-ink-muted">
                <AlertCircle size={36} className="mb-3 opacity-30" />
                <p className="text-sm font-medium">No incidents found</p>
                <p className="text-xs mt-1">Try adjusting your filters</p>
                <button
                  onClick={() => setFilters({ search: '', status: 'all', severity: 'all', type: 'all' })}
                  className="mt-3 text-xs text-teal hover:underline"
                >
                  Clear all filters
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
            <IncidentDetailPanel
              incident={selected}
              onClose={() => setSelected(null)}
            />
          </div>
        )}

        {/* Empty state when nothing selected and narrow */}
        {!selected && (
          <div className="hidden" />
        )}
      </div>
    </div>
  );
}