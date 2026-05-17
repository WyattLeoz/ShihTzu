import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useIncidents, useCreateIncident } from '../../api/incidents';
import { useHospitals, useVolunteers, useVolunteerTasks, useSignUpForTask } from '../../api/resources';
import { useBroadcasts } from '../../api/broadcasts';
import { StatusBadge } from '../../components/StatusBadge';
import { formatIncidentType, formatSeverity, getSeverityBorderColor } from '../../lib/formatters';
import {
  IncidentListItem, Hospital, Volunteer, Broadcast,
  IncidentType, VolunteerTask,
} from '../../types';
import {
  MapPin, Clock, Phone, Bed, Activity, UserCheck,
  AlertTriangle, Plus, Send, X, Navigation, UserPlus,
  Building2, Heart, Droplets, Users, CheckCircle,
} from 'lucide-react';
import { VolunteerRegistration } from './VolunteerRegistration';
import { Badge } from '../../components/Badge';

// ─── Public Portal Shell ──────────────────────────────────────────────────────

export function PublicPortal() {
  const [activeTab, setActiveTab] = useState<'incidents' | 'resources' | 'broadcasts' | 'volunteer'>('incidents');
  const [resourceTab, setResourceTab] = useState<'hospitals' | 'volunteers'>('hospitals');
  const [showReportForm, setShowReportForm] = useState(false);
  const [showVolunteerForm, setShowVolunteerForm] = useState(false);

  const { data: incidentsData, isLoading: incidentsLoading, error: incidentsError } = useIncidents({ limit: 20 });
  const { data: hospitalsData, isLoading: hospitalsLoading, error: hospitalsError } = useHospitals();
  const { data: volunteersData, isLoading: volunteersLoading, error: volunteersError } = useVolunteers();
  const { data: broadcastsData, isLoading: broadcastsLoading, error: broadcastsError } = useBroadcasts({ limit: 20 });
  const { data: tasksData, isLoading: tasksLoading } = useVolunteerTasks();

  const incidents  = incidentsData?.incidents   || [];
  const hospitals  = hospitalsData?.hospitals   || [];
  const volunteers = volunteersData?.volunteers || [];
  const broadcasts = broadcastsData?.broadcasts || [];
  const tasks      = tasksData?.tasks           || [];

  const tabs: { id: typeof activeTab; label: string }[] = [
    { id: 'incidents',  label: 'Incidents'  },
    { id: 'resources',  label: 'Resources'  },
    { id: 'broadcasts', label: 'Broadcasts' },
    { id: 'volunteer',  label: 'Volunteer'  },
  ];

  return (
    <div className="min-h-screen bg-paper max-w-md mx-auto border-x border-paper-border">
      {/* Header */}
      <div className="h-12 bg-white border-b border-paper-border flex items-center justify-between px-4 sticky top-0 z-20">
        <h1 className="font-semibold text-ink">QuickAid</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowVolunteerForm(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-navy text-white text-sm rounded-sm hover:bg-navy-dark transition-colors"
          >
            <UserPlus size={14} />
            Volunteer
          </button>
          <button
            onClick={() => setShowReportForm(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-teal text-white text-sm rounded-sm hover:bg-teal-dark transition-colors"
          >
            <Plus size={14} />
            Report
          </button>
          <Link to="/login" className="text-sm text-teal hover:text-teal-dark">
            Login
          </Link>
        </div>
      </div>

      {/* Modals */}
      {showReportForm && (
        <IncidentReportForm onClose={() => setShowReportForm(false)} />
      )}
      {showVolunteerForm && (
        <VolunteerRegistration
          onClose={() => setShowVolunteerForm(false)}
          onSuccess={() => setShowVolunteerForm(false)}
        />
      )}

      {/* Main Tabs */}
      <div className="bg-white border-b border-paper-border sticky top-12 z-10">
        <div className="flex">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-teal border-b-2 border-teal'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'incidents' && (
          <IncidentsList incidents={incidents} isLoading={incidentsLoading} error={incidentsError} />
        )}
        {activeTab === 'resources' && (
          <ResourcesSection
            resourceTab={resourceTab}
            setResourceTab={setResourceTab}
            hospitals={hospitals}
            volunteers={volunteers}
            hospitalsLoading={hospitalsLoading}
            volunteersLoading={volunteersLoading}
            hospitalsError={hospitalsError}
            volunteersError={volunteersError}
          />
        )}
        {activeTab === 'broadcasts' && (
          <BroadcastsList broadcasts={broadcasts} isLoading={broadcastsLoading} error={broadcastsError} />
        )}
        {activeTab === 'volunteer' && (
          <VolunteerTaskBoard tasks={tasks} isLoading={tasksLoading} />
        )}
      </div>
    </div>
  );
}

// ─── Incidents List ───────────────────────────────────────────────────────────

function IncidentsList({ incidents, isLoading, error }: {
  incidents: IncidentListItem[];
  isLoading: boolean;
  error: any;
}) {
  if (isLoading) return <LoadingSpinner label="Loading incidents…" />;
  if (error)     return <ErrorMessage message="Error loading incidents" />;
  if (incidents.length === 0) return (
    <div className="text-center py-8">
      <AlertTriangle className="mx-auto h-12 w-12 text-ink-muted mb-2" />
      <p className="text-ink-muted">No incidents reported</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {incidents.map(incident => (
        <div
          key={incident.id}
          className={`bg-white border border-paper-border rounded-sm p-4 ${getSeverityBorderColor(incident.severity)}`}
        >
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-medium text-ink text-sm">{incident.title}</h3>
            <StatusBadge status={incident.status} />
          </div>
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center gap-2 text-ink-muted">
              <MapPin size={13} />
              <span className="truncate">{incident.locationText}</span>
            </div>
            <div className="flex items-center gap-2 text-ink-muted">
              <Clock size={13} />
              <span>{new Date(incident.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs px-2 py-0.5 bg-paper-border text-ink-muted rounded">
                {formatIncidentType(incident.type)}
              </span>
              <span className="text-xs px-2 py-0.5 bg-paper-border text-ink-muted rounded">
                {formatSeverity(incident.severity)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Resources Section ────────────────────────────────────────────────────────

function ResourcesSection({
  resourceTab, setResourceTab,
  hospitals, volunteers,
  hospitalsLoading, volunteersLoading,
  hospitalsError, volunteersError,
}: {
  resourceTab: 'hospitals' | 'volunteers';
  setResourceTab: (tab: 'hospitals' | 'volunteers') => void;
  hospitals: Hospital[];
  volunteers: Volunteer[];
  hospitalsLoading: boolean;
  volunteersLoading: boolean;
  hospitalsError: any;
  volunteersError: any;
}) {
  return (
    <div>
      <div className="flex gap-2 mb-4">
        {(['hospitals', 'volunteers'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setResourceTab(tab)}
            className={`flex-1 py-2 text-sm font-medium rounded-sm transition-colors capitalize ${
              resourceTab === tab
                ? 'bg-teal text-white'
                : 'bg-white text-ink hover:bg-paper-hover border border-paper-border'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      {resourceTab === 'hospitals' ? (
        <HospitalsList hospitals={hospitals} isLoading={hospitalsLoading} error={hospitalsError} />
      ) : (
        <VolunteersList volunteers={volunteers} isLoading={volunteersLoading} error={volunteersError} />
      )}
    </div>
  );
}

function HospitalsList({ hospitals, isLoading, error }: {
  hospitals: Hospital[];
  isLoading: boolean;
  error: any;
}) {
  if (isLoading) return <LoadingSpinner label="Loading hospitals…" />;
  if (error)     return <ErrorMessage message="Error loading hospitals" />;
  if (hospitals.length === 0) return <p className="text-center py-8 text-ink-muted">No hospitals available</p>;

  return (
    <div className="space-y-3">
      {hospitals.map(hospital => {
        const pct = hospital.totalBeds > 0
          ? (hospital.availableBeds / hospital.totalBeds) * 100
          : 0;
        const barColor = pct > 30 ? 'bg-teal' : pct > 10 ? 'bg-amber' : 'bg-red';
        return (
          <div key={hospital.id} className="bg-white border border-paper-border rounded-sm p-4">
            <h3 className="font-medium text-ink text-sm mb-2">{hospital.name}</h3>
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center justify-between text-ink-muted">
                <span className="flex items-center gap-2"><Bed size={13} /> Beds</span>
                <span className="text-ink font-medium">{hospital.availableBeds}/{hospital.totalBeds}</span>
              </div>
              <div className="h-1.5 bg-paper-border rounded-full overflow-hidden">
                <div className={`h-full ${barColor} rounded-full`} style={{ width: `${pct}%` }} />
              </div>
              <div className="flex items-center justify-between text-ink-muted">
                <span className="flex items-center gap-2"><Activity size={13} /> ICU Available</span>
                <span className="text-ink font-medium">{hospital.icuAvailable}</span>
              </div>
              <div className="flex items-center justify-between text-ink-muted">
                <span>Trauma Bays</span>
                <span className="text-ink font-medium">{hospital.traumaBays}</span>
              </div>
              <p className="text-xs text-ink-muted pt-1">{hospital.address}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function VolunteersList({ volunteers, isLoading, error }: {
  volunteers: Volunteer[];
  isLoading: boolean;
  error: any;
}) {
  if (isLoading) return <LoadingSpinner label="Loading volunteers…" />;
  if (error)     return <ErrorMessage message="Error loading volunteers" />;
  if (volunteers.length === 0) return <p className="text-center py-8 text-ink-muted">No volunteers listed</p>;

  return (
    <div className="space-y-3">
      {volunteers.map(volunteer => (
        <div
          key={volunteer.id}
          className={`bg-white border border-paper-border rounded-sm p-4 ${
            volunteer.isAvailable ? 'border-l-4 border-l-teal' : ''
          }`}
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-medium text-ink text-sm">{volunteer.fullName}</h3>
              <div className="flex items-center gap-2 text-xs text-ink-muted mt-0.5">
                <Phone size={12} />
                <span>{volunteer.phone}</span>
              </div>
            </div>
            <span className={`text-xs px-2 py-1 rounded-sm ${
              volunteer.isAvailable
                ? 'bg-teal-light text-teal-dark'
                : 'bg-paper-border text-ink-muted'
            }`}>
              {volunteer.isAvailable ? 'Available' : 'Unavailable'}
            </span>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {volunteer.skills.map(skill => (
              <span key={skill} className="text-xs px-2 py-0.5 bg-paper-border text-ink-muted rounded">
                {skill.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Broadcasts List ──────────────────────────────────────────────────────────

function BroadcastsList({ broadcasts, isLoading, error }: {
  broadcasts: Broadcast[];
  isLoading: boolean;
  error: any;
}) {
  if (isLoading) return <LoadingSpinner label="Loading broadcasts…" />;
  if (error)     return <ErrorMessage message="Error loading broadcasts" />;
  if (broadcasts.length === 0) return (
    <div className="text-center py-8">
      <AlertTriangle className="mx-auto h-12 w-12 text-ink-muted mb-2" />
      <p className="text-ink-muted">No broadcasts available</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {broadcasts.map(broadcast => (
        <div key={broadcast.id} className="bg-white border border-paper-border rounded-sm p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-medium text-ink text-sm">{broadcast.title}</h3>
            <span className="text-xs px-2 py-0.5 bg-amber-light text-amber-dark rounded">
              {broadcast.audience.toUpperCase()}
            </span>
          </div>
          <p className="text-sm text-ink-muted mb-2">{broadcast.message}</p>
          <div className="flex items-center gap-2 text-xs text-ink-muted">
            <span>By: {broadcast.sentBy.name}</span>
            <span>·</span>
            <span>{new Date(broadcast.createdAt).toLocaleString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Volunteer Task Board ─────────────────────────────────────────────────────

const URGENCY_STYLES: Record<string, string> = {
  critical: 'bg-red-light text-red-dark border-red',
  high:     'bg-amber-light text-amber-dark border-amber',
  medium:   'bg-navy-light text-navy-mid border-navy-border',
  low:      'bg-paper-border text-ink-muted border-paper-border',
};

const ORG_TYPE_ICONS: Record<string, React.ReactNode> = {
  government: <Building2 size={13} className="text-navy-mid" />,
  ngo:        <Heart     size={13} className="text-red" />,
  healthcare: <Activity  size={13} className="text-teal" />,
  community:  <Users     size={13} className="text-amber" />,
};

function VolunteerTaskBoard({ tasks, isLoading }: { tasks: VolunteerTask[]; isLoading: boolean }) {
  const [selectedTask, setSelectedTask] = useState<VolunteerTask | null>(null);

  if (isLoading) return <LoadingSpinner label="Loading tasks…" />;
  if (tasks.length === 0) return (
    <div className="text-center py-8">
      <UserCheck className="mx-auto h-12 w-12 text-ink-muted mb-2" />
      <p className="text-ink-muted">No volunteer tasks right now</p>
    </div>
  );

  return (
    <div className="space-y-3">
      <p className="text-xs text-ink-muted">
        {tasks.length} task{tasks.length !== 1 ? 's' : ''} available — tap to sign up
      </p>
      {tasks.map(task => {
        const slotsLeft  = task.slotsTotal - task.slotsFilled;
        const fillPct    = Math.round((task.slotsFilled / task.slotsTotal) * 100);
        const urgStyle   = URGENCY_STYLES[task.urgency] || URGENCY_STYLES.low;

        return (
          <div
            key={task.id}
            onClick={() => setSelectedTask(task)}
            className={`bg-white border rounded-sm p-4 cursor-pointer hover:bg-paper-hover transition-colors ${urgStyle.split(' ')[2]}`}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-medium text-ink text-sm leading-snug">{task.title}</h3>
              <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded border uppercase ${urgStyle}`}>
                {task.urgency}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-ink-muted mb-2">
              {ORG_TYPE_ICONS[task.orgType]}
              <span>{task.organization}</span>
            </div>

            <div className="space-y-1 text-xs text-ink-muted mb-3">
              <div className="flex items-center gap-1.5"><MapPin size={11} />{task.location}</div>
              <div className="flex items-center gap-1.5"><Clock  size={11} />{task.date} · {task.timeSlot}</div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-ink-muted">{task.slotsFilled}/{task.slotsTotal} slots filled</span>
                <span className={`text-xs font-semibold ${slotsLeft === 0 ? 'text-red' : 'text-teal-dark'}`}>
                  {slotsLeft === 0 ? 'Full' : `${slotsLeft} left`}
                </span>
              </div>
              <div className="h-1.5 bg-paper-border rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${fillPct >= 90 ? 'bg-red' : fillPct >= 60 ? 'bg-amber' : 'bg-teal'}`}
                  style={{ width: `${fillPct}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}

      {selectedTask && (
        <TaskSignupModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </div>
  );
}

function TaskSignupModal({ task, onClose }: { task: VolunteerTask; onClose: () => void }) {
  const [form, setForm]   = useState({ fullName: '', phone: '', nric: '' });
  const [done, setDone]   = useState<string | null>(null);
  const { mutate, isPending } = useSignUpForTask();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate(
      { taskId: task.id, ...form },
      { onSuccess: (res) => setDone(res.confirmationCode) }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-t-lg sm:rounded-lg w-full max-w-md max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-paper-border sticky top-0 bg-white">
          <h2 className="font-semibold text-ink text-sm">{task.title}</h2>
          <button onClick={onClose}><X size={18} className="text-ink-muted" /></button>
        </div>

        {done ? (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-teal-light rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle size={32} className="text-teal" />
            </div>
            <h3 className="font-semibold text-ink mb-1">You're registered!</h3>
            <p className="text-sm text-ink-muted mb-2">Confirmation code:</p>
            <p className="font-mono text-lg font-bold text-navy">{done}</p>
            <p className="text-xs text-ink-muted mt-3">Keep this code — you may need it at check-in.</p>
            <button
              onClick={onClose}
              className="mt-4 w-full py-2 bg-teal text-white rounded-sm text-sm font-medium"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <p className="text-sm text-ink-muted">{task.description}</p>
            <div className="text-xs text-ink-muted space-y-1">
              <div className="flex items-center gap-1.5"><MapPin size={11} />{task.location}</div>
              <div className="flex items-center gap-1.5"><Clock  size={11} />{task.date} · {task.timeSlot}</div>
            </div>
            {task.skillsRequired.length > 0 && (
              <div>
                <p className="text-xs font-medium text-ink mb-1">Requirements:</p>
                <div className="flex flex-wrap gap-1">
                  {task.skillsRequired.map(s => (
                    <span key={s} className="text-xs px-2 py-0.5 bg-paper-border text-ink-muted rounded">{s}</span>
                  ))}
                </div>
              </div>
            )}
            <hr className="border-paper-border" />
            {[
              { id: 'fullName', label: 'Full Name', type: 'text',  placeholder: 'As per NRIC' },
              { id: 'phone',    label: 'Phone',     type: 'tel',   placeholder: '+65 XXXX XXXX' },
              { id: 'nric',     label: 'NRIC / FIN', type: 'text', placeholder: 'S1234567A' },
            ].map(field => (
              <div key={field.id}>
                <label className="block text-xs font-medium text-ink mb-1">{field.label} *</label>
                <input
                  type={field.type}
                  required
                  placeholder={field.placeholder}
                  value={(form as any)[field.id]}
                  onChange={e => setForm(f => ({ ...f, [field.id]: e.target.value }))}
                  className="w-full px-3 py-2 border border-paper-border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2.5 bg-teal text-white rounded-sm text-sm font-medium hover:bg-teal-dark transition-colors disabled:opacity-50"
            >
              {isPending ? 'Submitting…' : 'Confirm Sign-Up'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Incident Report Form ─────────────────────────────────────────────────────

function IncidentReportForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    locationText: '',
    type: 'medical' as IncidentType,
    severity: '2',
    estimatedCasualties: '',
    contactInfo: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const { mutate: createIncident, isPending } = useCreateIncident();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createIncident(
      {
        ...formData,
        severity: parseInt(formData.severity) as any,
        estimatedCasualties: formData.estimatedCasualties ? parseInt(formData.estimatedCasualties) : undefined,
      },
      { onSuccess: () => setSubmitted(true) }
    );
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-sm p-6 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-teal-light rounded-full flex items-center justify-center mx-auto mb-4">
            <Send size={28} className="text-teal" />
          </div>
          <h3 className="text-lg font-semibold text-ink mb-2">Incident Reported</h3>
          <p className="text-sm text-ink-muted mb-4">
            Your report has been submitted and will be reviewed by emergency responders.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2 bg-teal text-white rounded-sm text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-sm max-w-md w-full max-h-[90vh] overflow-auto">
        <div className="h-14 bg-navy flex items-center justify-between px-4 sticky top-0">
          <h2 className="text-white font-semibold">Report Incident</h2>
          <button onClick={onClose}><X size={20} className="text-white" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="Brief description"
              className="w-full px-3 py-2 border border-paper-border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-teal"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">Type *</label>
            <select
              required
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value as IncidentType })}
              className="w-full px-3 py-2 border border-paper-border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-teal"
            >
              <option value="medical">Medical Emergency</option>
              <option value="fire">Fire</option>
              <option value="flood">Flood</option>
              <option value="road">Traffic Accident</option>
              <option value="infrastructure">Infrastructure</option>
              <option value="civil">Civil Unrest</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">Severity *</label>
            <select
              required
              value={formData.severity}
              onChange={e => setFormData({ ...formData, severity: e.target.value })}
              className="w-full px-3 py-2 border border-paper-border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-teal"
            >
              <option value="1">1 — Critical (life-threatening)</option>
              <option value="2">2 — High (urgent response)</option>
              <option value="3">3 — Medium (routine response)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">Location *</label>
            <div className="relative">
              <input
                type="text"
                required
                value={formData.locationText}
                onChange={e => setFormData({ ...formData, locationText: e.target.value })}
                placeholder="Address or location"
                className="w-full px-3 py-2 border border-paper-border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-teal pr-10"
              />
              <Navigation size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">Description *</label>
            <textarea
              required
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="What happened? Provide as much detail as possible."
              rows={4}
              className="w-full px-3 py-2 border border-paper-border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-teal resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">Estimated Casualties</label>
            <input
              type="number"
              min="0"
              value={formData.estimatedCasualties}
              onChange={e => setFormData({ ...formData, estimatedCasualties: e.target.value })}
              placeholder="Number of people affected"
              className="w-full px-3 py-2 border border-paper-border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-teal"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">Your Contact *</label>
            <input
              type="text"
              required
              value={formData.contactInfo}
              onChange={e => setFormData({ ...formData, contactInfo: e.target.value })}
              placeholder="Name and phone number"
              className="w-full px-3 py-2 border border-paper-border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-teal"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 py-3 bg-teal text-white font-medium rounded-sm hover:bg-teal-dark transition-colors disabled:opacity-50"
          >
            {isPending ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting…</>
            ) : (
              <><Send size={16} /> Submit Report</>
            )}
          </button>

          <p className="text-xs text-ink-muted text-center">
            By submitting, you confirm the information is accurate to the best of your knowledge.
          </p>
        </form>
      </div>
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function LoadingSpinner({ label }: { label: string }) {
  return (
    <div className="text-center py-8">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal" />
      <p className="text-ink-muted mt-2 text-sm">{label}</p>
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="text-center py-8">
      <p className="text-red text-sm">{message}</p>
    </div>
  );
}