import { useState } from 'react';
import { useHospitals, useCommunities, useVolunteerTasks, useRequestAid, useCreateVolunteerTask } from '../../api/resources';
import { CommunityOrganization, Hospital, VolunteerTask } from '../../types';
import {
  Activity, Users, MapPin, RefreshCw, AlertTriangle,
  CheckCircle, XCircle, Phone, Mail, Shield, Heart,
  Droplets, Truck, Globe, Building2, Plus, X,
  ChevronDown, ChevronUp, Clock, Zap, Badge as BadgeIcon,
  ExternalLink, Send, Star,
} from 'lucide-react';
import { Badge } from '../../components/Badge';
import { authStore } from '../../stores/authStore';

// ─── Helpers ────────────────────────────────────────────────────────────────

const ORG_TYPE_CFG: Record<string, { label: string; color: string; bg: string }> = {
  ngo:        { label: 'NGO',        color: 'text-red-700',    bg: 'bg-red-50 border-red-200' },
  grassroots: { label: 'Grassroots', color: 'text-teal-dark',  bg: 'bg-teal-light border-teal' },
  healthcare: { label: 'Healthcare', color: 'text-teal-dark',  bg: 'bg-teal-light border-teal' },
  government: { label: 'Government', color: 'text-navy-mid',   bg: 'bg-navy-light border-navy-border' },
  corporate:  { label: 'Corporate',  color: 'text-ink-muted',  bg: 'bg-paper border-paper-border' },
  religious:  { label: 'Religious',  color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
};

const STATUS_CFG: Record<string, { label: string; dot: string; cls: string }> = {
  active:   { label: 'Active',   dot: 'bg-teal',    cls: 'text-teal-dark bg-teal-light' },
  standby:  { label: 'Standby',  dot: 'bg-amber',   cls: 'text-amber-dark bg-amber-light' },
  deployed: { label: 'Deployed', dot: 'bg-red',     cls: 'text-red-dark bg-red-light' },
  inactive: { label: 'Inactive', dot: 'bg-gray-400', cls: 'text-ink-muted bg-paper-border' },
};

const SKILL_LABELS: Record<string, string> = {
  first_aid: 'First Aid', cpr: 'CPR', medical_support: 'Medical',
  psychological_support: 'Counselling', logistics: 'Logistics',
  transport: 'Transport', translation: 'Translation',
  community_outreach: 'Outreach', vehicle: 'Vehicle Ops',
  heavy_lifting: 'Heavy Lifting', search_rescue: 'Search & Rescue',
  food_distribution: 'Food Dist.',
};

function SkillChip({ skill }: { skill: string }) {
  return (
    <span className="text-[10px] px-1.5 py-0.5 bg-paper-border text-ink-muted rounded font-medium">
      {SKILL_LABELS[skill] || skill}
    </span>
  );
}

// ─── Request Aid Modal ──────────────────────────────────────────────────────

function RequestAidModal({
  community,
  incidentId,
  onClose,
}: {
  community: CommunityOrganization;
  incidentId?: string;
  onClose: () => void;
}) {
  const TASK_TYPES = [
    { value: 'food_distribution',  label: '🍱 Food Distribution' },
    { value: 'shelter_assistance', label: '🏠 Shelter Assistance' },
    { value: 'medical_support',    label: '❤️ Medical Support' },
    { value: 'logistics',          label: '🚛 Logistics' },
    { value: 'translation',        label: '🗣️ Translation' },
    { value: 'community_outreach', label: '📢 Community Outreach' },
    { value: 'search_rescue',      label: '🔦 Search & Rescue' },
    { value: 'blood_donation',     label: '🩸 Blood Donation' },
  ];

  const [form, setForm] = useState({
    title: '',
    description: '',
    taskType: 'logistics',
    location: community.address,
    date: 'Today',
    timeSlot: '9:00 AM – 5:00 PM',
    slotsTotal: 20,
    skillsRequired: '',
    urgency: 'medium',
  });
  const [done, setDone] = useState(false);
  const { mutate: requestAid, isPending } = useRequestAid();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    requestAid({
      communityId: community.id,
      title: form.title || `${community.shortName} — Volunteer Request`,
      description: form.description,
      taskType: form.taskType,
      location: form.location,
      date: form.date,
      timeSlot: form.timeSlot,
      slotsTotal: form.slotsTotal,
      skillsRequired: form.skillsRequired ? form.skillsRequired.split(',').map(s => s.trim()) : [],
      urgency: form.urgency,
      incidentId,
    }, {
      onSuccess: () => setDone(true),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-sm w-full max-w-lg max-h-[90vh] overflow-auto">
        <div className="px-5 py-4 border-b border-paper-border flex items-center justify-between sticky top-0 bg-white">
          <div>
            <h2 className="font-semibold text-ink">Request Community Aid</h2>
            <p className="text-xs text-ink-muted">{community.name}</p>
          </div>
          <button onClick={onClose} className="text-ink-muted hover:text-ink"><X size={18} /></button>
        </div>

        {done ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-teal-light rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-teal" />
            </div>
            <h3 className="font-semibold text-ink text-lg mb-1">Aid Request Sent</h3>
            <p className="text-sm text-ink-muted mb-2">
              The volunteer task has been posted to the public portal.
            </p>
            <p className="text-xs text-ink-muted mb-6">
              {community.contactPerson} ({community.contactPhone}) will be notified.
            </p>
            <button onClick={onClose} className="w-full py-2.5 bg-teal text-white rounded-sm font-semibold text-sm">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="p-5 space-y-4">
            <div className="bg-amber-light border border-amber rounded-sm p-3 text-xs text-amber-dark">
              <strong>Note:</strong> This request will be published to the public volunteer portal. Community members will be able to sign up.
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1">Task Type *</label>
              <select value={form.taskType}
                onChange={e => setForm(f => ({ ...f, taskType: e.target.value }))}
                className="w-full px-3 py-2 border border-paper-border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-teal bg-white">
                {TASK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1">Task Title</label>
              <input type="text" value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder={`${community.shortName} — Volunteer Request`}
                className="w-full px-3 py-2 border border-paper-border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-teal"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1">Description</label>
              <textarea rows={3} value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="What do volunteers need to do? What experience is required?"
                className="w-full px-3 py-2 border border-paper-border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-teal resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Location</label>
                <input type="text" value={form.location}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-paper-border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Slots Needed</label>
                <input type="number" min={1} max={500} value={form.slotsTotal}
                  onChange={e => setForm(f => ({ ...f, slotsTotal: parseInt(e.target.value) || 20 }))}
                  className="w-full px-3 py-2 border border-paper-border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Date</label>
                <input type="text" value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  placeholder="Today / dd Mon"
                  className="w-full px-3 py-2 border border-paper-border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Time Slot</label>
                <input type="text" value={form.timeSlot}
                  onChange={e => setForm(f => ({ ...f, timeSlot: e.target.value }))}
                  placeholder="9:00 AM – 5:00 PM"
                  className="w-full px-3 py-2 border border-paper-border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1">Urgency</label>
              <div className="grid grid-cols-4 gap-2">
                {(['low', 'medium', 'high', 'critical'] as const).map(u => (
                  <button key={u} type="button"
                    onClick={() => setForm(f => ({ ...f, urgency: u }))}
                    className={`py-2 rounded-sm border-2 text-center text-xs font-semibold capitalize transition-all ${
                      form.urgency === u
                        ? u === 'critical' ? 'border-red bg-red-light text-red-dark' :
                          u === 'high'     ? 'border-orange-500 bg-orange-50 text-orange-700' :
                          u === 'medium'   ? 'border-amber bg-amber-light text-amber-dark' :
                                            'border-teal bg-teal-light text-teal-dark'
                        : 'border-paper-border text-ink-muted hover:border-paper-hover'
                    }`}>
                    {u}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1">Skills Required (comma-separated)</label>
              <input type="text" value={form.skillsRequired}
                onChange={e => setForm(f => ({ ...f, skillsRequired: e.target.value }))}
                placeholder="e.g. First Aid, Mandarin, Physical fitness"
                className="w-full px-3 py-2 border border-paper-border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-teal"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 px-4 py-2 border border-paper-border rounded-sm text-sm hover:bg-paper-hover">
                Cancel
              </button>
              <button type="submit" disabled={isPending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-teal text-white rounded-sm text-sm font-semibold hover:bg-teal-dark disabled:opacity-50">
                {isPending
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Posting…</>
                  : <><Send size={14} /> Post Aid Request</>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Community Org Card ─────────────────────────────────────────────────────

function CommunityCard({
  org,
  onRequestAid,
}: {
  org: CommunityOrganization;
  onRequestAid: () => void;
}) {
  const [open, setOpen] = useState(false);
  const typeCfg   = ORG_TYPE_CFG[org.type]   || ORG_TYPE_CFG.grassroots;
  const statusCfg = STATUS_CFG[org.status]    || STATUS_CFG.active;
  const user      = authStore(s => s.user);
  const canRequest = user?.role === 'supervisor' || user?.role === 'gov_admin' || user?.role === 'responder';

  return (
    <div className={`bg-white border border-paper-border rounded-sm overflow-hidden ${
      org.status === 'deployed' ? 'border-l-4 border-l-red' :
      org.status === 'active'   ? 'border-l-4 border-l-teal' : ''
    }`}>
      {/* Header row */}
      <div className="flex items-start justify-between px-4 py-3.5 cursor-pointer hover:bg-paper-hover"
        onClick={() => setOpen(v => !v)}>
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5">
            <div className="relative">
              <span className={`w-2.5 h-2.5 rounded-full inline-block ${statusCfg.dot}`} />
              {org.status === 'deployed' && (
                <span className={`absolute inset-0 w-2.5 h-2.5 rounded-full ${statusCfg.dot} animate-ping opacity-60`} />
              )}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <p className="font-semibold text-ink text-sm">{org.name}</p>
              {org.isVerified && (
                <span title="Verified Organisation" className="text-teal">
                  <CheckCircle size={13} className="text-teal" />
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${typeCfg.bg} ${typeCfg.color}`}>
                {typeCfg.label}
              </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${statusCfg.cls}`}>
                {statusCfg.label}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-2">
          <div className="text-right">
            <p className="text-xs font-bold text-ink">{org.availableMembers}<span className="text-ink-muted font-normal">/{org.totalMembers}</span></p>
            <p className="text-[10px] text-ink-muted">available</p>
          </div>
          {open ? <ChevronUp size={14} className="text-ink-muted" /> : <ChevronDown size={14} className="text-ink-muted" />}
        </div>
      </div>

      {/* Expanded detail */}
      {open && (
        <div className="border-t border-paper-border">
          {/* Description */}
          <div className="px-4 py-3 bg-paper text-xs text-ink-muted">{org.description}</div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 divide-x divide-paper-border border-t border-paper-border">
            {[
              { label: 'Total', value: org.totalMembers },
              { label: 'Available', value: org.availableMembers },
              { label: 'Deployed', value: org.deployedMembers },
            ].map(s => (
              <div key={s.label} className="py-3 text-center">
                <p className="text-lg font-bold text-ink">{s.value}</p>
                <p className="text-[10px] text-ink-muted">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Skills */}
          <div className="px-4 py-3 border-t border-paper-border">
            <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider mb-2">Capability Areas</p>
            <div className="flex flex-wrap gap-1.5">
              {org.skillAreas.map(s => <SkillChip key={s} skill={s} />)}
            </div>
          </div>

          {/* Coverage */}
          {org.coverageAreas.length > 0 && (
            <div className="px-4 py-2.5 border-t border-paper-border flex items-center gap-2">
              <MapPin size={12} className="text-ink-muted flex-shrink-0" />
              <p className="text-xs text-ink-muted">{org.coverageAreas.join(' · ')}</p>
            </div>
          )}

          {/* Contact + actions */}
          <div className="px-4 py-3 border-t border-paper-border flex items-center justify-between gap-3">
            <div className="text-xs text-ink-muted min-w-0">
              <p className="font-medium text-ink truncate">{org.contactPerson}</p>
              <a href={`tel:${org.contactPhone}`} className="flex items-center gap-1 text-teal hover:underline">
                <Phone size={11} />{org.contactPhone}
              </a>
            </div>
            {canRequest && (
              <button onClick={e => { e.stopPropagation(); onRequestAid(); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-teal text-white text-xs font-semibold rounded-sm hover:bg-teal-dark transition-colors whitespace-nowrap">
                <Plus size={13} /> Request Aid
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Volunteer Task Card ────────────────────────────────────────────────────

function TaskRow({ task }: { task: VolunteerTask }) {
  const urgencyCls = {
    critical: 'bg-red-light text-red-dark border-red',
    high:     'bg-amber-light text-amber-dark border-amber',
    medium:   'bg-teal-light text-teal-dark border-teal',
    low:      'bg-paper text-ink-muted border-paper-border',
  }[task.urgency] || 'bg-paper text-ink-muted border-paper-border';

  const fillPct = Math.round((task.slotsFilled / task.slotsTotal) * 100);

  return (
    <div className="px-4 py-3 border-b border-paper-border last:border-0 hover:bg-paper-hover">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="text-sm font-semibold text-ink">{task.title}</p>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${urgencyCls} uppercase`}>
              {task.urgency}
            </span>
          </div>
          <p className="text-xs text-ink-muted mb-1.5">{task.organization} · {task.location}</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-paper-border rounded-full overflow-hidden">
              <div className="h-full bg-teal rounded-full" style={{ width: `${fillPct}%` }} />
            </div>
            <span className="text-[11px] text-ink-muted flex-shrink-0">
              {task.slotsFilled}/{task.slotsTotal} volunteers
            </span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs font-medium text-ink">{task.date}</p>
          <p className="text-[11px] text-ink-muted">{task.timeSlot}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Create Task Modal ──────────────────────────────────────────────────────

function CreateTaskModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    title: '', description: '', organization: '', orgType: 'government',
    taskType: 'logistics', location: '', date: 'Today',
    timeSlot: '9:00 AM – 5:00 PM', slotsTotal: 20,
    skillsRequired: '', urgency: 'medium',
  });
  const [done, setDone] = useState(false);
  const { mutate, isPending } = useCreateVolunteerTask();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate({
      ...form,
      slotsTotal: form.slotsTotal,
      skillsRequired: form.skillsRequired ? form.skillsRequired.split(',').map(s => s.trim()) : [],
    } as any, { onSuccess: () => setDone(true) });
  };

  if (done) return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-sm p-8 max-w-sm w-full text-center">
        <div className="w-16 h-16 bg-teal-light rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-teal" />
        </div>
        <h3 className="font-semibold text-ink text-lg mb-1">Task Posted</h3>
        <p className="text-sm text-ink-muted mb-5">The volunteer task is now live on the public portal.</p>
        <button onClick={onClose} className="w-full py-2.5 bg-teal text-white rounded-sm font-semibold text-sm">Done</button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-sm w-full max-w-lg max-h-[90vh] overflow-auto">
        <div className="px-5 py-4 border-b border-paper-border flex items-center justify-between sticky top-0 bg-white">
          <h2 className="font-semibold text-ink">Post Volunteer Task</h2>
          <button onClick={onClose} className="text-ink-muted hover:text-ink"><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          {[
            { key: 'title',        label: 'Title *',            placeholder: 'e.g. Flood Relief — Food Packing' },
            { key: 'organization', label: 'Organisation',       placeholder: 'e.g. Singapore Red Cross' },
            { key: 'location',     label: 'Location *',         placeholder: 'Address or venue name' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-ink mb-1">{f.label}</label>
              <input required={f.label.includes('*')} type="text"
                value={(form as any)[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full px-3 py-2 border border-paper-border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-teal"
              />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Description</label>
            <textarea rows={3} value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="What will volunteers do? What requirements?"
              className="w-full px-3 py-2 border border-paper-border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-teal resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Date</label>
              <input type="text" value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full px-3 py-2 border border-paper-border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-teal"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Slots</label>
              <input type="number" min={1} value={form.slotsTotal}
                onChange={e => setForm(f => ({ ...f, slotsTotal: parseInt(e.target.value) || 20 }))}
                className="w-full px-3 py-2 border border-paper-border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-teal"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Urgency</label>
            <div className="grid grid-cols-4 gap-2">
              {(['low','medium','high','critical'] as const).map(u => (
                <button key={u} type="button"
                  onClick={() => setForm(f => ({ ...f, urgency: u }))}
                  className={`py-2 rounded-sm border-2 text-xs font-semibold capitalize transition-all ${
                    form.urgency === u ? 'border-navy bg-navy-light text-navy' : 'border-paper-border text-ink-muted'
                  }`}>{u}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-paper-border rounded-sm text-sm hover:bg-paper-hover">Cancel</button>
            <button type="submit" disabled={isPending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-navy text-white rounded-sm text-sm font-semibold hover:bg-navy-dark disabled:opacity-50">
              {isPending ? 'Posting…' : <><Send size={14} /> Post Task</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Summary card ────────────────────────────────────────────────────────────

function SummaryCard({ label, value, sub, icon }: { label: string; value: number | string; sub: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white border border-paper-border rounded-sm p-4">
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-2">{icon}<span className="text-sm font-medium text-ink">{label}</span></div>
      </div>
      <div className="text-2xl font-bold text-ink mb-0.5">{value}</div>
      <div className="text-xs text-ink-muted">{sub}</div>
    </div>
  );
}

// ─── Main ResourcesView ─────────────────────────────────────────────────────

export function ResourcesView() {
  const [tab,          setTab]          = useState<'communities' | 'hospitals' | 'tasks'>('communities');
  const [requestingOrg, setRequestingOrg] = useState<CommunityOrganization | null>(null);
  const [showCreate,   setShowCreate]   = useState(false);
  const [refreshKey,   setRefreshKey]   = useState(0);

  const user = authStore(s => s.user);
  const isSupervisor = user?.role === 'supervisor' || user?.role === 'gov_admin';

  const { data: commData,  isLoading: commL,  refetch: refC } = useCommunities();
  const { data: hosData,   isLoading: hosL,   refetch: refH } = useHospitals();
  const { data: taskData,  isLoading: taskL,  refetch: refT } = useVolunteerTasks();

  const communities = commData?.communities || [];
  const hospitals   = hosData?.hospitals    || [];
  const tasks       = taskData?.tasks       || [];

  const totalAvail = communities.reduce((s, c) => s + c.availableMembers, 0);
  const totalDep   = communities.reduce((s, c) => s + c.deployedMembers,  0);
  const activeTasks = tasks.filter(t => t.status !== 'full' && t.status !== 'completed').length;

  const refresh = () => { setRefreshKey(k => k + 1); refC(); refH(); refT(); };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-ink mb-1">Resources</h1>
          <p className="text-sm text-ink-muted">Community organisations · Hospitals · Active volunteer tasks</p>
        </div>
        <div className="flex gap-2">
          {isSupervisor && (
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 bg-teal text-white rounded-sm hover:bg-teal-dark text-sm font-semibold">
              <Plus size={16} /> Post Volunteer Task
            </button>
          )}
          <button onClick={refresh}
            className="flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-sm hover:bg-navy-dark text-sm">
            <RefreshCw size={16} className={commL || hosL || taskL ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <SummaryCard label="Community Orgs" value={communities.length} sub={`${communities.filter(c => c.status === 'active').length} active`} icon={<Users size={18} className="text-teal" />} />
        <SummaryCard label="Volunteers Available" value={totalAvail} sub={`${totalDep} deployed`} icon={<CheckCircle size={18} className="text-teal" />} />
        <SummaryCard label="Hospital Capacity" value={`${hospitals.reduce((s, h) => s + h.availableBeds, 0)}`} sub={`beds available`} icon={<Activity size={18} className="text-teal" />} />
        <SummaryCard label="Open Tasks" value={activeTasks} sub="on volunteer board" icon={<Zap size={18} className="text-amber" />} />
      </div>

      {/* Tabs */}
      <div className="bg-white border border-paper-border rounded-sm overflow-hidden">
        <div className="flex border-b border-paper-border">
          {([
            ['communities', 'Community Organisations'],
            ['hospitals',   'Hospitals'],
            ['tasks',       `Volunteer Tasks (${activeTasks})`],
          ] as const).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                tab === id ? 'bg-navy text-white' : 'bg-white text-ink hover:bg-paper-hover'
              }`}>
              {label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* ── Community Organisations ── */}
          {tab === 'communities' && (
            <div>
              {commL ? <LoadingMsg /> : communities.length === 0 ? <EmptyMsg text="No community organisations found" /> : (
                <div className="space-y-3">
                  {communities.map(org => (
                    <CommunityCard key={org.id} org={org} onRequestAid={() => setRequestingOrg(org)} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Hospitals ── */}
          {tab === 'hospitals' && (
            <div>
              {hosL ? <LoadingMsg /> : hospitals.length === 0 ? <EmptyMsg text="No hospital data available" /> : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-paper-border">
                        {['Hospital', 'Beds', 'ICU', 'Trauma Bays', 'Status'].map(h => (
                          <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-ink-muted uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {hospitals.map(h => {
                        const pct = h.totalBeds > 0 ? (h.availableBeds / h.totalBeds) * 100 : 0;
                        const bar = pct > 30 ? 'bg-teal' : pct > 10 ? 'bg-amber' : 'bg-red';
                        const status = pct > 30 ? { label: 'Available', v: 'success' as const } :
                                       pct > 10 ? { label: 'Limited',   v: 'warning' as const } :
                                                  { label: 'Critical',  v: 'danger'  as const };
                        return (
                          <tr key={h.id} className="border-b border-paper-border hover:bg-paper-hover">
                            <td className="py-3 px-4">
                              <p className="font-medium text-ink text-sm">{h.name}</p>
                              <p className="text-xs text-ink-muted">{h.address}</p>
                            </td>
                            <td className="py-3 px-4">
                              <p className="text-sm font-medium text-ink">{h.availableBeds}/{h.totalBeds}</p>
                              <div className="w-20 h-1.5 bg-paper-border rounded-full mt-1">
                                <div className={`h-full ${bar} rounded-full`} style={{ width: `${pct}%` }} />
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm text-ink">{h.icuAvailable}</td>
                            <td className="py-3 px-4 text-sm text-ink">{h.traumaBays}</td>
                            <td className="py-3 px-4">
                              <Badge variant={status.v} className="text-xs">{status.label}</Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Volunteer Tasks ── */}
          {tab === 'tasks' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-ink-muted">{activeTasks} open tasks on the public volunteer board.</p>
                {isSupervisor && (
                  <button onClick={() => setShowCreate(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-teal text-white text-xs font-semibold rounded-sm hover:bg-teal-dark">
                    <Plus size={13} /> Post New Task
                  </button>
                )}
              </div>
              {taskL ? <LoadingMsg /> : tasks.length === 0 ? <EmptyMsg text="No volunteer tasks posted" /> : (
                <div className="border border-paper-border rounded-sm overflow-hidden">
                  {tasks.map(t => <TaskRow key={t.id} task={t} />)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {requestingOrg && (
        <RequestAidModal community={requestingOrg} onClose={() => setRequestingOrg(null)} />
      )}
      {showCreate && <CreateTaskModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function LoadingMsg() {
  return (
    <div className="text-center py-12">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal" />
      <p className="text-ink-muted mt-2">Loading…</p>
    </div>
  );
}

function EmptyMsg({ text }: { text: string }) {
  return (
    <div className="text-center py-12 text-ink-muted">
      <Users className="mx-auto h-10 w-10 mb-2 opacity-30" />
      <p>{text}</p>
    </div>
  );
}