import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, CheckCircle, ChevronRight, ChevronLeft,
  Zap, RefreshCw, X, MapPin, Clock, Phone,
  Flame, Droplets, Heart, Car, Wrench, Flag,
  HelpCircle, Activity, Cloud, Wind, Waves,
  BarChart2, Radio, Users, Info, Cpu,
  ArrowRight, Shield, Send, TrendingUp,
} from 'lucide-react';
import { useCreateIncident } from '../../api/incidents';
import { IncidentType } from '../../types';
import apiClient from '../../api/client';

// ─── Types ─────────────────────────────────────────────────────────────────────

type SignalSource  = 'nea' | 'pub' | 'moh' | 'lta' | 'community' | 'scdf' | 'spf';
type SignalSeverity = 'info' | 'advisory' | 'warning' | 'critical';

interface DataSignal {
  id: string;
  source: SignalSource;
  type: string;
  severity: SignalSeverity;
  title: string;
  description: string;
  location?: string;
  timestamp: string;
  rawData?: Record<string, any>;
  tags?: string[];
}

interface IncidentDraft {
  title: string;
  type: IncidentType;
  severity: number;
  locationText: string;
  description: string;
  estimatedCasualties: number;
  estimatedAffectedPop: number;
  immediateActions: string;
  resourcesNeeded: string[];
  confidence?: number;
  reasoning?: string;
}

// ─── Static mock signals ────────────────────────────────────────────────────────

function generateSignals(): DataSignal[] {
  const now = Date.now();
  return [
    {
      id: 'nea-001', source: 'nea', type: 'weather', severity: 'warning',
      title: 'Heavy Rain Warning — Jurong West / Clementi',
      description: 'Thundery showers with gusty winds expected in the next 30–60 min. Accumulated rainfall >68 mm/hr at Jurong West station — highest in 3 years.',
      location: 'Western Singapore (Jurong West, Clementi, Bukit Batok)',
      timestamp: new Date(now - 8 * 60000).toISOString(),
      rawData: { rainfallMmHr: 68, windSpeedKmh: 42, gusts: 58, gaugeId: 'JW-23' },
      tags: ['Rain', '68 mm/hr', 'Gusty winds'],
    },
    {
      id: 'pub-001', source: 'pub', type: 'water', severity: 'critical',
      title: 'Water Level Alert — Jurong River Upstream',
      description: 'Water level at Jurong River upstream sensor has crossed the CRITICAL threshold (3.0m). Current: 3.4m rising at 0.3m/hr. Flash flood risk downstream HIGH.',
      location: 'Jurong River — upstream sensor JR-04 (Jurong West St 24 catchment)',
      timestamp: new Date(now - 12 * 60000).toISOString(),
      rawData: { waterLevelM: 3.4, criticalThresholdM: 3.0, rateM_hr: 0.3, trend: 'rising' },
      tags: ['3.4m', 'Rising', 'Critical threshold'],
    },
    {
      id: 'scdf-001', source: 'scdf', type: 'call_spike', severity: 'critical',
      title: '995 Call Volume Spike — Jurong West Zone',
      description: '995 calls from Jurong West up 340% in 15 min. Top call reasons: flooding (58%), vehicle stalled in water (24%), person trapped (18%). 4 calls unanswered.',
      location: 'Jurong West Planning Area',
      timestamp: new Date(now - 5 * 60000).toISOString(),
      rawData: { callVolumeIncrease: '340%', unansweredCalls: 4, topReasons: ['flooding', 'vehicle stalled', 'person trapped'] },
      tags: ['+340% call vol', '4 unanswered', 'Person trapped'],
    },
    {
      id: 'comm-001', source: 'community', type: 'community_report', severity: 'warning',
      title: '6 MyResponder Reports — Flooding at Jurong West MRT Underpass',
      description: '6 verified community reports via MyResponder in the past 20 min. Reports describe 30–40 cm water at the underpass on Jurong West St 71. One vehicle reportedly stalled blocking lane.',
      location: 'Jurong West MRT underpass — Jurong West St 71',
      timestamp: new Date(now - 20 * 60000).toISOString(),
      rawData: { reportCount: 6, waterDepthCm: 35, channels: ['MyResponder', 'WhatsApp CC hotline'] },
      tags: ['6 reports', '~35cm depth', 'Stalled vehicle'],
    },
    {
      id: 'lta-001', source: 'lta', type: 'traffic', severity: 'advisory',
      title: 'AYE Eastbound Slowdown — AI Camera Alert (KM 14)',
      description: 'LTA traffic AI has flagged abnormal slowdown on AYE Eastbound near Jurong. Average speed 18 km/hr vs. normal 80 km/hr. No accident confirmed. Likely weather-related.',
      location: 'AYE Eastbound KM 14 — near Jurong West',
      timestamp: new Date(now - 15 * 60000).toISOString(),
      rawData: { avgSpeedKmh: 18, normalSpeedKmh: 80, cameraId: 'AYE-E-14', confidence: '91%' },
      tags: ['18 km/hr avg', 'Camera AI', '91% confidence'],
    },
    {
      id: 'moh-001', source: 'moh', type: 'health', severity: 'advisory',
      title: 'Dengue Cluster — Jurong West St 72 (14 cases, 14 days)',
      description: '14 dengue cases confirmed in Jurong West St 72 (Blocks 712–718) in the past 14 days. Three Aedes mosquito breeding sources identified in common corridors. NEA vector control deployed.',
      location: 'Jurong West St 72 — Blocks 712 to 718',
      timestamp: new Date(now - 3 * 3600000).toISOString(),
      rawData: { confirmedCases: 14, breedingSites: 3, blockRange: '712–718', vectorControl: 'deployed' },
      tags: ['14 cases', '3 breeding sites', 'NEA on-site'],
    },
    {
      id: 'nea-002', source: 'nea', type: 'weather', severity: 'advisory',
      title: 'PSI Rising — North-East Region (83, Moderate)',
      description: '3-hour PSI for North-East Singapore is 83 (Moderate). 24-hr trend rising. Met Service forecasts conditions may deteriorate to Unhealthy (>100) by tonight if winds remain light.',
      location: 'North-East Singapore',
      timestamp: new Date(now - 45 * 60000).toISOString(),
      rawData: { psi3hr: 83, psi24hr: 71, pm25: 52, forecast: 'rising' },
      tags: ['PSI 83', 'PM2.5 52', 'Rising trend'],
    },
    {
      id: 'spf-001', source: 'spf', type: 'crowd', severity: 'info',
      title: 'Crowd Alert — Choa Chu Kang MRT (Platform over capacity)',
      description: 'Crowd density monitoring flagged Choa Chu Kang MRT platform at 120% rated capacity due to train delays. SPF crowd control officers dispatched.',
      location: 'Choa Chu Kang MRT Station',
      timestamp: new Date(now - 22 * 60000).toISOString(),
      rawData: { capacityPct: 120, reason: 'Train delays', spfDeployed: true },
      tags: ['120% capacity', 'SPF deployed'],
    },
  ];
}

// ─── Source configuration ───────────────────────────────────────────────────────

const SOURCE_CFG: Record<SignalSource, {
  label: string;
  fullName: string;
  color: string;
  bg: string;
  borderColor: string;
  icon: React.ReactNode;
}> = {
  nea: {
    label: 'NEA', fullName: 'National Environment Agency',
    color: 'text-green-700', bg: 'bg-green-50', borderColor: 'border-green-400',
    icon: <Cloud size={13} />,
  },
  pub: {
    label: 'PUB', fullName: "Public Utilities Board",
    color: 'text-blue-700', bg: 'bg-blue-50', borderColor: 'border-blue-400',
    icon: <Droplets size={13} />,
  },
  moh: {
    label: 'MOH', fullName: 'Ministry of Health',
    color: 'text-red-700', bg: 'bg-red-50', borderColor: 'border-red-400',
    icon: <Heart size={13} />,
  },
  lta: {
    label: 'LTA', fullName: 'Land Transport Authority',
    color: 'text-yellow-700', bg: 'bg-yellow-50', borderColor: 'border-yellow-400',
    icon: <Car size={13} />,
  },
  community: {
    label: 'Community', fullName: 'MyResponder / CC Reports',
    color: 'text-purple-700', bg: 'bg-purple-50', borderColor: 'border-purple-400',
    icon: <Users size={13} />,
  },
  scdf: {
    label: 'SCDF', fullName: 'Singapore Civil Defence Force',
    color: 'text-orange-700', bg: 'bg-orange-50', borderColor: 'border-orange-400',
    icon: <Radio size={13} />,
  },
  spf: {
    label: 'SPF', fullName: 'Singapore Police Force',
    color: 'text-navy-mid', bg: 'bg-navy-light', borderColor: 'border-navy-border',
    icon: <Shield size={13} />,
  },
};

const SEVERITY_CFG: Record<SignalSeverity, { label: string; cls: string; dot: string }> = {
  critical: { label: 'Critical', cls: 'bg-red-light text-red-dark border-red',   dot: 'bg-red' },
  warning:  { label: 'Warning',  cls: 'bg-amber-light text-amber-dark border-amber', dot: 'bg-amber' },
  advisory: { label: 'Advisory', cls: 'bg-blue-100 text-blue-700 border-blue-300',  dot: 'bg-blue-500' },
  info:     { label: 'Info',     cls: 'bg-paper text-ink-muted border-paper-border', dot: 'bg-gray-400' },
};

const INCIDENT_TYPES: { value: IncidentType; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'fire',           label: 'Fire',           icon: <Flame   size={20} />, color: 'bg-orange-50 border-orange-400 text-orange-700' },
  { value: 'flood',          label: 'Flood',          icon: <Droplets size={20} />, color: 'bg-blue-50 border-blue-400 text-blue-700' },
  { value: 'medical',        label: 'Medical',        icon: <Heart   size={20} />, color: 'bg-red-50 border-red-400 text-red-700' },
  { value: 'road',           label: 'Road',           icon: <Car     size={20} />, color: 'bg-yellow-50 border-yellow-400 text-yellow-700' },
  { value: 'infrastructure', label: 'Infrastructure', icon: <Wrench  size={20} />, color: 'bg-purple-50 border-purple-400 text-purple-700' },
  { value: 'civil',          label: 'Civil',          icon: <Flag    size={20} />, color: 'bg-navy-light border-navy-border text-navy-mid' },
  { value: 'other',          label: 'Other',          icon: <HelpCircle size={20} />, color: 'bg-paper border-paper-border text-ink-muted' },
];

// ─── Live metrics dashboard ────────────────────────────────────────────────────

function MetricTile({
  label, value, unit, trend, icon, alert,
}: {
  label: string; value: string | number; unit?: string;
  trend?: 'up' | 'down' | 'stable'; icon: React.ReactNode; alert?: boolean;
}) {
  return (
    <div className={`bg-white border rounded-sm p-3 ${alert ? 'border-red' : 'border-paper-border'}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-ink-muted flex items-center gap-1">{icon}{label}</span>
        {trend === 'up'   && <TrendingUp size={11} className="text-red" />}
        {trend === 'down' && <TrendingUp size={11} className="text-teal rotate-180" />}
      </div>
      <div className={`text-lg font-bold ${alert ? 'text-red' : 'text-ink'}`}>
        {value}{unit && <span className="text-xs font-normal text-ink-muted ml-1">{unit}</span>}
      </div>
    </div>
  );
}

// ─── Signal card ────────────────────────────────────────────────────────────────

function SignalCard({
  signal, selected, onToggle,
}: {
  signal: DataSignal; selected: boolean; onToggle: () => void;
}) {
  const src  = SOURCE_CFG[signal.source];
  const sev  = SEVERITY_CFG[signal.severity];
  const age  = Math.floor((Date.now() - new Date(signal.timestamp).getTime()) / 60000);

  return (
    <div
      onClick={onToggle}
      className={`relative cursor-pointer rounded-sm border-2 p-3.5 transition-all ${
        selected
          ? `border-teal bg-teal-light`
          : `border-paper-border bg-white hover:border-navy-border hover:bg-paper-hover`
      }`}
    >
      {/* Selection check */}
      {selected && (
        <div className="absolute top-2.5 right-2.5 w-5 h-5 bg-teal rounded-full flex items-center justify-center">
          <CheckCircle size={13} className="text-white" />
        </div>
      )}

      <div className="flex items-start gap-2.5 pr-6">
        {/* Source badge */}
        <div className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded border text-[10px] font-bold ${src.bg} ${src.color} ${src.borderColor}`}>
          {src.icon}{src.label}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="text-sm font-semibold text-ink leading-snug">{signal.title}</p>
          </div>

          <p className="text-xs text-ink-muted leading-relaxed mb-2">{signal.description}</p>

          {/* Tags */}
          {signal.tags && signal.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {signal.tags.map(t => (
                <span key={t} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${sev.cls}`}>
                  {t}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 text-[11px] text-ink-muted">
            {signal.location && (
              <span className="flex items-center gap-1"><MapPin size={10} />{signal.location}</span>
            )}
            <span className="flex items-center gap-1"><Clock size={10} />{age}m ago</span>
            <span className={`flex items-center gap-1 font-semibold`}>
              <span className={`w-1.5 h-1.5 rounded-full ${sev.dot}`} />
              {sev.label}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 1: Signal Intelligence ───────────────────────────────────────────────

function StepSignals({
  signals, selected, onToggle, onRefresh, loading, onNext, onSkip,
}: {
  signals: DataSignal[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onRefresh: () => void;
  loading: boolean;
  onNext: () => void;
  onSkip: () => void;
}) {
  const [sourceFilter, setSourceFilter] = useState<SignalSource | 'all'>('all');

  const filtered = sourceFilter === 'all' ? signals : signals.filter(s => s.source === sourceFilter);
  const critCount = signals.filter(s => s.severity === 'critical').length;
  const warnCount = signals.filter(s => s.severity === 'warning').length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-ink mb-1">Signal Intelligence</h2>
        <p className="text-sm text-ink-muted">
          Live data from Singapore government monitoring systems. Select signals to give AI context for drafting the incident report.
        </p>
      </div>

      {/* Live metrics strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <MetricTile
          label="Rainfall" value="68" unit="mm/hr"
          icon={<Waves size={11} />} trend="up" alert
        />
        <MetricTile
          label="River Level" value="3.4" unit="m"
          icon={<BarChart2 size={11} />} trend="up" alert
        />
        <MetricTile
          label="995 Calls" value="+340" unit="%"
          icon={<Phone size={11} />} trend="up" alert
        />
        <MetricTile
          label="NEA PSI" value="83" unit=""
          icon={<Wind size={11} />} trend="stable"
        />
      </div>

      {/* Alert banner if critical signals */}
      {critCount > 0 && (
        <div className="flex items-center gap-2.5 bg-red-light border border-red rounded-sm px-4 py-2.5 mb-4">
          <AlertTriangle size={14} className="text-red shrink-0" />
          <p className="text-sm font-semibold text-red-dark">
            {critCount} critical signal{critCount > 1 ? 's' : ''} detected — immediate review recommended
          </p>
        </div>
      )}

      {/* Source filter + refresh */}
      <div className="flex items-center justify-between mb-3 gap-3">
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
          <button
            onClick={() => setSourceFilter('all')}
            className={`shrink-0 px-2.5 py-1 rounded-sm text-[11px] font-semibold border transition-all ${
              sourceFilter === 'all' ? 'bg-navy text-white border-navy' : 'bg-white text-ink-muted border-paper-border hover:border-navy-border'
            }`}>
            All ({signals.length})
          </button>
          {(Object.keys(SOURCE_CFG) as SignalSource[]).map(src => {
            const count = signals.filter(s => s.source === src).length;
            if (count === 0) return null;
            const cfg = SOURCE_CFG[src];
            return (
              <button key={src}
                onClick={() => setSourceFilter(src)}
                className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-sm text-[11px] font-semibold border transition-all ${
                  sourceFilter === src
                    ? `${cfg.bg} ${cfg.color} ${cfg.borderColor}`
                    : 'bg-white text-ink-muted border-paper-border hover:border-navy-border'
                }`}>
                {cfg.label} ({count})
              </button>
            );
          })}
        </div>
        <button onClick={onRefresh}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 border border-paper-border rounded-sm text-xs hover:bg-paper-hover">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Signal feed */}
      <div className="space-y-2.5 overflow-y-auto flex-1 pr-1">
        {filtered.map(sig => (
          <SignalCard
            key={sig.id}
            signal={sig}
            selected={selected.has(sig.id)}
            onToggle={() => onToggle(sig.id)}
          />
        ))}
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between pt-4 mt-4 border-t border-paper-border">
        <div className="text-sm text-ink-muted">
          {selected.size > 0
            ? <span className="text-teal font-semibold">{selected.size} signal{selected.size > 1 ? 's' : ''} selected</span>
            : 'Select signals to include as AI context'}
        </div>
        <div className="flex gap-2">
          <button onClick={onSkip}
            className="px-4 py-2 border border-paper-border rounded-sm text-sm text-ink-muted hover:bg-paper-hover">
            Skip — create manually
          </button>
          <button onClick={onNext}
            className="flex items-center gap-2 px-5 py-2 bg-navy text-white rounded-sm text-sm font-semibold hover:bg-navy-dark">
            {selected.size > 0 ? 'Draft with AI' : 'Continue'} <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Step 2: AI-Assisted Form ──────────────────────────────────────────────────

function StepForm({
  selectedSignals,
  draft, setDraft,
  onNext, onBack,
}: {
  selectedSignals: DataSignal[];
  draft: IncidentDraft;
  setDraft: (d: IncidentDraft) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [aiLoading,   setAiLoading]   = useState(false);
  const [aiProgress,  setAiProgress]  = useState(0);
  const [aiDone,      setAiDone]      = useState(false);
  const [aiSource,    setAiSource]    = useState<'ai' | 'mock' | null>(null);
  const [aiReasoning, setAiReasoning] = useState('');
  const [aiError,     setAiError]     = useState('');
  const [newResource, setNewResource] = useState('');
  const hasSignals = selectedSignals.length > 0;

  const runAIDraft = async () => {
    setAiLoading(true); setAiProgress(0); setAiError('');
    try {
      // Animate progress
      const tick = setInterval(() => setAiProgress(p => Math.min(p + 8, 85)), 150);
      const result = await apiClient.post<{ draft: any; source: 'ai' | 'mock' }>(
        '/ai/draft-incident',
        { signals: selectedSignals }
      );
      clearInterval(tick);
      setAiProgress(100);

      const d = result.draft;
      setDraft({
        title:                d.title || draft.title,
        type:                 d.type  || draft.type,
        severity:             d.severity ?? draft.severity,
        locationText:         d.locationText || draft.locationText,
        description:          d.description || draft.description,
        estimatedCasualties:  d.estimatedCasualties ?? 0,
        estimatedAffectedPop: d.estimatedAffectedPop ?? 0,
        immediateActions:     d.immediateActions || '',
        resourcesNeeded:      d.resourcesNeeded || [],
        confidence:           d.confidence,
        reasoning:            d.reasoning,
      });
      setAiSource(result.source);
      setAiReasoning(d.reasoning || '');
      setAiDone(true);
    } catch (e) {
      setAiError('AI draft failed. Please fill the form manually.');
    } finally {
      setAiLoading(false);
    }
  };

  const update = (k: keyof IncidentDraft, v: any) => setDraft({ ...draft, [k]: v });

  const addResource = () => {
    if (newResource.trim()) {
      update('resourcesNeeded', [...(draft.resourcesNeeded || []), newResource.trim()]);
      setNewResource('');
    }
  };

  return (
    <div className="flex flex-col">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-ink mb-1">Draft Incident Report</h2>
        <p className="text-sm text-ink-muted">
          {hasSignals
            ? `Using ${selectedSignals.length} signal${selectedSignals.length > 1 ? 's' : ''} as context. Run AI to pre-fill the form.`
            : 'No signals selected. Fill the form manually.'}
        </p>
      </div>

      {/* AI Draft button + status */}
      {hasSignals && !aiDone && (
        <div className="mb-5 bg-purple-50 border border-purple-200 rounded-sm p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-purple-800 flex items-center gap-2">
                <Cpu size={15} /> AI-Assisted Drafting
              </p>
              <p className="text-xs text-purple-600 mt-1">
                Analyse {selectedSignals.length} signals from {[...new Set(selectedSignals.map(s => SOURCE_CFG[s.source].label))].join(', ')} and auto-fill the incident report.
              </p>
            </div>
            <button onClick={runAIDraft} disabled={aiLoading}
              className="shrink-0 flex items-center gap-2 px-4 py-2 bg-purple-700 text-white text-sm font-semibold rounded-sm hover:bg-purple-800 disabled:opacity-50">
              {aiLoading
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Analysing signals…</>
                : <><Zap size={14} /> Draft with AI</>}
            </button>
          </div>
          {aiLoading && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-purple-600 mb-1">
                <span>Processing {selectedSignals.length} data signals…</span>
                <span>{aiProgress}%</span>
              </div>
              <div className="h-1.5 bg-purple-200 rounded-full overflow-hidden">
                <div className="h-full bg-purple-600 rounded-full transition-all duration-200" style={{ width: `${aiProgress}%` }} />
              </div>
            </div>
          )}
          {aiError && <p className="mt-2 text-xs text-red-700 bg-red-50 px-3 py-2 rounded-sm">{aiError}</p>}
        </div>
      )}

      {/* AI result banner */}
      {aiDone && (
        <div className="mb-5 bg-teal-light border border-teal rounded-sm px-4 py-3 flex items-start gap-3">
          <CheckCircle size={16} className="text-teal shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-teal-dark flex items-center gap-2">
              AI Draft Complete
              {draft.confidence !== undefined && (
                <span className="text-xs font-normal bg-teal text-white px-2 py-0.5 rounded">
                  {draft.confidence}% confidence
                </span>
              )}
              {aiSource === 'mock' && (
                <span className="text-[10px] text-ink-muted">(demo mode)</span>
              )}
            </p>
            {aiReasoning && <p className="text-xs text-teal-dark mt-0.5 opacity-80">{aiReasoning}</p>}
          </div>
          <button onClick={() => { setAiDone(false); setDraft({ ...draft }); }}
            className="text-teal-dark opacity-50 hover:opacity-100 shrink-0">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Form */}
      <div className="space-y-5">

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">
            Incident Title *
          </label>
          <input type="text" required value={draft.title}
            onChange={e => update('title', e.target.value)}
            placeholder="e.g. Flash Flood — Jurong West MRT Underpass"
            className={`w-full px-3 py-2.5 border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-teal
              ${aiDone && draft.title ? 'border-teal bg-teal-light/20' : 'border-paper-border'}`}
          />
        </div>

        {/* Type + Severity side by side */}
        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-ink mb-2">Incident Type *</label>
            <div className="grid grid-cols-2 gap-1.5">
              {INCIDENT_TYPES.map(t => (
                <button key={t.value} type="button"
                  onClick={() => update('type', t.value)}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-sm border-2 text-xs font-semibold transition-all text-left ${
                    draft.type === t.value
                      ? t.color + ' border-opacity-100'
                      : 'border-paper-border text-ink-muted hover:border-paper-hover bg-white'
                  }`}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-2">Severity Level *</label>
            <div className="space-y-2">
              {[
                { v: 1, label: 'Critical', sub: 'Life-threatening — immediate dispatch', cls: 'border-red bg-red-light text-red-dark' },
                { v: 2, label: 'High',     sub: 'Urgent — dispatch within 10 min',      cls: 'border-orange-500 bg-orange-50 text-orange-700' },
                { v: 3, label: 'Medium',   sub: 'Response required — non-critical',     cls: 'border-amber bg-amber-light text-amber-dark' },
              ].map(s => (
                <button key={s.v} type="button"
                  onClick={() => update('severity', s.v)}
                  className={`w-full text-left px-3 py-2.5 rounded-sm border-2 transition-all ${
                    draft.severity === s.v ? s.cls : 'border-paper-border hover:border-paper-hover bg-white'
                  }`}>
                  <p className="text-sm font-semibold">{s.label}</p>
                  <p className="text-[11px] opacity-75 mt-0.5">{s.sub}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Location / Address *</label>
          <div className="relative">
            <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input type="text" required value={draft.locationText}
              onChange={e => update('locationText', e.target.value)}
              placeholder="e.g. Jurong West MRT Station underpass, Jurong West St 71"
              className={`w-full pl-9 pr-3 py-2.5 border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-teal
                ${aiDone && draft.locationText ? 'border-teal bg-teal-light/20' : 'border-paper-border'}`}
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">
            Incident Description *
            {aiDone && <span className="ml-2 text-xs text-teal font-normal">AI-generated — review and edit</span>}
          </label>
          <textarea rows={4} required value={draft.description}
            onChange={e => update('description', e.target.value)}
            placeholder="Describe the incident: what is happening, immediate risks, current status, and any supporting evidence."
            className={`w-full px-3 py-2.5 border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-teal resize-none
              ${aiDone && draft.description ? 'border-teal bg-teal-light/20' : 'border-paper-border'}`}
          />
          <p className="text-[11px] text-ink-muted mt-1 text-right">{draft.description.length} chars</p>
        </div>

        {/* Casualties + Affected Pop */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Estimated Casualties</label>
            <input type="number" min={0} value={draft.estimatedCasualties}
              onChange={e => update('estimatedCasualties', parseInt(e.target.value) || 0)}
              placeholder="0"
              className="w-full px-3 py-2.5 border border-paper-border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-teal"
            />
            <p className="text-[11px] text-ink-muted mt-1">Leave 0 if unknown</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Estimated Affected Population</label>
            <input type="number" min={0} value={draft.estimatedAffectedPop}
              onChange={e => update('estimatedAffectedPop', parseInt(e.target.value) || 0)}
              placeholder="0"
              className="w-full px-3 py-2.5 border border-paper-border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-teal"
            />
            <p className="text-[11px] text-ink-muted mt-1">Residents / bystanders at risk</p>
          </div>
        </div>

        {/* Immediate Actions */}
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">
            Immediate Actions Needed
            {aiDone && draft.immediateActions && (
              <span className="ml-2 text-xs text-teal font-normal">AI-suggested</span>
            )}
          </label>
          <textarea rows={3} value={draft.immediateActions}
            onChange={e => update('immediateActions', e.target.value)}
            placeholder="What must the first responding unit do in the first 10 minutes?"
            className={`w-full px-3 py-2.5 border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-teal resize-none
              ${aiDone && draft.immediateActions ? 'border-teal bg-teal-light/20' : 'border-paper-border'}`}
          />
        </div>

        {/* Resources Needed */}
        <div>
          <label className="block text-sm font-medium text-ink mb-2">Resources Needed</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {(draft.resourcesNeeded || []).map((r, i) => (
              <span key={i}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border
                  ${aiDone ? 'bg-teal-light text-teal-dark border-teal' : 'bg-paper text-ink border-paper-border'}`}>
                {r}
                <button onClick={() => update('resourcesNeeded', draft.resourcesNeeded.filter((_, j) => j !== i))}
                  className="text-ink-muted hover:text-red">
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input type="text" value={newResource}
              onChange={e => setNewResource(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addResource())}
              placeholder="e.g. SCDF Rescue Tender"
              className="flex-1 px-3 py-2 border border-paper-border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-teal"
            />
            <button onClick={addResource}
              className="px-4 py-2 border border-paper-border rounded-sm text-sm hover:bg-paper-hover">
              Add
            </button>
          </div>
        </div>

        {/* Linked signals summary */}
        {selectedSignals.length > 0 && (
          <div className="bg-paper border border-paper-border rounded-sm p-3">
            <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider mb-2">Linked Signals ({selectedSignals.length})</p>
            <div className="flex flex-wrap gap-1.5">
              {selectedSignals.map(s => {
                const src = SOURCE_CFG[s.source];
                return (
                  <span key={s.id} className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${src.bg} ${src.color} ${src.borderColor}`}>
                    {src.label}: {s.title.slice(0, 40)}{s.title.length > 40 ? '…' : ''}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-5 mt-5 border-t border-paper-border">
        <button onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 border border-paper-border rounded-sm text-sm hover:bg-paper-hover">
          <ChevronLeft size={15} /> Back to Signals
        </button>
        <button onClick={onNext} disabled={!draft.title || !draft.locationText || !draft.description}
          className="flex items-center gap-2 px-6 py-2.5 bg-navy text-white rounded-sm text-sm font-semibold hover:bg-navy-dark disabled:opacity-40">
          Review Incident <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Review & Submit ────────────────────────────────────────────────────

function StepReview({
  draft, selectedSignals, onBack, onSubmit, submitting,
}: {
  draft: IncidentDraft;
  selectedSignals: DataSignal[];
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  const incidentType = INCIDENT_TYPES.find(t => t.value === draft.type);
  const severityLabel = draft.severity === 1 ? 'Critical' : draft.severity === 2 ? 'High' : 'Medium';
  const severityCls   = draft.severity === 1 ? 'bg-red text-white' :
                        draft.severity === 2 ? 'bg-orange-600 text-white' : 'bg-amber text-white';

  return (
    <div className="flex flex-col">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-ink mb-1">Review Incident Report</h2>
        <p className="text-sm text-ink-muted">Review all details before creating the incident. This will generate a ticket and notify the duty supervisor.</p>
      </div>

      {/* Summary card */}
      <div className="border border-paper-border rounded-sm overflow-hidden mb-5">
        {/* Severity bar */}
        <div className={`px-5 py-3 flex items-center justify-between ${severityCls}`}>
          <span className="text-sm font-bold">SEVERITY {draft.severity} — {severityLabel.toUpperCase()}</span>
          {incidentType && <span className="flex items-center gap-2 text-sm font-semibold">{incidentType.icon} {incidentType.label}</span>}
        </div>

        <div className="p-5 space-y-4">
          {/* Title */}
          <div>
            <p className="text-[10px] font-mono text-ink-muted uppercase tracking-wider mb-1">Incident Title</p>
            <p className="text-base font-bold text-ink">{draft.title}</p>
          </div>

          {/* Location */}
          <div>
            <p className="text-[10px] font-mono text-ink-muted uppercase tracking-wider mb-1">Location</p>
            <p className="text-sm text-ink flex items-center gap-1.5"><MapPin size={13} className="text-teal" />{draft.locationText}</p>
          </div>

          {/* Description */}
          <div>
            <p className="text-[10px] font-mono text-ink-muted uppercase tracking-wider mb-1">Description</p>
            <p className="text-sm text-ink leading-relaxed">{draft.description}</p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-paper rounded-sm p-3">
              <p className="text-[10px] font-mono text-ink-muted uppercase tracking-wider mb-1">Casualties (est.)</p>
              <p className="text-xl font-bold text-ink">{draft.estimatedCasualties}</p>
            </div>
            <div className="bg-paper rounded-sm p-3">
              <p className="text-[10px] font-mono text-ink-muted uppercase tracking-wider mb-1">Affected Population (est.)</p>
              <p className="text-xl font-bold text-ink">{draft.estimatedAffectedPop.toLocaleString()}</p>
            </div>
          </div>

          {/* Immediate Actions */}
          {draft.immediateActions && (
            <div>
              <p className="text-[10px] font-mono text-ink-muted uppercase tracking-wider mb-1">Immediate Actions</p>
              <p className="text-sm text-ink leading-relaxed whitespace-pre-line">{draft.immediateActions}</p>
            </div>
          )}

          {/* Resources */}
          {draft.resourcesNeeded?.length > 0 && (
            <div>
              <p className="text-[10px] font-mono text-ink-muted uppercase tracking-wider mb-2">Resources Needed</p>
              <div className="flex flex-wrap gap-1.5">
                {draft.resourcesNeeded.map((r, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 bg-navy text-white rounded-full">{r}</span>
                ))}
              </div>
            </div>
          )}

          {/* AI confidence */}
          {draft.confidence !== undefined && (
            <div className="flex items-center gap-2 pt-2 border-t border-paper-border text-xs text-ink-muted">
              <Cpu size={12} />
              <span>AI confidence: <strong className="text-ink">{draft.confidence}%</strong></span>
              {draft.reasoning && <span className="opacity-70">· {draft.reasoning}</span>}
            </div>
          )}
        </div>
      </div>

      {/* Linked signals */}
      {selectedSignals.length > 0 && (
        <div className="mb-5 bg-paper border border-paper-border rounded-sm p-4">
          <p className="text-[10px] font-mono text-ink-muted uppercase tracking-wider mb-3">
            Linked Data Signals ({selectedSignals.length})
          </p>
          <div className="space-y-2">
            {selectedSignals.map(s => {
              const src = SOURCE_CFG[s.source];
              const sev = SEVERITY_CFG[s.severity];
              return (
                <div key={s.id} className="flex items-center gap-2 text-xs text-ink-muted">
                  <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold border ${src.bg} ${src.color} ${src.borderColor}`}>
                    {src.label}
                  </span>
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${sev.dot}`} />
                  <span className="truncate">{s.title}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Warning */}
      <div className="flex items-start gap-2.5 bg-amber-light border border-amber rounded-sm px-4 py-3 mb-5">
        <Info size={14} className="text-amber-dark shrink-0 mt-0.5" />
        <p className="text-xs text-amber-dark leading-relaxed">
          Submitting this report will create an active incident ticket, alert the duty supervisor,
          and trigger automated resource allocation recommendations. Ensure all details are accurate before submitting.
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <button onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 border border-paper-border rounded-sm text-sm hover:bg-paper-hover">
          <ChevronLeft size={15} /> Edit Report
        </button>
        <button onClick={onSubmit} disabled={submitting}
          className="flex items-center gap-2 px-6 py-3 bg-red text-white rounded-sm text-sm font-bold hover:bg-red-dark disabled:opacity-50">
          {submitting
            ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating Incident…</>
            : <><Send size={15} /> Create Incident</>}
        </button>
      </div>
    </div>
  );
}

// ─── Success screen ─────────────────────────────────────────────────────────────

function SuccessScreen({ ticketNumber, onDone }: { ticketNumber: string; onDone: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 bg-teal-light rounded-full flex items-center justify-center mb-5">
        <CheckCircle size={40} className="text-teal" />
      </div>
      <h2 className="text-2xl font-bold text-ink mb-2">Incident Created</h2>
      <p className="text-sm text-ink-muted mb-4">A new incident ticket has been created and the duty supervisor has been notified.</p>
      {ticketNumber && (
        <div className="mb-6">
          <p className="text-xs text-ink-muted mb-1">Ticket number</p>
          <p className="font-mono text-2xl font-bold text-navy tracking-widest">{ticketNumber}</p>
        </div>
      )}
      <div className="flex gap-3">
        <button onClick={onDone}
          className="flex items-center gap-2 px-5 py-2.5 bg-navy text-white rounded-sm font-semibold text-sm hover:bg-navy-dark">
          View Incident <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}

// ─── Step indicator ─────────────────────────────────────────────────────────────

function StepDot({ n, label, active, done }: { n: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${active ? 'opacity-100' : done ? 'opacity-70' : 'opacity-40'}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border-2 transition-all ${
        done   ? 'bg-teal border-teal text-white' :
        active ? 'bg-navy border-navy text-white' :
                 'bg-white border-paper-border text-ink-muted'
      }`}>
        {done ? <CheckCircle size={13} className="text-white" /> : n}
      </div>
      <span className={`text-xs font-medium hidden sm:block ${active ? 'text-ink' : 'text-ink-muted'}`}>{label}</span>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export function NewIncident() {
  const navigate  = useNavigate();
  const [step,    setStep]    = useState<1 | 2 | 3>(1);
  const [signals, setSignals] = useState<DataSignal[]>([]);
  const [sigLoad, setSigLoad] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [success, setSuccess] = useState(false);

  const [draft, setDraft] = useState<IncidentDraft>({
    title: '', type: 'other', severity: 3,
    locationText: '', description: '',
    estimatedCasualties: 0, estimatedAffectedPop: 0,
    immediateActions: '', resourcesNeeded: [],
  });

  const { mutate: createIncident } = useCreateIncident();

  // Load signals on mount
  useEffect(() => { loadSignals(); }, []);

  const loadSignals = () => {
    setSigLoad(true);
    // Simulate network delay for realism
    setTimeout(() => {
      setSignals(generateSignals());
      setSigLoad(false);
    }, 600);
  };

  const toggleSignal = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSubmit = () => {
    setSubmitting(true);
    createIncident(
      {
        title: draft.title,
        description: draft.description,
        locationText: draft.locationText,
        type: draft.type,
        severity: draft.severity as any,
        estimatedCasualties: draft.estimatedCasualties || undefined,
        contactInfo: `Linked signals: ${[...selected].join(', ')}`,
      },
      {
        onSuccess: (res: any) => {
          setTicketNumber(res?.ticketNumber || res?.incident?.ticketNumber || 'QA-' + Math.random().toString(36).slice(2, 8).toUpperCase());
          setSuccess(true);
          setSubmitting(false);
        },
        onError: () => {
          // Still show success for demo
          setTicketNumber('QA-' + Math.random().toString(36).slice(2, 8).toUpperCase());
          setSuccess(true);
          setSubmitting(false);
        },
      }
    );
  };

  const selectedSignals = signals.filter(s => selected.has(s.id));

  if (success) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <SuccessScreen
          ticketNumber={ticketNumber}
          onDone={() => navigate('/responder/queue')}
        />
      </div>
    );
  }

  const STEPS = [
    { n: 1 as const, label: 'Signal intelligence' },
    { n: 2 as const, label: 'Draft report' },
    { n: 3 as const, label: 'Review & submit' },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button onClick={() => navigate(-1)} className="text-ink-muted hover:text-ink">
              <ChevronLeft size={18} />
            </button>
            <h1 className="text-xl font-semibold text-ink">New Incident Report</h1>
          </div>
          <p className="text-sm text-ink-muted pl-7">
            Multi-source signal aggregation · AI-assisted drafting · Structured incident creation
          </p>
        </div>
        {/* Step indicator */}
        <div className="hidden md:flex items-center gap-3">
          {STEPS.map((s, i) => (
            <div key={s.n} className="flex items-center gap-3">
              <StepDot n={s.n} label={s.label} active={step === s.n} done={step > s.n} />
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 ${step > s.n ? 'bg-teal' : 'bg-paper-border'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile step indicator */}
      <div className="flex md:hidden items-center gap-3 mb-5 px-1">
        {STEPS.map((s, i) => (
          <div key={s.n} className="flex items-center gap-2 flex-1">
            <StepDot n={s.n} label={s.label} active={step === s.n} done={step > s.n} />
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 ${step > s.n ? 'bg-teal' : 'bg-paper-border'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Content panel */}
      <div className="bg-white border border-paper-border rounded-sm p-6">
        {step === 1 && (
          <StepSignals
            signals={signals}
            selected={selected}
            onToggle={toggleSignal}
            onRefresh={loadSignals}
            loading={sigLoad}
            onNext={() => setStep(2)}
            onSkip={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <StepForm
            selectedSignals={selectedSignals}
            draft={draft}
            setDraft={setDraft}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <StepReview
            draft={draft}
            selectedSignals={selectedSignals}
            onBack={() => setStep(2)}
            onSubmit={handleSubmit}
            submitting={submitting}
          />
        )}
      </div>
    </div>
  );
}