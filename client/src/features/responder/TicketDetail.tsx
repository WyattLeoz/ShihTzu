import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useIncident, useApproveIncident, useUpdateIncidentStatus,
  useAddIncidentUpdate, useClaimIncident, useAssignIncident,
} from '../../api/incidents';
import { useHospitals, useVolunteerTasks } from '../../api/resources';
import { useClaudeStream } from '../../hooks/useClaudeStream';
import { authStore } from '../../stores/authStore';
import { formatDateTime, formatTimeAgo } from '../../lib/utils';
import { formatSeverity, formatIncidentType } from '../../lib/formatters';
import { StatusBadge } from '../../components/StatusBadge';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import {
  ArrowLeft, CheckCircle, Clock, MapPin, User, Shield, Activity,
  Zap, Send, AlertCircle, Flame, Droplets, Heart, Car, Building2,
  UserPlus, X, Plus, FileText, Radio, ChevronRight, RefreshCw,
  Phone, ChevronDown, ChevronUp, Truck, Eye, Edit3, AlertTriangle,
  Flag, HelpCircle, ThumbsUp, Users,
} from 'lucide-react';
import { Incident, IncidentType, IncidentStatus } from '../../types';

// ─── Mock team members (replace with /api/users when available) ───────────────

const MOCK_TEAM = [
  { id: 'r1', name: 'Ahmad Danial',      unit: 'SCDF Jurong West',  badge: 'AD' },
  { id: 'r2', name: 'Sarah Tan Wei Lin', unit: 'SCDF Clementi',     badge: 'ST' },
  { id: 'r3', name: 'Lee Kai Xiang',     unit: 'SCDF Buona Vista',  badge: 'LK' },
  { id: 'r4', name: 'Priya Nair',        unit: 'SPF Jurong West',   badge: 'PN' },
  { id: 'r5', name: 'Ravi Kumar',        unit: 'SCDF EMS Alpha',    badge: 'RK' },
  { id: 'r6', name: 'Nur Aisyah',        unit: 'SCDF Rescue Div',   badge: 'NA' },
];

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_FLOW: IncidentStatus[] = [
  'open', 'triaging', 'dispatched', 'on_scene', 'resolved',
];

const STATUS_META: Record<IncidentStatus, { label: string; color: string; bg: string }> = {
  open:       { label: 'Open',       color: 'text-ink',        bg: 'bg-paper'        },
  triaging:   { label: 'Triaging',   color: 'text-amber-dark', bg: 'bg-amber-light'  },
  dispatched: { label: 'Dispatched', color: 'text-teal-dark',  bg: 'bg-teal-light'   },
  on_scene:   { label: 'On Scene',   color: 'text-navy-mid',   bg: 'bg-navy-light'   },
  resolved:   { label: 'Resolved',   color: 'text-teal-dark',  bg: 'bg-teal-light'   },
  closed:     { label: 'Closed',     color: 'text-ink-muted',  bg: 'bg-paper-border' },
};

const SEV_META: Record<number, { label: string; color: string; bg: string; border: string }> = {
  1: { label: 'Critical', color: 'text-red-dark',   bg: 'bg-red-light',   border: 'border-red'   },
  2: { label: 'High',     color: 'text-amber-dark', bg: 'bg-amber-light', border: 'border-amber' },
  3: { label: 'Medium',   color: 'text-teal-dark',  bg: 'bg-teal-light',  border: 'border-teal'  },
};

const TYPE_ICONS: Record<IncidentType, React.ReactNode> = {
  fire:           <Flame      size={15} className="text-orange-600" />,
  flood:          <Droplets   size={15} className="text-blue-600"   />,
  medical:        <Heart      size={15} className="text-red-600"    />,
  road:           <Car        size={15} className="text-yellow-600" />,
  infrastructure: <Building2  size={15} className="text-purple-600" />,
  civil:          <Flag       size={15} className="text-navy"       />,
  other:          <HelpCircle size={15} className="text-ink-muted"  />,
};

// ─── Agency definitions per incident type ────────────────────────────────────

const INCIDENT_AGENCIES: Record<IncidentType, { name: string; role: string; contact: string }[]> = {
  flood:          [
    { name: 'SCDF',         role: 'Flood Response',      contact: '995'            },
    { name: 'PUB',          role: 'Drainage Control',    contact: '1800 284 6600'  },
    { name: 'PA',           role: 'Evacuation Centre',   contact: '6225 5322'      },
    { name: 'SPF',          role: 'Traffic & Cordon',    contact: '999'            },
    { name: 'Town Council', role: 'Resident Comms',      contact: 'Varies'         },
  ],
  medical:        [
    { name: 'SCDF EMS', role: 'Ambulance Dispatch',  contact: '995'           },
    { name: 'MOH',      role: 'Hospital Coord',       contact: '1800 333 9999' },
    { name: 'SPF',      role: 'Scene Security',       contact: '999'           },
  ],
  fire:           [
    { name: 'SCDF',     role: 'Fire & Rescue',        contact: '995'           },
    { name: 'SPF',      role: 'Road Closure',         contact: '999'           },
    { name: 'SP Group', role: 'Utilities Safety',     contact: '1800 752 1234' },
    { name: 'LTA',      role: 'Traffic Diversion',    contact: '1800 2255 582' },
  ],
  road:           [
    { name: 'Traffic Police', role: 'Accident Investigation', contact: '6547 0000'  },
    { name: 'SCDF EMS',       role: 'Medical Response',       contact: '995'        },
    { name: 'LTA',            role: 'Road Advisory',          contact: '1800 2255 582' },
  ],
  infrastructure: [
    { name: 'SCDF',     role: 'Structural Assessment', contact: '1777'          },
    { name: 'BCA',      role: 'Building Safety',       contact: '1800 342 5222' },
    { name: 'SP Group', role: 'Utilities',             contact: '1800 752 1234' },
    { name: 'SPF',      role: 'Perimeter Cordon',      contact: '999'           },
  ],
  civil:          [
    { name: 'SPF',      role: 'Law & Order',     contact: '999'           },
    { name: 'SCDF EMS', role: 'Medical Standby', contact: '995'           },
    { name: 'ISD',      role: 'Security Intel',  contact: '1800 278 7000' },
  ],
  other:          [
    { name: 'SCDF', role: 'First Response', contact: '1777' },
    { name: 'SPF',  role: 'Support',        contact: '999'  },
  ],
};

const INCIDENT_CHECKLISTS: Record<IncidentType, { id: string; text: string; agency: string; required: boolean }[]> = {
  flood:          [
    { id: 'f1', text: 'Alert SCDF Flood Response — request pump trucks & boats', agency: 'SCDF', required: true  },
    { id: 'f2', text: 'Notify PUB Flood Control Centre of water level readings',  agency: 'PUB',  required: true  },
    { id: 'f3', text: 'Contact Town Council to notify residents',                 agency: 'TC',   required: true  },
    { id: 'f4', text: 'Activate nearest evacuation centre via PA',                agency: 'PA',   required: true  },
    { id: 'f5', text: 'Alert SPF for cordon & traffic management',               agency: 'SPF',  required: true  },
    { id: 'f6', text: 'Issue public advisory via gov.sg / 938Live',              agency: 'MCI',  required: true  },
    { id: 'f7', text: 'Request Red Cross volunteers for evacuation support',      agency: 'SRC',  required: false },
    { id: 'f8', text: 'Pre-position ambulances near evacuation site',            agency: 'SCDF', required: false },
  ],
  medical:        [
    { id: 'm1', text: 'Dispatch nearest ambulance with paramedic team',           agency: 'SCDF',     required: true  },
    { id: 'm2', text: 'Alert receiving hospital A&E — give advance notification', agency: 'Hospital', required: true  },
    { id: 'm3', text: 'Send police if scene not secure',                          agency: 'SPF',      required: false },
    { id: 'm4', text: 'Request bystander CPR guidance via 995 operator',         agency: 'SCDF',     required: true  },
    { id: 'm5', text: 'Document patient handover at hospital',                    agency: 'SCDF',     required: true  },
  ],
  fire:           [
    { id: 'fi1', text: 'Dispatch fire engine + ladder platform to scene',         agency: 'SCDF',     required: true  },
    { id: 'fi2', text: 'Dispatch ambulances — standby for casualties',            agency: 'SCDF EMS', required: true  },
    { id: 'fi3', text: 'Alert SPF for road closures & crowd control',            agency: 'SPF',      required: true  },
    { id: 'fi4', text: 'Notify SP Group if gas/electrical lines at risk',        agency: 'SP Group', required: false },
    { id: 'fi5', text: 'Evacuate affected and surrounding buildings',            agency: 'SCDF/SPF', required: true  },
  ],
  road:           [
    { id: 'r1', text: 'Dispatch Traffic Police to scene',                        agency: 'SPF',      required: true  },
    { id: 'r2', text: 'Send ambulance if casualties reported',                   agency: 'SCDF EMS', required: true  },
    { id: 'r3', text: 'Alert LTA for expressway / arterial road advisory',       agency: 'LTA',      required: true  },
    { id: 'r4', text: 'Coordinate tow trucks for vehicle removal',              agency: 'LTA Ops',  required: false },
    { id: 'r5', text: 'Issue traffic diversion via One Motoring / 938Live',     agency: 'LTA/SPF',  required: true  },
  ],
  infrastructure: [
    { id: 'i1', text: 'Alert SCDF for structural hazard assessment',             agency: 'SCDF',     required: true  },
    { id: 'i2', text: 'Notify BCA for building safety certification',           agency: 'BCA',      required: true  },
    { id: 'i3', text: 'Evacuate affected building — establish safe perimeter',  agency: 'SCDF/SPF', required: true  },
    { id: 'i4', text: 'Alert SP Group if utilities at risk',                    agency: 'SP Group', required: false },
    { id: 'i5', text: 'Establish temporary housing via PA if needed',           agency: 'PA',       required: false },
  ],
  civil:          [
    { id: 'c1', text: 'Alert nearest SPF division — immediate dispatch',        agency: 'SPF',      required: true  },
    { id: 'c2', text: 'Request PRU if large-scale disturbance',                 agency: 'SPF PRU',  required: false },
    { id: 'c3', text: 'Seal off area — establish inner & outer cordon',         agency: 'SPF',      required: true  },
    { id: 'c4', text: 'Medical standby for casualties',                         agency: 'SCDF EMS', required: false },
  ],
  other:          [
    { id: 'o1', text: 'Assess incident type, severity and immediate risk',      agency: 'Ops',      required: true  },
    { id: 'o2', text: 'Deploy appropriate first responders',                    agency: 'SCDF/SPF', required: true  },
    { id: 'o3', text: 'Establish on-scene incident command',                    agency: 'IC',       required: true  },
    { id: 'o4', text: 'Update command centre every 15 min',                     agency: 'Ops',      required: true  },
  ],
};

const AI_RECOMMENDATIONS: Record<IncidentType, { action: string; confidence: number; resources: string }[]> = {
  flood:          [
    { action: 'Deploy SCDF pump trucks + rescue boat to site',  confidence: 92, resources: '2× pump trucks, 1× rescue boat' },
    { action: 'Activate Jurong West CC evacuation centre',       confidence: 85, resources: 'PA coordination, 20+ volunteers'  },
    { action: 'Issue zone-wide advisory via gov.sg',             confidence: 78, resources: 'MCI broadcast team'               },
  ],
  medical:        [
    { action: 'Dispatch ALS ambulance to scene immediately',     confidence: 95, resources: '1× ALS unit, 2 paramedics'       },
    { action: 'Pre-alert nearest A&E hospital for arrival',      confidence: 88, resources: 'MOH hospital coordinator'        },
    { action: 'Deploy community first aider if nearby',          confidence: 62, resources: 'myResponder app activation'      },
  ],
  fire:           [
    { action: 'Deploy 2× fire engines + ladder platform',       confidence: 94, resources: '2× fire engines, 1× ladder'      },
    { action: 'Evacuate building + 50m cordon',                 confidence: 89, resources: 'SCDF + SPF personnel'            },
    { action: 'Alert SP Group for utilities shut-off',          confidence: 71, resources: 'SP Group on-call technician'      },
  ],
  road:           [
    { action: 'Deploy Traffic Police to accident scene',        confidence: 91, resources: '2× TP officers, 1× vehicle'      },
    { action: 'Activate SCDF EMS if casualties reported',       confidence: 84, resources: '1× ambulance, paramedic team'    },
    { action: 'Issue LTA One Motoring diversion alert',         confidence: 77, resources: 'LTA traffic ops centre'          },
  ],
  infrastructure: [
    { action: 'Deploy SCDF for structural risk assessment',     confidence: 90, resources: 'SCDF hazmat + rescue team'       },
    { action: 'Evacuate building + establish safe perimeter',   confidence: 88, resources: 'SPF + SCDF personnel'           },
    { action: 'Notify BCA for certified inspection',           confidence: 82, resources: 'BCA qualified engineer'          },
  ],
  civil:          [
    { action: 'Deploy SPF rapid response unit immediately',     confidence: 93, resources: '4–6 SPF officers'               },
    { action: 'Seal inner + outer cordon around site',          confidence: 86, resources: 'SPF crowd control'              },
    { action: 'Place SCDF EMS on standby at perimeter',        confidence: 70, resources: '1× ambulance on standby'         },
  ],
  other:          [
    { action: 'Deploy first response assessment team',          confidence: 75, resources: 'SCDF/SPF first responders'       },
    { action: 'Establish incident command post at scene',       confidence: 68, resources: 'Incident commander + team'       },
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

function elapsedSec(d: string) {
  return Math.floor((Date.now() - new Date(d).getTime()) / 1000);
}

function fmtTimer(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${String(sec).padStart(2, '0')}s`;
  return `${sec}s`;
}

// ─── Ownership Chain ──────────────────────────────────────────────────────────

function OwnershipStep({
  icon, stepLabel, name, sub, time, filled, pulse,
}: {
  icon: React.ReactNode; stepLabel: string;
  name: string; sub: string; time?: string;
  filled: boolean; pulse?: boolean;
}) {
  return (
    <div className={`flex-1 px-4 py-3 border rounded-sm ${
      filled
        ? 'bg-navy-light border-navy-border'
        : 'bg-paper border-paper-border opacity-60'
    }`}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className={filled ? 'text-navy' : 'text-ink-muted'}>{icon}</span>
        <span className="text-[10px] font-mono font-bold text-ink-muted uppercase tracking-wider">{stepLabel}</span>
        {filled && pulse && (
          <span className="ml-auto w-2 h-2 bg-teal rounded-full animate-pulse" />
        )}
        {filled && !pulse && (
          <CheckCircle size={11} className="ml-auto text-teal" />
        )}
      </div>
      <p className={`text-sm font-semibold leading-snug ${filled ? 'text-ink' : 'text-ink-muted'}`}>{name}</p>
      <p className="text-xs text-ink-muted mt-0.5">{sub}</p>
      {time && <p className="text-[10px] text-ink-muted mt-1 font-mono">{time}</p>}
    </div>
  );
}

function OwnershipChain({ incident }: { incident: Incident }) {
  const hasReviewer = !!incident.assignedTo;
  const hasAssignee = !!incident.assignedTo;

  return (
    <div className="px-6 py-3 bg-white border-b border-paper-border">
      <p className="text-[10px] font-mono font-semibold text-ink-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <Users size={11} /> Ownership Chain
      </p>
      <div className="flex items-stretch gap-2">
        {/* Step 1: Reporter */}
        <OwnershipStep
          icon={<FileText size={13} />}
          stepLabel="Reported by"
          name={incident.reportedBy?.name || 'Public / Anonymous'}
          sub={
            incident.contactInfo
              ? incident.contactInfo
              : incident.reportedBy?.email || 'No contact info provided'
          }
          time={`Submitted ${timeAgo(incident.createdAt)}`}
          filled
        />

        <div className="flex items-center flex-shrink-0 text-paper-border">
          <ChevronRight size={14} className="text-ink-muted" />
        </div>

        {/* Step 2: Reviewer / Claimer */}
        <OwnershipStep
          icon={<Eye size={13} />}
          stepLabel="Reviewed by"
          name={hasReviewer ? incident.assignedTo!.name : 'Awaiting review'}
          sub={hasReviewer ? 'Claimed & reviewing' : 'Not yet claimed — needs a responder'}
          time={hasReviewer ? `Claimed ${timeAgo(incident.updatedAt)}` : undefined}
          filled={hasReviewer}
          pulse={!hasReviewer && incident.status === 'open'}
        />

        <div className="flex items-center flex-shrink-0 text-paper-border">
          <ChevronRight size={14} className="text-ink-muted" />
        </div>

        {/* Step 3: Assigned Responder */}
        <OwnershipStep
          icon={<User size={13} />}
          stepLabel="Assigned to"
          name={hasAssignee ? incident.assignedTo!.name : 'Not assigned'}
          sub={hasAssignee ? incident.assignedTo!.unit : 'Pending assignment'}
          time={hasAssignee ? `Unit: ${incident.assignedTo!.unit}` : undefined}
          filled={hasAssignee}
        />
      </div>
    </div>
  );
}

// ─── Status Stepper ───────────────────────────────────────────────────────────

function StatusStepper({
  current, onAdvance, isPending,
}: {
  current: IncidentStatus; onAdvance: (s: IncidentStatus) => void; isPending: boolean;
}) {
  const idx  = STATUS_FLOW.indexOf(current);
  const next = STATUS_FLOW[idx + 1];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {STATUS_FLOW.map((s, i) => {
        const done   = i < idx;
        const active = i === idx;
        const meta   = STATUS_META[s];
        return (
          <div key={s} className="flex items-center gap-1 flex-shrink-0">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-semibold border transition-all ${
              active  ? `${meta.bg} ${meta.color} ring-1 ring-offset-1 ring-current border-current` :
              done    ? 'bg-teal-light text-teal-dark border-teal' :
                        'bg-white text-ink-muted border-paper-border opacity-40'
            }`}>
              {done   && <CheckCircle size={9} />}
              {active && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
              {meta.label}
            </div>
            {i < STATUS_FLOW.length - 1 && (
              <ChevronRight size={10} className="text-paper-border" />
            )}
          </div>
        );
      })}

      {next && !['resolved', 'closed'].includes(current) && (
        <button
          onClick={() => onAdvance(next)}
          disabled={isPending}
          className="ml-2 flex items-center gap-1.5 px-3 py-1.5 bg-navy text-white text-xs font-semibold rounded-sm hover:bg-navy-dark disabled:opacity-50 transition-colors"
        >
          {isPending
            ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <><ChevronRight size={12} /> Advance to {STATUS_META[next].label}</>}
        </button>
      )}
      {current === 'resolved' && (
        <span className="ml-2 flex items-center gap-1 text-xs text-teal-dark font-semibold">
          <CheckCircle size={13} /> Resolved
        </span>
      )}
    </div>
  );
}

// ─── Assignment Panel ─────────────────────────────────────────────────────────

function AssignmentPanel({
  incident,
  currentUserId,
}: {
  incident: Incident;
  currentUserId: string | undefined;
}) {
  const [selectedId, setSelectedId] = useState('');
  const [assignedMsg, setAssignedMsg] = useState('');
  const { mutate: assignIncident, isPending } = useAssignIncident();
  const { mutate: claimIncident, isPending: isClaiming } = useClaimIncident();

  const handleAssign = () => {
    if (!selectedId) return;
    assignIncident(
      { id: incident.id, responderId: selectedId },
      {
        onSuccess: () => {
          const member = MOCK_TEAM.find(m => m.id === selectedId);
          setAssignedMsg(`Assigned to ${member?.name}`);
          setSelectedId('');
          setTimeout(() => setAssignedMsg(''), 3000);
        },
      }
    );
  };

  const handleClaim = () => {
    claimIncident(incident.id, {
      onSuccess: () => setAssignedMsg('You have claimed this incident'),
    });
  };

  const isAssignedToMe = incident.assignedTo?.id === currentUserId;

  return (
    <div className="bg-white border border-paper-border rounded-sm p-4">
      <h3 className="text-xs font-mono font-semibold text-ink-muted uppercase tracking-wider mb-3 flex items-center gap-2">
        <UserPlus size={12} /> Assignment
      </h3>

      {assignedMsg && (
        <div className="flex items-center gap-2 text-xs text-teal-dark bg-teal-light px-3 py-2 rounded-sm mb-3 border border-teal">
          <CheckCircle size={12} /> {assignedMsg}
        </div>
      )}

      {!incident.assignedTo ? (
        <div className="space-y-3">
          <p className="text-xs text-ink-muted">This incident is unassigned. Claim it yourself or assign to a team member.</p>
          <button
            onClick={handleClaim}
            disabled={isClaiming}
            className="w-full flex items-center justify-center gap-2 py-2 bg-teal text-white text-xs font-bold rounded-sm hover:bg-teal-dark disabled:opacity-50"
          >
            {isClaiming ? 'Claiming…' : <><UserPlus size={13} /> Claim Incident</>}
          </button>
          <div className="relative">
            <div className="absolute inset-x-0 top-1/2 h-px bg-paper-border" />
            <div className="relative flex justify-center">
              <span className="bg-white px-2 text-[10px] text-ink-muted">or assign to</span>
            </div>
          </div>
          <select
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
            className="w-full px-3 py-2 border border-paper-border rounded-sm text-xs focus:outline-none focus:ring-1 focus:ring-navy bg-white"
          >
            <option value="">— Select responder —</option>
            {MOCK_TEAM.map(m => (
              <option key={m.id} value={m.id}>{m.name} · {m.unit}</option>
            ))}
          </select>
          <button
            onClick={handleAssign}
            disabled={!selectedId || isPending}
            className="w-full flex items-center justify-center gap-2 py-2 bg-navy text-white text-xs font-semibold rounded-sm hover:bg-navy-dark disabled:opacity-40"
          >
            {isPending ? 'Assigning…' : 'Assign to Responder'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3 bg-teal-light border border-teal rounded-sm px-3 py-2.5">
            <div className="w-8 h-8 bg-navy text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
              {incident.assignedTo.name.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">{incident.assignedTo.name}</p>
              <p className="text-xs text-ink-muted">{incident.assignedTo.unit}</p>
            </div>
            {isAssignedToMe && (
              <span className="ml-auto text-[10px] font-bold text-teal-dark bg-teal px-2 py-0.5 rounded text-white">
                You
              </span>
            )}
          </div>
          <div>
            <p className="text-[10px] text-ink-muted mb-1">Reassign to different responder</p>
            <div className="flex gap-2">
              <select
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
                className="flex-1 px-2 py-1.5 border border-paper-border rounded-sm text-xs focus:outline-none focus:ring-1 focus:ring-navy bg-white"
              >
                <option value="">— Reassign to… —</option>
                {MOCK_TEAM.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              <button
                onClick={handleAssign}
                disabled={!selectedId || isPending}
                className="px-3 py-1.5 bg-navy text-white text-xs font-semibold rounded-sm hover:bg-navy-dark disabled:opacity-40"
              >
                {isPending ? '…' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Overview ────────────────────────────────────────────────────────────

function OverviewTab({ incident }: { incident: Incident }) {
  const sev = SEV_META[incident.severity] || SEV_META[3];

  return (
    <div className="p-5 space-y-5 overflow-y-auto h-full">
      {/* Key facts */}
      <div>
        <p className="text-[10px] font-mono font-semibold text-ink-muted uppercase tracking-wider mb-3">Incident Details</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { l: 'Ticket Number',  v: incident.ticketNumber,              },
            { l: 'Incident Type',  v: formatIncidentType(incident.type),  },
            { l: 'Severity',       v: `${sev.label} (Level ${incident.severity})` },
            { l: 'Current Status', v: STATUS_META[incident.status].label, },
            { l: 'Location',       v: incident.locationText,              },
            { l: 'Reported At',    v: formatDateTime(incident.createdAt), },
          ].map(f => (
            <div key={f.l} className="bg-paper rounded-sm p-3">
              <p className="text-[10px] text-ink-muted mb-0.5">{f.l}</p>
              <p className="text-xs font-semibold text-ink leading-snug">{f.v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Reporter contact */}
      {(incident.reportedBy || incident.contactInfo) && (
        <div className="bg-navy-light border border-navy-border rounded-sm p-4">
          <p className="text-[10px] font-mono font-semibold text-navy-mid uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Phone size={10} /> Reporter Contact Information
          </p>
          <div className="space-y-1.5 text-xs">
            {incident.reportedBy && (
              <div className="flex items-center gap-2">
                <User size={11} className="text-navy flex-shrink-0" />
                <span className="font-semibold text-ink">{incident.reportedBy.name}</span>
                <span className="text-ink-muted">({incident.reportedBy.email})</span>
              </div>
            )}
            {incident.contactInfo && (
              <div className="flex items-center gap-2">
                <Phone size={11} className="text-navy flex-shrink-0" />
                <span className="text-ink">{incident.contactInfo}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Description */}
      <div>
        <p className="text-[10px] font-mono font-semibold text-ink-muted uppercase tracking-wider mb-2">Description</p>
        <p className="text-sm text-ink leading-relaxed bg-paper rounded-sm p-3 border border-paper-border">
          {incident.description || 'No description provided.'}
        </p>
      </div>

      {/* Response health */}
      <div>
        <p className="text-[10px] font-mono font-semibold text-ink-muted uppercase tracking-wider mb-2">Response Health</p>
        <div className="space-y-2">
          {[
            {
              label: 'Response target',
              value: incident.severity === 1 ? '< 5 min' : incident.severity === 2 ? '< 10 min' : '< 20 min',
              ok: true,
            },
            {
              label: 'Time since report',
              value: timeAgo(incident.createdAt),
              ok: incident.status !== 'open' || !!incident.assignedTo,
            },
            {
              label: 'Ownership',
              value: incident.assignedTo ? `${incident.assignedTo.name} (${incident.assignedTo.unit})` : 'Not assigned',
              ok: !!incident.assignedTo,
            },
            {
              label: 'AI Triage',
              value: incident.aiTriageData ? `Complete · Option ${incident.approvedOption || 'pending approval'}` : 'Not yet run',
              ok: !!incident.aiTriageData,
            },
          ].map(r => (
            <div key={r.label} className="flex items-center justify-between text-xs bg-paper rounded-sm px-3 py-2">
              <span className="text-ink-muted">{r.label}</span>
              <div className="flex items-center gap-1.5">
                <span className={`font-semibold ${r.ok ? 'text-teal-dark' : 'text-red-dark'}`}>{r.value}</span>
                {r.ok
                  ? <CheckCircle size={11} className="text-teal" />
                  : <AlertCircle size={11} className="text-red" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Coordination (Agencies + Checklist) ─────────────────────────────────

function CoordinationTab({ incident }: { incident: Incident }) {
  const agencies  = INCIDENT_AGENCIES[incident.type] || [];
  const checklist = INCIDENT_CHECKLISTS[incident.type] || [];
  const [contacted, setContacted] = useState<Set<string>>(new Set());
  const [checked,   setChecked]   = useState<Record<string, boolean>>({});
  const checkedCount = Object.values(checked).filter(Boolean).length;

  return (
    <div className="overflow-y-auto h-full p-5 space-y-6">
      {/* Agencies */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-mono font-semibold text-ink-muted uppercase tracking-wider flex items-center gap-1.5">
            <Radio size={11} /> Agency Coordination
          </p>
          <span className={`text-[10px] font-bold ${contacted.size === agencies.length ? 'text-teal-dark' : 'text-amber-dark'}`}>
            {contacted.size}/{agencies.length} alerted
          </span>
        </div>

        <div className="h-1 bg-paper-border rounded-full mb-3 overflow-hidden">
          <div
            className="h-full bg-teal rounded-full transition-all"
            style={{ width: `${agencies.length > 0 ? (contacted.size / agencies.length) * 100 : 0}%` }}
          />
        </div>

        <div className="space-y-2">
          {agencies.map(ag => {
            const done = contacted.has(ag.name);
            return (
              <div key={ag.name} className={`flex items-center justify-between border rounded-sm px-4 py-3 ${
                done ? 'bg-teal-light border-teal' : 'bg-white border-paper-border'
              }`}>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-ink">{ag.name}</p>
                    {done && <CheckCircle size={12} className="text-teal" />}
                  </div>
                  <p className="text-xs text-ink-muted">{ag.role}</p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${ag.contact.replace(/\s/g, '')}`}
                    onClick={e => e.stopPropagation()}
                    className="flex items-center gap-1 px-2 py-1 border border-paper-border rounded text-[10px] hover:bg-paper-hover"
                  >
                    <Phone size={10} /> {ag.contact}
                  </a>
                  <button
                    onClick={() =>
                      setContacted(prev => {
                        const next = new Set(prev);
                        next.has(ag.name) ? next.delete(ag.name) : next.add(ag.name);
                        return next;
                      })
                    }
                    className={`px-3 py-1 rounded text-[10px] font-bold transition-colors ${
                      done
                        ? 'bg-paper border border-paper-border text-ink-muted'
                        : 'bg-teal text-white hover:bg-teal-dark'
                    }`}
                  >
                    {done ? 'Undo' : '✓ Alerted'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Checklist */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-mono font-semibold text-ink-muted uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle size={11} /> Action Checklist
          </p>
          <span className={`text-[10px] font-bold ${checkedCount === checklist.length ? 'text-teal-dark' : 'text-ink-muted'}`}>
            {checkedCount}/{checklist.length}
          </span>
        </div>

        <div className="h-1 bg-paper-border rounded-full mb-3 overflow-hidden">
          <div
            className="h-full bg-teal rounded-full transition-all"
            style={{ width: `${checklist.length > 0 ? (checkedCount / checklist.length) * 100 : 0}%` }}
          />
        </div>

        <div className="space-y-1.5">
          {checklist.map(item => (
            <label
              key={item.id}
              className={`flex items-start gap-3 px-3 py-2.5 rounded-sm cursor-pointer transition-colors border ${
                checked[item.id]
                  ? 'bg-teal-light border-teal'
                  : 'bg-white border-paper-border hover:bg-paper-hover'
              }`}
            >
              <input
                type="checkbox"
                checked={!!checked[item.id]}
                onChange={e => setChecked(p => ({ ...p, [item.id]: e.target.checked }))}
                className="mt-0.5 accent-teal flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className={`text-xs leading-snug ${checked[item.id] ? 'line-through text-ink-muted' : 'text-ink'}`}>
                  {item.text}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-ink-muted">{item.agency}</span>
                  {item.required && (
                    <span className="text-[10px] font-bold text-red">Required</span>
                  )}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tab: AI Triage ───────────────────────────────────────────────────────────

function AITriageTab({ incident }: { incident: Incident }) {
  const [ran, setRan]       = useState(false);
  const [loading, setLoad]  = useState(false);
  const [approved, setApproved] = useState<number | null>(incident.approvedOption);
  const { mutate: approveIncident, isPending } = useApproveIncident(incident.id);

  const recs = AI_RECOMMENDATIONS[incident.type] || [];

  const handleRun = () => {
    setLoad(true);
    setTimeout(() => { setLoad(false); setRan(true); }, 2000);
  };

  const handleApprove = (rank: number) => {
    approveIncident(rank, { onSuccess: () => setApproved(rank) });
  };

  const hasData = incident.aiTriageData || ran;

  return (
    <div className="p-5 overflow-y-auto h-full space-y-5">
      {!hasData && !loading && (
        <div className="text-center py-10 bg-paper border border-paper-border rounded-sm">
          <Zap size={32} className="text-navy mx-auto mb-3 opacity-30" />
          <p className="text-sm font-semibold text-ink mb-1">AI Triage Not Run</p>
          <p className="text-xs text-ink-muted mb-5 max-w-xs mx-auto">
            Run AI triage to receive ranked response recommendations based on incident data, resource availability, and historical patterns.
          </p>
          <button
            onClick={handleRun}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-navy text-white text-sm font-semibold rounded-sm hover:bg-navy-dark mx-auto"
          >
            <Zap size={14} /> Run AI Triage
          </button>
        </div>
      )}

      {loading && (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-navy mb-3" />
          <p className="text-sm text-ink-muted">Analysing incident data…</p>
          <p className="text-xs text-ink-muted mt-1">Cross-referencing historical incidents + resource availability</p>
        </div>
      )}

      {hasData && !loading && (
        <>
          <div className="flex items-center gap-2 bg-teal-light border border-teal rounded-sm px-3 py-2.5">
            <CheckCircle size={13} className="text-teal flex-shrink-0" />
            <p className="text-xs font-semibold text-teal-dark">
              AI Triage Complete · {incident.severity === 1 ? '91' : incident.severity === 2 ? '82' : '71'}% confidence
            </p>
            {approved !== null && (
              <span className="ml-auto text-[10px] font-bold text-teal-dark bg-teal text-white px-2 py-0.5 rounded">
                Option {approved} approved
              </span>
            )}
          </div>

          <div>
            <p className="text-[10px] font-mono font-semibold text-ink-muted uppercase tracking-wider mb-3">
              Recommended Actions
            </p>
            <div className="space-y-3">
              {(incident.aiTriageData?.options || recs).map((rec: any, i: number) => {
                const rank       = (rec.rank ?? i + 1) as number;
                const action     = rec.action || rec.action;
                const confidence = rec.confidence;
                const resources  = rec.resources_required?.join(', ') || rec.resources;
                const isApproved = approved === rank;

                return (
                  <div
                    key={i}
                    className={`border rounded-sm p-4 ${
                      isApproved ? 'border-teal bg-teal-light' : 'border-paper-border bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        isApproved ? 'bg-teal text-white' : 'bg-navy text-white'
                      }`}>
                        {rank}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-ink">{action}</p>
                        {resources && (
                          <p className="text-xs text-ink-muted mt-0.5 flex items-center gap-1">
                            <Truck size={10} /> {resources}
                          </p>
                        )}
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-[10px] mb-1">
                            <span className="text-ink-muted">Confidence</span>
                            <span className={`font-bold ${confidence >= 80 ? 'text-teal-dark' : 'text-amber-dark'}`}>
                              {confidence}%
                            </span>
                          </div>
                          <div className="h-1 bg-paper-border rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${confidence >= 80 ? 'bg-teal' : 'bg-amber'}`}
                              style={{ width: `${confidence}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      {!isApproved && approved === null && (
                        <button
                          onClick={() => handleApprove(rank)}
                          disabled={isPending}
                          className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 bg-teal text-white text-[10px] font-bold rounded hover:bg-teal-dark disabled:opacity-50"
                        >
                          <ThumbsUp size={10} /> Approve
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-mono font-semibold text-ink-muted uppercase tracking-wider mb-3">
              Resource Estimates
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { l: 'Est. Response Time', v: incident.severity === 1 ? '4–6 min' : incident.severity === 2 ? '8–12 min' : '15–20 min' },
                { l: 'Personnel Needed',   v: incident.severity === 1 ? '8–12'    : incident.severity === 2 ? '4–6'      : '2–4'       },
                { l: 'Vehicles Required',  v: incident.severity === 1 ? '3–4'     : incident.severity === 2 ? '2'        : '1'         },
                { l: 'Est. Resolution',    v: incident.severity === 1 ? '2–4 hrs' : incident.severity === 2 ? '1–2 hrs'  : '30–60 min' },
              ].map(r => (
                <div key={r.l} className="bg-paper border border-paper-border rounded-sm p-3 text-center">
                  <p className="text-[10px] text-ink-muted mb-0.5">{r.l}</p>
                  <p className="text-sm font-bold text-ink">{r.v}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-ink-muted bg-paper-hover rounded-sm p-3 leading-relaxed">
            AI recommendations are based on historical incident patterns and current resource availability.
            Final decisions remain with the duty commander.
          </p>
        </>
      )}
    </div>
  );
}

// ─── Tab: Timeline ────────────────────────────────────────────────────────────

function TimelineTab({
  incident,
  timeline,
  notes,
}: {
  incident: Incident;
  timeline: any[];
  notes: { text: string; time: string; author: string }[];
}) {
  const all = [
    {
      type: 'create',
      label: 'Incident reported',
      sub: incident.reportedBy
        ? `Submitted by ${incident.reportedBy.name} via Public Portal`
        : 'Incident created by system',
      time: incident.createdAt,
    },
    ...(incident.assignedTo ? [{
      type: 'assign',
      label: `Claimed by ${incident.assignedTo.name}`,
      sub: `Unit: ${incident.assignedTo.unit}`,
      time: incident.updatedAt,
    }] : []),
    ...timeline.map(t => ({
      type: t.updateType || 'note',
      label: t.content,
      sub: t.author ? `${t.author.name} · ${t.author.role}` : 'System',
      time: t.createdAt,
    })),
    ...notes.map(n => ({
      type: 'note',
      label: n.text,
      sub: `Field note by ${n.author}`,
      time: n.time,
    })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  const DOT: Record<string, string> = {
    create:        'bg-navy',
    assign:        'bg-teal',
    status_change: 'bg-amber',
    dispatch:      'bg-teal',
    note:          'bg-ink-muted',
    field_update:  'bg-purple-500',
  };

  return (
    <div className="p-5 overflow-y-auto h-full">
      <p className="text-[10px] font-mono font-semibold text-ink-muted uppercase tracking-wider mb-4">
        {all.length} event{all.length !== 1 ? 's' : ''} · Most recent first
      </p>
      <div className="space-y-0">
        {all.map((entry, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${DOT[entry.type] || 'bg-ink-muted'}`} />
              {i < all.length - 1 && <div className="w-px flex-1 bg-paper-border mt-1" />}
            </div>
            <div className="flex-1 pb-4">
              <p className="text-xs font-semibold text-ink">{entry.label}</p>
              <p className="text-[11px] text-ink-muted mt-0.5">{entry.sub}</p>
              <p className="text-[10px] text-ink-muted font-mono mt-1">{formatDateTime(entry.time)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Notes Thread ─────────────────────────────────────────────────────────────

function NotesThread({
  incidentId,
  onNote,
}: {
  incidentId: string;
  onNote: (text: string, author: string) => void;
}) {
  const [text, setText] = useState('');
  const user = authStore(s => s.user);
  const { mutate: addUpdate, isPending } = useAddIncidentUpdate(incidentId);

  const submit = () => {
    if (!text.trim()) return;
    addUpdate(text, {
      onSuccess: () => {
        onNote(text, user?.fullName || 'Operator');
        setText('');
      },
    });
  };

  return (
    <div className="bg-white border border-paper-border rounded-sm p-4">
      <h3 className="text-xs font-mono font-semibold text-ink-muted uppercase tracking-wider mb-3 flex items-center gap-2">
        <Edit3 size={12} /> Field Notes
      </h3>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), submit())}
        rows={2}
        placeholder="Log an update, observation, or note…"
        className="w-full px-3 py-2 border border-paper-border rounded-sm text-xs resize-none focus:outline-none focus:ring-1 focus:ring-navy"
      />
      <button
        onClick={submit}
        disabled={!text.trim() || isPending}
        className="mt-2 w-full flex items-center justify-center gap-2 py-2 bg-navy text-white text-xs font-semibold rounded-sm hover:bg-navy-dark disabled:opacity-40"
      >
        {isPending ? 'Saving…' : <><Send size={11} /> Save Note</>}
      </button>
    </div>
  );
}

// ─── Main TicketDetail ────────────────────────────────────────────────────────

export function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = authStore(s => s.user);
  const canAssign = user?.role === 'supervisor' || user?.role === 'gov_admin';

  const { data, isLoading, error, refetch } = useIncident(id!);
  const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdateIncidentStatus(id!);

  const [activeTab, setActiveTab] = useState<'overview' | 'coordination' | 'ai' | 'timeline'>('overview');
  const [elapsed, setElapsed] = useState(0);
  const [localNotes, setLocalNotes] = useState<{ text: string; time: string; author: string }[]>([]);

  const incident = data?.incident;
  const timeline = data?.timeline || [];

  // Live timer
  useEffect(() => {
    if (!incident) return;
    const base = new Date(incident.createdAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - base) / 1000));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [incident?.createdAt]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-navy mb-3" />
          <p className="text-sm text-ink-muted">Loading incident…</p>
        </div>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="p-6">
        <div className="bg-red-light border border-red rounded-sm p-4 max-w-lg">
          <p className="text-sm font-semibold text-red-dark mb-1">Could not load incident</p>
          <button onClick={() => refetch()} className="text-xs text-red underline">Retry</button>
        </div>
      </div>
    );
  }

  const sev  = SEV_META[incident.severity]  || SEV_META[3];
  const curIdx   = STATUS_FLOW.indexOf(incident.status);

  const TABS = [
    { id: 'overview'     as const, label: 'Overview',     icon: <Eye       size={12} /> },
    { id: 'coordination' as const, label: 'Coordination', icon: <Radio     size={12} /> },
    { id: 'ai'           as const, label: 'AI Triage',    icon: <Zap       size={12} /> },
    { id: 'timeline'     as const, label: 'Timeline',     icon: <FileText  size={12} /> },
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-paper">

      {/* ── Top bar ── */}
      <div className={`bg-white border-b border-paper-border px-5 py-3 flex-shrink-0 ${
        incident.severity === 1 ? 'border-t-2 border-t-red' : ''
      }`}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Left: nav + title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate('/responder')}
              className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink flex-shrink-0"
            >
              <ArrowLeft size={15} /> Queue
            </button>
            <span className="text-ink-muted">·</span>
            <span className="font-mono font-bold text-ink text-sm">{incident.ticketNumber}</span>
            <span className="text-ink-muted hidden sm:block">·</span>
            <span className="font-semibold text-ink text-sm truncate hidden sm:block max-w-xs">
              {incident.title}
            </span>
          </div>

          {/* Right: badges + timer */}
          <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
            <StatusBadge status={incident.status} />
            <span className={`text-[10px] font-bold px-2 py-1 rounded border ${sev.bg} ${sev.color} ${sev.border}`}>
              SEV {incident.severity} · {sev.label}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-ink-muted bg-paper px-3 py-1.5 border border-paper-border rounded font-mono">
              <Clock size={11} /> {fmtTimer(elapsed)}
            </div>
            <button
              onClick={() => refetch()}
              className="p-1.5 text-ink-muted hover:text-ink border border-paper-border rounded hover:bg-paper-hover"
            >
              <RefreshCw size={13} />
            </button>
          </div>
        </div>

        {/* Status stepper */}
        <div className="mt-3 flex items-center gap-2">
          <StatusStepper
            current={incident.status}
            onAdvance={s => updateStatus(s)}
            isPending={isUpdatingStatus}
          />
        </div>
      </div>

      {/* ── Ownership chain ── */}
      <OwnershipChain incident={incident} />

      {/* ── Main content: Left + Right ── */}
      <div className="flex-1 overflow-hidden flex gap-0">

        {/* Left panel (320px) */}
        <div className="w-80 flex-shrink-0 border-r border-paper-border bg-white flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Incident brief */}
            <div>
              <p className="text-[10px] font-mono font-semibold text-ink-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                {TYPE_ICONS[incident.type]} {formatIncidentType(incident.type)}
              </p>
              <p className="text-sm font-semibold text-ink leading-snug mb-2">{incident.title}</p>
              <div className="flex items-center gap-1.5 text-xs text-ink-muted mb-1.5">
                <MapPin size={11} />{incident.locationText}
              </div>
              <p className="text-xs text-ink leading-relaxed bg-paper p-2.5 rounded border border-paper-border line-clamp-4">
                {incident.description || 'No description.'}
              </p>
            </div>

            {/* Reporter */}
            {(incident.reportedBy || incident.contactInfo) && (
              <div className="bg-navy-light border border-navy-border rounded-sm p-3">
                <p className="text-[10px] font-mono font-semibold text-navy-mid uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Phone size={9} /> Reporter
                </p>
                <p className="text-xs font-semibold text-ink">{incident.reportedBy?.name || 'Public'}</p>
                {incident.contactInfo && (
                  <p className="text-xs text-ink-muted mt-0.5">{incident.contactInfo}</p>
                )}
              </div>
            )}

            {/* Assignment (always shown) */}
            {(canAssign || !incident.assignedTo) && (
              <AssignmentPanel incident={incident} currentUserId={user?.id} />
            )}
            {!canAssign && incident.assignedTo && (
              <div className="bg-paper border border-paper-border rounded-sm p-3">
                <p className="text-[10px] font-mono font-semibold text-ink-muted uppercase tracking-wider mb-2">Assigned To</p>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-navy text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {incident.assignedTo.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-ink">{incident.assignedTo.name}</p>
                    <p className="text-[10px] text-ink-muted">{incident.assignedTo.unit}</p>
                  </div>
                  {incident.assignedTo.id === user?.id && (
                    <span className="ml-auto text-[9px] font-bold text-white bg-teal px-1.5 py-0.5 rounded">YOU</span>
                  )}
                </div>
              </div>
            )}

            {/* Notes input */}
            <NotesThread
              incidentId={incident.id}
              onNote={(text, author) =>
                setLocalNotes(prev => [...prev, { text, time: new Date().toISOString(), author }])
              }
            />
          </div>
        </div>

        {/* Right panel: tabbed content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-paper-border bg-white flex-shrink-0">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-navy text-navy bg-white'
                    : 'border-transparent text-ink-muted hover:text-ink'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'overview'     && <OverviewTab     incident={incident} />}
            {activeTab === 'coordination' && <CoordinationTab incident={incident} />}
            {activeTab === 'ai'           && <AITriageTab     incident={incident} />}
            {activeTab === 'timeline'     && (
              <TimelineTab
                incident={incident}
                timeline={timeline}
                notes={localNotes}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}