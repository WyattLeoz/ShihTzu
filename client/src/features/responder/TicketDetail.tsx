import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useIncident, useApproveIncident, useUpdateIncidentStatus,
  useAddIncidentUpdate, useClaimIncident,
} from '../../api/incidents';
import { useHospitals, useVolunteerTasks } from '../../api/resources';
import { useClaudeStream } from '../../hooks/useClaudeStream';
import { authStore } from '../../stores/authStore';
import { formatDateTime, formatTimeAgo } from '../../lib/utils';
import { formatSeverity, formatIncidentType } from '../../lib/formatters';
import { StatusBadge } from '../../components/StatusBadge';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Shield, AlertTriangle, CheckCircle, Clock,
  MapPin, Users, Activity, Zap, MessageSquare, Send,
  AlertCircle, Flame, Droplets, Heart, Car, Building2,
  UserPlus, X, Plus, Siren, FileText, Radio,
  ChevronDown, ChevronUp, RefreshCw, Truck, Phone,
} from 'lucide-react';
import {
  Incident, IncidentType, IncidentStatus, IncidentListItem,
} from '../../types';

// ─── Agency definitions ────────────────────────────────────────────────────────

interface AgencyConfig {
  id: string;
  name: string;
  full: string;
  role: string;
  contact: string;
  color: string;
  ring: string;
  text: string;
  bg: string;
}

const ALL_AGENCIES: Record<string, AgencyConfig> = {
  SCDF: {
    id: 'SCDF', name: 'SCDF', full: 'Singapore Civil Defence Force',
    role: 'Fire, Flood & EMS', contact: '1777 / 995',
    color: 'red', ring: 'ring-red-500', text: 'text-red-600', bg: 'bg-red-50',
  },
  SPF: {
    id: 'SPF', name: 'SPF', full: 'Singapore Police Force',
    role: 'Law & Order / Traffic', contact: '999',
    color: 'navy', ring: 'ring-navy', text: 'text-navy', bg: 'bg-navy-light',
  },
  PUB: {
    id: 'PUB', name: 'PUB', full: 'Public Utilities Board',
    role: 'Water, Drainage, Flood', contact: '1800 784 5877',
    color: 'blue', ring: 'ring-blue-500', text: 'text-blue-600', bg: 'bg-blue-50',
  },
  MOH: {
    id: 'MOH', name: 'MOH', full: 'Ministry of Health',
    role: 'Health Coordination', contact: '1800 333 9999',
    color: 'teal', ring: 'ring-teal', text: 'text-teal-dark', bg: 'bg-teal-light',
  },
  PA: {
    id: 'PA', name: 'PA', full: "People's Association",
    role: 'Community / Shelters', contact: '6225 5322',
    color: 'amber', ring: 'ring-amber', text: 'text-amber-dark', bg: 'bg-amber-light',
  },
  LTA: {
    id: 'LTA', name: 'LTA', full: 'Land Transport Authority',
    role: 'Traffic Diversion / Transit', contact: '1800 2255 582',
    color: 'purple', ring: 'ring-purple-500', text: 'text-purple-700', bg: 'bg-purple-50',
  },
  NEA: {
    id: 'NEA', name: 'NEA', full: 'National Environment Agency',
    role: 'Haze, Hazmat, Dengue', contact: '1800 2255 632',
    color: 'green', ring: 'ring-green-500', text: 'text-green-700', bg: 'bg-green-50',
  },
  BCA: {
    id: 'BCA', name: 'BCA', full: 'Building & Construction Authority',
    role: 'Structural Safety', contact: '1800 342 5222',
    color: 'orange', ring: 'ring-orange-500', text: 'text-orange-700', bg: 'bg-orange-50',
  },
  SRC: {
    id: 'SRC', name: 'Red Cross', full: 'Singapore Red Cross',
    role: 'First Aid / Volunteers', contact: '6336 0269',
    color: 'red', ring: 'ring-red-400', text: 'text-red-500', bg: 'bg-red-50',
  },
  TC: {
    id: 'TC', name: 'Town Council', full: 'Town Council (Affected)',
    role: 'HDB / Resident Comms', contact: 'Varies by town',
    color: 'gray', ring: 'ring-gray-400', text: 'text-gray-600', bg: 'bg-gray-50',
  },
};

// ─── Per-incident-type agency sets & checklists ───────────────────────────────

const INCIDENT_AGENCIES: Record<IncidentType, string[]> = {
  flood:          ['SCDF', 'PUB', 'PA', 'SPF', 'TC', 'SRC'],
  medical:        ['SCDF', 'MOH', 'SPF'],
  fire:           ['SCDF', 'SPF', 'LTA', 'TC'],
  road:           ['SPF', 'SCDF', 'LTA'],
  infrastructure: ['SCDF', 'BCA', 'SPF', 'TC'],
  civil:          ['SPF', 'SCDF', 'PA'],
  other:          ['SCDF', 'SPF'],
};

interface ChecklistItem {
  id: string;
  text: string;
  agency: string;
  required: boolean;
}

const INCIDENT_CHECKLISTS: Record<IncidentType, ChecklistItem[]> = {
  flood: [
    { id: 'f1', text: 'Alert SCDF Flood Response — request pump trucks & boats', agency: 'SCDF', required: true },
    { id: 'f2', text: 'Notify PUB Flood Control Centre of water level readings', agency: 'PUB', required: true },
    { id: 'f3', text: 'Contact Town Council to notify residents & unlock common areas', agency: 'TC', required: true },
    { id: 'f4', text: 'Activate nearest evacuation centre via PA', agency: 'PA', required: true },
    { id: 'f5', text: 'Alert SPF for cordon & traffic management', agency: 'SPF', required: true },
    { id: 'f6', text: 'Issue public advisory via gov.sg / 938Live', agency: 'MCI', required: true },
    { id: 'f7', text: 'Request Red Cross volunteers for evacuation support', agency: 'SRC', required: false },
    { id: 'f8', text: 'Pre-position ambulances near evacuation site', agency: 'SCDF', required: false },
    { id: 'f9', text: 'Monitor water levels — update every 30 min', agency: 'PUB', required: true },
  ],
  medical: [
    { id: 'm1', text: 'Dispatch nearest ambulance with paramedic team', agency: 'SCDF', required: true },
    { id: 'm2', text: 'Alert receiving hospital A&E — give advance notification', agency: 'MOH', required: true },
    { id: 'm3', text: 'Send police if scene not secure', agency: 'SPF', required: false },
    { id: 'm4', text: 'Request bystander CPR guidance via 995 operator', agency: 'SCDF', required: true },
    { id: 'm5', text: 'Document patient handover at hospital', agency: 'SCDF/Hospital', required: true },
    { id: 'm6', text: 'Notify NOK if patient identity confirmed', agency: 'Ops', required: false },
  ],
  fire: [
    { id: 'fi1', text: 'Dispatch fire engine + ladder platform to scene', agency: 'SCDF', required: true },
    { id: 'fi2', text: 'Send SCDF hazmat team if chemical/industrial fire', agency: 'SCDF', required: false },
    { id: 'fi3', text: 'Dispatch ambulances — standby for casualties', agency: 'SCDF EMS', required: true },
    { id: 'fi4', text: 'Alert SPF for road closures & crowd control', agency: 'SPF', required: true },
    { id: 'fi5', text: 'Notify SP Group if gas/electrical lines at risk', agency: 'SP Group', required: false },
    { id: 'fi6', text: 'Evacuate affected and surrounding buildings', agency: 'SCDF/SPF', required: true },
    { id: 'fi7', text: 'Notify Town Council for HDB residential fires', agency: 'TC', required: false },
  ],
  road: [
    { id: 'r1', text: 'Dispatch Traffic Police to scene', agency: 'SPF', required: true },
    { id: 'r2', text: 'Send ambulance if casualties reported', agency: 'SCDF EMS', required: true },
    { id: 'r3', text: 'Alert LTA for expressway / arterial road advisory', agency: 'LTA', required: true },
    { id: 'r4', text: 'Coordinate tow trucks for vehicle removal', agency: 'LTA Ops', required: false },
    { id: 'r5', text: 'Issue traffic diversion via One Motoring / 938Live', agency: 'LTA/SPF', required: true },
    { id: 'r6', text: 'Check CCTV footage for incident reconstruction', agency: 'LTA/SPF', required: false },
  ],
  infrastructure: [
    { id: 'i1', text: 'Alert SCDF for structural hazard assessment', agency: 'SCDF', required: true },
    { id: 'i2', text: 'Notify BCA for building safety certification', agency: 'BCA', required: true },
    { id: 'i3', text: 'Evacuate affected building — establish safe perimeter', agency: 'SCDF/SPF', required: true },
    { id: 'i4', text: 'Alert SP Group if utilities (gas, power) at risk', agency: 'SP Group', required: false },
    { id: 'i5', text: 'Contact Town Council for HDB structural issues', agency: 'TC', required: false },
    { id: 'i6', text: 'Establish temporary housing via PA if needed', agency: 'PA', required: false },
  ],
  civil: [
    { id: 'c1', text: 'Alert nearest SPF division — immediate dispatch', agency: 'SPF', required: true },
    { id: 'c2', text: 'Request Riot Police / PRU if large-scale disturbance', agency: 'SPF PRU', required: false },
    { id: 'c3', text: 'Seal off area — establish inner & outer cordon', agency: 'SPF', required: true },
    { id: 'c4', text: 'Medical standby for casualties', agency: 'SCDF EMS', required: false },
    { id: 'c5', text: 'Notify ISD if terrorism / security threat', agency: 'ISD', required: false },
    { id: 'c6', text: 'Manage media presence — restrict access', agency: 'SPF/MCI', required: true },
  ],
  other: [
    { id: 'o1', text: 'Assess incident type, severity and immediate risk', agency: 'Ops', required: true },
    { id: 'o2', text: 'Deploy appropriate first responders', agency: 'SCDF/SPF', required: true },
    { id: 'o3', text: 'Establish on-scene incident command', agency: 'IC', required: true },
    { id: 'o4', text: 'Update command centre every 15 min', agency: 'Ops', required: true },
  ],
};

// ─── Types ─────────────────────────────────────────────────────────────────────

type ChannelStatus = 'not-contacted' | 'alerted' | 'acknowledged' | 'on-scene' | 'standby';

interface ChannelMessage {
  id: string;
  from: string;
  content: string;
  timestamp: string;
  isIncoming: boolean;
  type?: 'system' | 'ops' | 'field';
}

interface AgencyChannel {
  agencyId: string;
  status: ChannelStatus;
  messages: ChannelMessage[];
}

// ─── Status stepper ────────────────────────────────────────────────────────────

const STATUS_FLOW: IncidentStatus[] = [
  'open', 'triaging', 'dispatched', 'on_scene', 'resolved',
];

const STATUS_LABELS: Record<IncidentStatus, string> = {
  open:       'Open',
  triaging:   'Triaging',
  dispatched: 'Dispatched',
  on_scene:   'On Scene',
  resolved:   'Resolved',
  closed:     'Closed',
};

function StatusStepper({
  current,
  onAdvance,
  isPending,
}: {
  current: IncidentStatus;
  onAdvance: (s: IncidentStatus) => void;
  isPending: boolean;
}) {
  const idx = STATUS_FLOW.indexOf(current);
  const next = STATUS_FLOW[idx + 1];

  return (
    <div className="flex items-center gap-2">
      {STATUS_FLOW.map((s, i) => {
        const done    = i < idx;
        const active  = i === idx;
        const pending = i > idx;
        return (
          <div key={s} className="flex items-center gap-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
              ${done   ? 'bg-teal border-teal text-white' :
                active ? 'bg-navy border-navy text-white ring-2 ring-navy ring-offset-1' :
                         'bg-white border-paper-border text-ink-muted'}`}>
              {done ? <CheckCircle size={13} /> : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${active ? 'text-navy' : done ? 'text-teal-dark' : 'text-ink-muted'}`}>
              {STATUS_LABELS[s]}
            </span>
            {i < STATUS_FLOW.length - 1 && (
              <div className={`w-6 h-0.5 ${done || active ? 'bg-teal' : 'bg-paper-border'}`} />
            )}
          </div>
        );
      })}
      {next && current !== 'resolved' && current !== 'closed' && (
        <Button
          size="sm"
          onClick={() => onAdvance(next)}
          isLoading={isPending}
          className="ml-3 whitespace-nowrap"
        >
          → {STATUS_LABELS[next]}
        </Button>
      )}
    </div>
  );
}

// ─── Agency Channel panel ──────────────────────────────────────────────────────

const CHANNEL_STATUS_CFG: Record<ChannelStatus, { label: string; cls: string; dot: string }> = {
  'not-contacted': { label: 'Not contacted', cls: 'text-ink-muted',   dot: 'bg-gray-300'   },
  'alerted':       { label: 'Alerted',       cls: 'text-amber-dark',  dot: 'bg-amber'      },
  'acknowledged':  { label: 'Acknowledged',  cls: 'text-navy-mid',    dot: 'bg-navy'       },
  'on-scene':      { label: 'On Scene',      cls: 'text-teal-dark',   dot: 'bg-teal'       },
  'standby':       { label: 'Standby',       cls: 'text-ink-muted',   dot: 'bg-gray-400'   },
};

const QUICK_MESSAGES: Record<string, string[]> = {
  SCDF: [
    'Please confirm unit deployment to incident location.',
    'Requesting 2× pump trucks and 1× rescue boat.',
    'Standby for further instructions.',
    'Incident escalating — increase deployment.',
    'Scene secured — stand down non-essential units.',
  ],
  SPF: [
    'Request road closure at incident perimeter.',
    'Please establish crowd control at site.',
    'Assist with evacuation of affected residents.',
    'Investigate suspicious circumstances.',
  ],
  PUB: [
    'What is the current water level at affected drain?',
    'Please dispatch mobile pump team to location.',
    'Confirm status of upstream drainage gates.',
    'Request isolation of affected utilities.',
  ],
  PA: [
    'Activate evacuation centre at nearest CC.',
    'Request volunteer deployment for resident support.',
    'Issue community advisory via RC networks.',
    'Provide logistics support at shelter.',
  ],
  DEFAULT: [
    'Please acknowledge and confirm resource availability.',
    'Requesting immediate deployment to incident site.',
    'Situation developing — provide situation report.',
    'Stand by for coordination instructions.',
  ],
};

function AgencyCommHub({
  incidentType,
  incidentId,
}: {
  incidentType: IncidentType;
  incidentId: string;
}) {
  const agencyIds = INCIDENT_AGENCIES[incidentType] || ['SCDF', 'SPF'];
  const [channels, setChannels] = useState<Record<string, AgencyChannel>>(() => {
    const init: Record<string, AgencyChannel> = {};
    agencyIds.forEach(id => {
      init[id] = { agencyId: id, status: 'not-contacted', messages: [] };
    });
    return init;
  });
  const [activeChannel, setActiveChannel] = useState<string>(agencyIds[0]);
  const [draft, setDraft]     = useState('');
  const [showQuick, setShowQuick] = useState(false);
  const msgEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [channels]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const msg: ChannelMessage = {
      id: `${Date.now()}`,
      from: 'OPS CENTRE',
      content: text,
      timestamp: new Date().toISOString(),
      isIncoming: false,
      type: 'ops',
    };
    setChannels(prev => ({
      ...prev,
      [activeChannel]: {
        ...prev[activeChannel],
        status: prev[activeChannel].status === 'not-contacted' ? 'alerted' : prev[activeChannel].status,
        messages: [...prev[activeChannel].messages, msg],
      },
    }));
    setDraft('');
    setShowQuick(false);

    // Simulate incoming reply
    setTimeout(() => {
      const replies: Record<string, string[]> = {
        SCDF:  ['SCDF received. Coordinating now.', 'Understood. Units will be deployed.', 'Acknowledged — ETA 6 min.'],
        SPF:   ['SPF acknowledged. On our way.', 'Roger. Deploying to location.', 'Copy that. Scene management underway.'],
        PUB:   ['PUB Control received. Checking drainage data.', 'Acknowledged. Mobile team dispatched.', 'Water level confirmed. Coordinating response.'],
        PA:    ['PA acknowledged. Activating community response.', 'Understood. Centre being activated now.', 'Received. Volunteer network alerted.'],
        DEFAULT: ['Message received. Will respond shortly.', 'Acknowledged. Coordinating team.', 'Copy. On standby.'],
      };
      const pool = replies[activeChannel] || replies.DEFAULT;
      const reply: ChannelMessage = {
        id: `${Date.now()}-r`,
        from: ALL_AGENCIES[activeChannel]?.name || activeChannel,
        content: pool[Math.floor(Math.random() * pool.length)],
        timestamp: new Date().toISOString(),
        isIncoming: true,
        type: 'field',
      };
      setChannels(prev => ({
        ...prev,
        [activeChannel]: {
          ...prev[activeChannel],
          status: 'acknowledged',
          messages: [...prev[activeChannel].messages, reply],
        },
      }));
    }, 1500 + Math.random() * 2000);
  };

  const setStatus = (agencyId: string, status: ChannelStatus) => {
    setChannels(prev => ({ ...prev, [agencyId]: { ...prev[agencyId], status } }));
  };

  const ch = channels[activeChannel];
  const agency = ALL_AGENCIES[activeChannel];
  const quickMsgs = QUICK_MESSAGES[activeChannel] || QUICK_MESSAGES.DEFAULT;

  return (
    <div className="flex flex-col h-full">
      {/* Agency tabs */}
      <div className="border-b border-paper-border bg-paper">
        <div className="flex overflow-x-auto">
          {agencyIds.map(id => {
            const a   = ALL_AGENCIES[id];
            const ch  = channels[id];
            const cfg = CHANNEL_STATUS_CFG[ch.status];
            const unread = ch.messages.filter(m => m.isIncoming).length;
            return (
              <button key={id} onClick={() => setActiveChannel(id)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                  activeChannel === id
                    ? 'border-navy text-navy bg-white'
                    : 'border-transparent text-ink-muted hover:text-ink'
                }`}>
                <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                {a?.name ?? id}
                {unread > 0 && ch.messages.some(m => m.isIncoming) && (
                  <span className="bg-teal text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center">
                    {unread}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Channel header */}
      {agency && (
        <div className="px-4 py-2.5 bg-white border-b border-paper-border flex items-center justify-between flex-shrink-0">
          <div>
            <p className="text-xs font-semibold text-ink">{agency.full}</p>
            <p className="text-[11px] text-ink-muted">{agency.role} · {agency.contact}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold ${CHANNEL_STATUS_CFG[ch.status].cls}`}>
              {CHANNEL_STATUS_CFG[ch.status].label}
            </span>
            <select
              value={ch.status}
              onChange={e => setStatus(activeChannel, e.target.value as ChannelStatus)}
              className="text-xs border border-paper-border rounded px-1.5 py-1 focus:outline-none bg-white"
            >
              {(Object.keys(CHANNEL_STATUS_CFG) as ChannelStatus[]).map(s => (
                <option key={s} value={s}>{CHANNEL_STATUS_CFG[s].label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-paper/50">
        {ch.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-ink-muted py-8">
            <Radio size={24} className="mb-2 opacity-30" />
            <p className="text-xs">No communication yet.</p>
            <p className="text-[11px] mt-0.5">Send a message to open the channel.</p>
          </div>
        ) : (
          ch.messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.isIncoming ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[80%] px-3 py-2 rounded-lg text-xs ${
                msg.isIncoming
                  ? 'bg-white border border-paper-border text-ink rounded-tl-none'
                  : 'bg-navy text-white rounded-tr-none'
              }`}>
                <div className={`text-[10px] font-semibold mb-0.5 ${msg.isIncoming ? 'text-ink-muted' : 'text-white/70'}`}>
                  {msg.from}
                </div>
                {msg.content}
                <div className={`text-[10px] mt-0.5 ${msg.isIncoming ? 'text-ink-muted' : 'text-white/50'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={msgEndRef} />
      </div>

      {/* Quick messages */}
      <AnimatePresence>
        {showQuick && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="border-t border-paper-border bg-white overflow-hidden">
            <div className="p-2 space-y-1">
              <p className="text-[10px] font-semibold text-ink-muted uppercase px-1 mb-1.5">Quick Messages</p>
              {quickMsgs.map((q, i) => (
                <button key={i} onClick={() => { sendMessage(q); }}
                  className="w-full text-left text-xs text-ink hover:bg-paper-hover px-2 py-1.5 rounded transition-colors">
                  {q}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="p-3 border-t border-paper-border bg-white flex-shrink-0 space-y-2">
        <div className="flex gap-2">
          <button onClick={() => setShowQuick(v => !v)}
            className="px-3 py-2 text-xs border border-paper-border rounded-sm hover:bg-paper-hover text-ink-muted whitespace-nowrap">
            {showQuick ? <ChevronDown size={13} /> : <ChevronUp size={13} />} Templates
          </button>
          <input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage(draft)}
            placeholder={`Message ${agency?.name ?? activeChannel}…`}
            className="flex-1 px-3 py-2 border border-paper-border rounded-sm text-xs focus:outline-none focus:ring-2 focus:ring-navy"
          />
          <button onClick={() => sendMessage(draft)}
            disabled={!draft.trim()}
            className="px-3 py-2 bg-navy text-white rounded-sm text-xs hover:bg-navy-dark disabled:opacity-40 transition-colors">
            <Send size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Checklist panel ───────────────────────────────────────────────────────────

function IncidentChecklist({ type }: { type: IncidentType }) {
  const items = INCIDENT_CHECKLISTS[type] || INCIDENT_CHECKLISTS.other;
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const done  = Object.values(checked).filter(Boolean).length;
  const total = items.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-mono font-semibold text-ink-muted uppercase">
          Action Checklist
        </h3>
        <span className={`text-xs font-semibold ${done === total ? 'text-teal-dark' : 'text-ink-muted'}`}>
          {done}/{total}
        </span>
      </div>
      {/* Progress */}
      <div className="h-1 bg-paper-border rounded-full mb-3 overflow-hidden">
        <div className="h-full bg-teal rounded-full transition-all"
          style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }} />
      </div>
      <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
        {items.map(item => (
          <label key={item.id}
            className={`flex items-start gap-2 p-2 rounded cursor-pointer transition-colors ${
              checked[item.id] ? 'bg-teal-light' : 'hover:bg-paper-hover'
            }`}>
            <input type="checkbox" checked={!!checked[item.id]}
              onChange={e => setChecked(p => ({ ...p, [item.id]: e.target.checked }))}
              className="mt-0.5 accent-teal" />
            <div className="flex-1 min-w-0">
              <p className={`text-xs leading-tight ${checked[item.id] ? 'line-through text-ink-muted' : 'text-ink'}`}>
                {item.text}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-ink-muted">{item.agency}</span>
                {item.required && (
                  <span className="text-[10px] text-red font-semibold">Required</span>
                )}
              </div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

// ─── Resource panel ────────────────────────────────────────────────────────────

function ResourcePanel({ incident }: { incident: Incident }) {
  const { data: hospitalsData } = useHospitals();
  const { data: tasksData } = useVolunteerTasks();
  const [showVolReq, setShowVolReq] = useState(false);
  const hospitals = hospitalsData?.hospitals || [];
  const tasks = tasksData?.tasks || [];
  const nearbyTasks = tasks.filter(t => t.status !== 'full' && t.status !== 'completed').slice(0, 3);

  return (
    <div className="space-y-4 overflow-y-auto h-full pr-1">
      {/* Hospitals */}
      <div>
        <h3 className="text-xs font-mono font-semibold text-ink-muted uppercase mb-2">
          Hospital Capacity
        </h3>
        <div className="space-y-2">
          {hospitals.slice(0, 4).map(h => {
            const pct = h.totalBeds > 0 ? (h.availableBeds / h.totalBeds) * 100 : 0;
            const bar = pct > 30 ? 'bg-teal' : pct > 10 ? 'bg-amber' : 'bg-red';
            return (
              <div key={h.id} className="bg-white border border-paper-border rounded-sm p-2.5">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-ink">{h.shortName}</span>
                  <span className={`text-[10px] font-mono ${pct < 15 ? 'text-red font-bold' : 'text-ink-muted'}`}>
                    {h.availableBeds}/{h.totalBeds}
                  </span>
                </div>
                <div className="h-1.5 bg-paper-border rounded-full overflow-hidden">
                  <div className={`h-full ${bar} rounded-full`} style={{ width: `${pct}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-ink-muted mt-1">
                  <span>ICU: {h.icuAvailable}</span>
                  <span>Trauma: {h.traumaBays}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Volunteer aid */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-mono font-semibold text-ink-muted uppercase">
            Volunteer Aid
          </h3>
          <button onClick={() => setShowVolReq(v => !v)}
            className="text-[10px] text-teal font-semibold hover:underline">
            {showVolReq ? 'Close' : 'Request Aid'}
          </button>
        </div>

        {showVolReq && (
          <div className="bg-teal-light border border-teal rounded-sm p-3 mb-2">
            <p className="text-xs font-semibold text-teal-dark mb-2">Request Volunteer Support</p>
            <select className="w-full text-xs border border-teal rounded px-2 py-1.5 mb-2 focus:outline-none bg-white">
              <option>Flood Relief — Food Packing</option>
              <option>Evacuation Centre Support</option>
              <option>First Aid Station</option>
              <option>Language Support</option>
              <option>Supply Distribution</option>
            </select>
            <textarea rows={2} placeholder="Additional notes for volunteers…"
              className="w-full text-xs border border-teal rounded px-2 py-1.5 mb-2 resize-none focus:outline-none" />
            <button className="w-full py-1.5 bg-teal text-white text-xs font-semibold rounded hover:bg-teal-dark">
              Send Request to Red Cross / PA
            </button>
          </div>
        )}

        <div className="space-y-2">
          {nearbyTasks.map(t => (
            <div key={t.id} className="bg-white border border-paper-border rounded-sm p-2.5">
              <p className="text-xs font-semibold text-ink truncate">{t.title}</p>
              <p className="text-[11px] text-ink-muted">{t.organization}</p>
              <div className="flex justify-between text-[10px] mt-1">
                <span className="text-ink-muted">{t.slotsFilled}/{t.slotsTotal} volunteers</span>
                <span className={`font-semibold ${t.urgency === 'critical' ? 'text-red' : 'text-teal-dark'}`}>
                  {t.slotsTotal - t.slotsFilled} slots left
                </span>
              </div>
              <div className="h-1 bg-paper-border rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-teal rounded-full"
                  style={{ width: `${(t.slotsFilled / t.slotsTotal) * 100}%` }} />
              </div>
            </div>
          ))}
          {nearbyTasks.length === 0 && (
            <p className="text-xs text-ink-muted text-center py-4">No active volunteer tasks</p>
          )}
        </div>
      </div>

      {/* Recommended equipment */}
      <div>
        <h3 className="text-xs font-mono font-semibold text-ink-muted uppercase mb-2">
          Recommended Resources
        </h3>
        {({
          flood:          ['2× Pump Trucks', '1× Rescue Boat', '4× SCDF Officers', 'Medical Standby'],
          medical:        ['1× Ambulance (ALS)', '2× Paramedics', 'AED Unit'],
          fire:           ['2× Fire Engines', '1× Hazmat Team', '1× Ambulance', 'SPF Traffic'],
          road:           ['Traffic Police (TP)', '1× Ambulance if injured', 'LTA Tow Truck'],
          infrastructure: ['SCDF Hazmat', 'BCA Inspector', 'SPF Cordon'],
          civil:          ['SPF PRU', 'Medical Standby', 'SPF Cordon Units'],
          other:          ['SCDF Assessment', 'SPF Support'],
        } as Record<IncidentType, string[]>)[incident.type]?.map((r, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-ink py-1 border-b border-paper-border last:border-0">
            <Truck size={11} className="text-ink-muted flex-shrink-0" />
            {r}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Timeline ──────────────────────────────────────────────────────────────────

function IncidentTimeline({ timeline }: { timeline: any[] }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-t border-paper-border bg-white">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-paper-hover text-left">
        <span className="text-xs font-mono font-semibold text-ink-muted uppercase flex items-center gap-2">
          <FileText size={12} /> Timeline ({timeline.length} entries)
        </span>
        {open ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            className="overflow-hidden">
            <div className="px-4 pb-4 max-h-40 overflow-y-auto">
              {timeline.length === 0 ? (
                <p className="text-xs text-ink-muted text-center py-3">No timeline entries yet.</p>
              ) : (
                <div className="space-y-3">
                  {timeline.map((update, idx) => (
                    <div key={update.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1
                          ${update.updateType === 'status_change' ? 'bg-navy' :
                            update.updateType === 'dispatch' ? 'bg-teal' : 'bg-paper-border'}`} />
                        {idx < timeline.length - 1 && <div className="w-px flex-1 bg-paper-border mt-1" />}
                      </div>
                      <div className="flex-1 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-ink-muted">
                            {formatDateTime(update.createdAt)}
                          </span>
                          {update.author && (
                            <span className="text-[10px] font-semibold text-ink">{update.author.name}</span>
                          )}
                        </div>
                        <p className="text-xs text-ink mt-0.5">{update.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main TicketDetail ─────────────────────────────────────────────────────────

export function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = authStore(s => s.user);

  const { data, isLoading, error, refetch } = useIncident(id!);
  const { mutate: approveIncident, isPending: isApproving } = useApproveIncident(id!);
  const { mutate: updateStatus,    isPending: isUpdatingStatus } = useUpdateIncidentStatus(id!);
  const { mutate: addUpdate,       isPending: isAddingNote }    = useAddIncidentUpdate(id!);
  const { mutate: claimIncident,   isPending: isClaiming }      = useClaimIncident();

  const {
    streamedText, isStreaming, isComplete, options, error: aiError, trigger, reset,
  } = useClaudeStream();

  const [noteText,   setNoteText]   = useState('');
  const [showAI,     setShowAI]     = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);

  const incident  = data?.incident;
  const timeline  = data?.timeline || [];

  // Elapsed timer
  useEffect(() => {
    if (!incident) return;
    const base = new Date(incident.createdAt).getTime();
    const tick = () => setElapsedSec(Math.floor((Date.now() - base) / 1000));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [incident?.createdAt]);

  const fmtElapsed = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${sec}s`;
    return `${sec}s`;
  };

  if (isLoading) return (
    <div className="p-6 flex items-center justify-center h-64">
      <RefreshCw className="animate-spin text-ink-muted" size={24} />
    </div>
  );

  if (error || !incident) return (
    <div className="p-6">
      <div className="bg-red-light border border-red rounded-sm p-4">
        <p className="text-red font-semibold">Error loading incident</p>
        <button onClick={() => refetch()} className="text-sm text-red-dark underline mt-1">Retry</button>
      </div>
    </div>
  );

  const isMyClaim    = incident.assignedTo?.id === user?.id;
  const isUnassigned = !incident.assignedTo;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-paper">
      {/* ── Top bar ── */}
      <div className="bg-white border-b border-paper-border px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/responder')}
              className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
              <ArrowLeft size={16} /> Queue
            </button>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-ink">{incident.ticketNumber}</span>
              <span className="text-ink-muted">·</span>
              <span className="font-semibold text-ink">{incident.title}</span>
              <StatusBadge status={incident.status} />
              <span className={`text-xs font-mono px-2 py-0.5 rounded
                ${incident.severity === 1 ? 'bg-red-light text-red-dark' :
                  incident.severity === 2 ? 'bg-amber-light text-amber-dark' :
                                            'bg-teal-light text-teal-dark'}`}>
                {formatSeverity(incident.severity)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-ink-muted bg-paper px-3 py-1.5 rounded border border-paper-border">
              <Clock size={12} /> ⏱ {fmtElapsed(elapsedSec)}
            </div>
            {isUnassigned && (
              <button onClick={() => claimIncident(incident.id)} disabled={isClaiming}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-teal text-white text-xs font-semibold rounded-sm hover:bg-teal-dark disabled:opacity-50">
                <UserPlus size={13} /> {isClaiming ? 'Claiming…' : 'Claim Incident'}
              </button>
            )}
            {isMyClaim && (
              <span className="text-xs text-teal-dark font-semibold bg-teal-light px-2 py-1 rounded">
                ✓ Assigned to you
              </span>
            )}
            {incident.assignedTo && !isMyClaim && (
              <span className="text-xs text-ink-muted italic">
                → {incident.assignedTo.name}
              </span>
            )}
            <button onClick={() => refetch()}
              className="p-1.5 text-ink-muted hover:text-ink border border-paper-border rounded-sm hover:bg-paper-hover">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Status stepper */}
        <StatusStepper
          current={incident.status}
          onAdvance={s => updateStatus(s)}
          isPending={isUpdatingStatus}
        />
      </div>

      {/* ── Main 3-panel content ── */}
      <div className="flex-1 overflow-hidden grid grid-cols-[280px_1fr_260px]">

        {/* LEFT: Incident info + AI + Checklist */}
        <div className="border-r border-paper-border bg-white flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* Incident summary */}
            <div>
              <h3 className="text-xs font-mono font-semibold text-ink-muted uppercase mb-2">Incident Brief</h3>
              <div className="space-y-1.5 text-xs">
                <div className="flex gap-2">
                  <span className="text-ink-muted w-16 flex-shrink-0">Type</span>
                  <span className="font-medium text-ink capitalize">{formatIncidentType(incident.type)}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-ink-muted w-16 flex-shrink-0">Location</span>
                  <span className="text-ink">{incident.locationText}</span>
                </div>
                {incident.reportedBy && (
                  <div className="flex gap-2">
                    <span className="text-ink-muted w-16 flex-shrink-0">Reporter</span>
                    <span className="text-ink">{incident.reportedBy.name}</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <span className="text-ink-muted w-16 flex-shrink-0">Created</span>
                  <span className="text-ink">{formatDateTime(incident.createdAt)}</span>
                </div>
              </div>
              <div className="mt-2.5 p-2.5 bg-paper rounded-sm text-xs text-ink leading-relaxed">
                {incident.description}
              </div>
            </div>

            <hr className="border-paper-border" />

            {/* AI Triage */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-mono font-semibold text-ink-muted uppercase">AI Triage</h3>
                {(isComplete || incident.aiTriageData) && (
                  <button onClick={reset} className="text-[10px] text-teal hover:underline">Reset</button>
                )}
              </div>

              {!incident.aiTriageData && !isStreaming && !isComplete && (
                <button onClick={() => trigger(incident.id)}
                  className="w-full py-2 bg-navy text-white text-xs font-semibold rounded-sm hover:bg-navy-dark flex items-center justify-center gap-2">
                  <Zap size={13} /> Run AI Triage
                </button>
              )}

              {isStreaming && (
                <div className="bg-paper p-3 rounded-sm">
                  <div className="text-xs font-mono text-teal-dark mb-2 flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-teal rounded-full animate-pulse" />
                    AI analysing…
                  </div>
                  <p className="text-xs text-ink font-mono leading-relaxed">{streamedText}<span className="animate-pulse">█</span></p>
                </div>
              )}

              {(isComplete && options) && (
                <div className="space-y-2">
                  <p className="text-[10px] text-ink-muted">{streamedText.slice(0, 200)}…</p>
                  {options.slice(0, 2).map((opt, i) => (
                    <div key={i} className="border border-paper-border rounded-sm p-2.5 bg-white">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-5 h-5 bg-navy text-white text-[10px] font-bold rounded flex items-center justify-center">{opt.rank}</div>
                        <span className="text-xs font-semibold text-ink">{opt.action}</span>
                        <span className={`ml-auto text-[10px] font-mono font-bold
                          ${opt.confidence >= 80 ? 'text-teal-dark' : opt.confidence >= 50 ? 'text-amber-dark' : 'text-red-dark'}`}>
                          {opt.confidence}%
                        </span>
                      </div>
                      <div className="h-1 bg-paper-border rounded-full overflow-hidden mb-1.5">
                        <div className={`h-full ${opt.confidence >= 80 ? 'bg-teal' : 'bg-amber'} rounded-full`}
                          style={{ width: `${opt.confidence}%` }} />
                      </div>
                      <p className="text-[11px] text-ink-muted">{opt.rationale}</p>
                      {opt.rank === 1 && !incident.approvedOption && (
                        <button onClick={() => approveIncident(1)} disabled={isApproving}
                          className="mt-2 w-full py-1.5 bg-teal text-white text-xs font-semibold rounded hover:bg-teal-dark disabled:opacity-50">
                          {isApproving ? 'Approving…' : '✓ Approve & Dispatch'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {incident.approvedOption && (
                <div className="bg-teal-light border border-teal rounded-sm p-2.5 text-xs text-teal-dark font-semibold">
                  ✓ AI Option {incident.approvedOption} approved — Dispatched
                </div>
              )}

              {aiError && (
                <p className="text-xs text-red bg-red-light p-2 rounded-sm">AI triage failed: {aiError}</p>
              )}
            </div>

            <hr className="border-paper-border" />

            {/* Checklist */}
            <IncidentChecklist type={incident.type} />

            <hr className="border-paper-border" />

            {/* Add note */}
            <div>
              <h3 className="text-xs font-mono font-semibold text-ink-muted uppercase mb-2">Add Note</h3>
              <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                rows={2}
                placeholder="Log an update or field note…"
                className="w-full px-2.5 py-2 border border-paper-border rounded-sm text-xs resize-none focus:outline-none focus:ring-1 focus:ring-navy"
              />
              <button onClick={() => { if (noteText.trim()) { addUpdate(noteText); setNoteText(''); } }}
                disabled={isAddingNote || !noteText.trim()}
                className="mt-1.5 w-full py-2 bg-navy text-white text-xs font-semibold rounded-sm hover:bg-navy-dark disabled:opacity-50">
                {isAddingNote ? 'Saving…' : 'Save Note'}
              </button>
            </div>
          </div>
        </div>

        {/* CENTER: Agency Comm Hub */}
        <div className="flex flex-col overflow-hidden border-r border-paper-border">
          <div className="px-4 py-2.5 bg-white border-b border-paper-border flex items-center gap-2 flex-shrink-0">
            <Radio size={14} className="text-navy" />
            <h2 className="text-sm font-semibold text-ink">Agency Coordination Hub</h2>
            <span className="ml-auto text-[10px] text-ink-muted bg-paper px-2 py-0.5 rounded">
              {(INCIDENT_AGENCIES[incident.type] || []).length} channels
            </span>
          </div>
          <div className="flex-1 overflow-hidden">
            <AgencyCommHub incidentType={incident.type} incidentId={incident.id} />
          </div>
        </div>

        {/* RIGHT: Resources */}
        <div className="flex flex-col overflow-hidden bg-white">
          <div className="px-4 py-2.5 border-b border-paper-border flex-shrink-0">
            <h2 className="text-sm font-semibold text-ink">Resources</h2>
          </div>
          <div className="flex-1 overflow-hidden p-4">
            <ResourcePanel incident={incident} />
          </div>
        </div>
      </div>

      {/* ── Timeline ── */}
      <div className="flex-shrink-0 border-t border-paper-border">
        <IncidentTimeline timeline={timeline} />
      </div>
    </div>
  );
}