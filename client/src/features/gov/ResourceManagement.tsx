import { useState } from 'react';
import {
  useHospitals, useUpdateHospital,
  useCommunities, useVolunteerTasks, useCreateVolunteerTask,
} from '../../api/resources';
import { Hospital, Volunteer, CommunityOrganization, VolunteerTask } from '../../types';
import {
  Activity, Users, Phone, Mail, CheckCircle, Edit, Plus,
  MapPin, RefreshCw, AlertTriangle, XCircle, Shield,
  ChevronDown, ChevronUp, Send, X, Clock, Zap,
} from 'lucide-react';
import { Badge } from '../../components/Badge';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ORG_TYPE_CFG: Record<string, { label: string; cls: string }> = {
  ngo:        { label: 'NGO',        cls: 'bg-red-light text-red-dark' },
  grassroots: { label: 'Grassroots', cls: 'bg-teal-light text-teal-dark' },
  healthcare: { label: 'Healthcare', cls: 'bg-teal-light text-teal-dark' },
  government: { label: 'Government', cls: 'bg-navy-light text-navy-mid' },
  corporate:  { label: 'Corporate',  cls: 'bg-paper text-ink-muted' },
  religious:  { label: 'Religious',  cls: 'bg-purple-100 text-purple-700' },
};

// ─── Hospital edit form ───────────────────────────────────────────────────────

function HospitalEditForm({
  hospital, onSave, onCancel,
}: {
  hospital: Hospital;
  onSave: (h: Hospital) => void;
  onCancel: () => void;
}) {
  const [beds, setBeds] = useState(hospital.availableBeds);
  const [icu,  setIcu]  = useState(hospital.icuAvailable);
  const [tb,   setTb]   = useState(hospital.traumaBays);
  const { mutate, isPending } = useUpdateHospital(hospital.id);

  const save = () => {
    mutate(
      { availableBeds: beds, icuAvailable: icu, traumaBays: tb },
      { onSuccess: () => onSave({ ...hospital, availableBeds: beds, icuAvailable: icu, traumaBays: tb, lastUpdatedAt: new Date().toISOString() }) }
    );
  };

  return (
    <div className="space-y-3">
      {[
        { label: 'Available Beds', val: beds, set: setBeds, min: 0, max: hospital.totalBeds },
        { label: 'ICU Available',  val: icu,  set: setIcu,  min: 0, max: 50 },
        { label: 'Trauma Bays',    val: tb,   set: setTb,   min: 0, max: 20 },
      ].map(f => (
        <div key={f.label}>
          <label className="block text-xs font-medium text-ink mb-1">{f.label}</label>
          <input type="number" min={f.min} max={f.max} value={f.val}
            onChange={e => f.set(parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-paper-border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-teal"
          />
        </div>
      ))}
      <div className="flex gap-2">
        <button onClick={save} disabled={isPending}
          className="flex-1 py-2 bg-teal text-white rounded-sm text-sm font-semibold hover:bg-teal-dark disabled:opacity-50">
          {isPending ? 'Saving…' : 'Save Changes'}
        </button>
        <button onClick={onCancel}
          className="flex-1 py-2 border border-paper-border rounded-sm text-sm hover:bg-paper-hover">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Community row ────────────────────────────────────────────────────────────

function CommunityRow({ org }: { org: CommunityOrganization }) {
  const [open, setOpen] = useState(false);
  const typeCfg = ORG_TYPE_CFG[org.type] || ORG_TYPE_CFG.grassroots;
  const pct = org.totalMembers > 0 ? Math.round((org.availableMembers / org.totalMembers) * 100) : 0;

  return (
    <div className="border-b border-paper-border last:border-0">
      <div className="px-4 py-3.5 hover:bg-paper-hover cursor-pointer flex items-start gap-3"
        onClick={() => setOpen(v => !v)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="font-semibold text-ink text-sm">{org.name}</p>
            {org.isVerified && <CheckCircle size={13} className="text-teal" />}
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${typeCfg.cls}`}>{typeCfg.label}</span>
          </div>
          <p className="text-xs text-ink-muted truncate">{org.address}</p>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0 text-right">
          <div>
            <p className="text-sm font-bold text-ink">{org.availableMembers}/{org.totalMembers}</p>
            <p className="text-[10px] text-ink-muted">available</p>
          </div>
          <div>
            <p className={`text-xs font-semibold ${org.activeTasks > 0 ? 'text-amber-dark' : 'text-teal-dark'}`}>
              {org.activeTasks} task{org.activeTasks !== 1 ? 's' : ''}
            </p>
            <p className="text-[10px] text-ink-muted">active</p>
          </div>
          {open ? <ChevronUp size={14} className="text-ink-muted" /> : <ChevronDown size={14} className="text-ink-muted" />}
        </div>
      </div>

      {open && (
        <div className="border-t border-paper-border bg-paper px-4 py-4 space-y-3">
          <p className="text-xs text-ink-muted leading-relaxed">{org.description}</p>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { l: 'Total',     v: org.totalMembers,     c: 'text-ink' },
              { l: 'Available', v: org.availableMembers, c: 'text-teal-dark' },
              { l: 'Deployed',  v: org.deployedMembers,  c: 'text-amber-dark' },
            ].map(s => (
              <div key={s.l} className="bg-white border border-paper-border rounded-sm py-2">
                <p className={`text-xl font-bold ${s.c}`}>{s.v}</p>
                <p className="text-[10px] text-ink-muted">{s.l}</p>
              </div>
            ))}
          </div>
          {/* Capacity bar */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-ink-muted">Availability</span>
              <span className="font-semibold text-ink">{pct}%</span>
            </div>
            <div className="h-2 bg-paper-border rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${pct > 50 ? 'bg-teal' : pct > 25 ? 'bg-amber' : 'bg-red'}`}
                style={{ width: `${pct}%` }} />
            </div>
          </div>
          {/* Skills */}
          <div className="flex flex-wrap gap-1.5">
            {org.skillAreas.map(s => (
              <span key={s} className="text-[10px] px-2 py-0.5 bg-paper border border-paper-border rounded text-ink-muted">
                {s.replace('_', ' ')}
              </span>
            ))}
          </div>
          {/* Contact */}
          <div className="flex items-center gap-4 text-xs text-ink-muted">
            <span className="font-medium text-ink">{org.contactPerson}</span>
            <a href={`tel:${org.contactPhone}`} className="flex items-center gap-1 text-teal hover:underline">
              <Phone size={11} />{org.contactPhone}
            </a>
            <a href={`mailto:${org.contactEmail}`} className="flex items-center gap-1 text-teal hover:underline truncate">
              <Mail size={11} />{org.contactEmail}
            </a>
          </div>
          {/* Coverage */}
          <p className="flex items-center gap-1 text-xs text-ink-muted">
            <MapPin size={11} /> {org.coverageAreas.join(' · ')}
          </p>
          {/* Actions */}
          <div className="flex gap-2">
            <button className="flex-1 px-3 py-1.5 border border-paper-border rounded-sm text-xs hover:bg-paper-hover flex items-center justify-center gap-1">
              <Edit size={12} /> Edit Details
            </button>
            <button className="flex-1 px-3 py-1.5 bg-teal text-white rounded-sm text-xs font-semibold hover:bg-teal-dark flex items-center justify-center gap-1">
              <Phone size={12} /> Contact Org
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Task Management ──────────────────────────────────────────────────────────

function TaskManagement({ tasks, isLoading }: { tasks: VolunteerTask[]; isLoading: boolean }) {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', organization: '', taskType: 'logistics', location: '', date: 'Today', timeSlot: '9:00 AM – 5:00 PM', slotsTotal: 20, urgency: 'medium', skillsRequired: '' });
  const { mutate, isPending } = useCreateVolunteerTask();
  const [created, setCreated] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate({ ...form, skillsRequired: form.skillsRequired ? form.skillsRequired.split(',').map(s => s.trim()) : [] } as any,
      { onSuccess: () => { setCreated(true); setTimeout(() => { setCreated(false); setShowCreate(false); }, 1500); } }
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-ink-muted">{tasks.length} tasks on the public volunteer board.</p>
        <button onClick={() => setShowCreate(v => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-teal text-white rounded-sm text-sm font-semibold hover:bg-teal-dark">
          <Plus size={15} /> {showCreate ? 'Cancel' : 'Post New Task'}
        </button>
      </div>

      {showCreate && (
        <div className="mb-6 bg-teal-light border border-teal rounded-sm p-5">
          <h3 className="font-semibold text-ink mb-4 flex items-center gap-2">
            <Zap size={16} className="text-teal" /> Post Volunteer Task to Public Board
          </h3>
          {created ? (
            <div className="text-center py-4">
              <CheckCircle size={32} className="text-teal mx-auto mb-2" />
              <p className="text-sm font-semibold text-teal-dark">Task posted successfully!</p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Title *</label>
                  <input required type="text" value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-paper-border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-teal bg-white"
                    placeholder="Task title"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Organisation</label>
                  <input type="text" value={form.organization}
                    onChange={e => setForm(f => ({ ...f, organization: e.target.value }))}
                    className="w-full px-3 py-2 border border-paper-border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-teal bg-white"
                    placeholder="Organising body"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-ink mb-1">Location *</label>
                <input required type="text" value={form.location}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-paper-border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-teal bg-white"
                  placeholder="Venue / address"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Date</label>
                  <input type="text" value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-paper-border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-teal bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Slots</label>
                  <input type="number" min={1} value={form.slotsTotal}
                    onChange={e => setForm(f => ({ ...f, slotsTotal: parseInt(e.target.value) || 20 }))}
                    className="w-full px-3 py-2 border border-paper-border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-teal bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Urgency</label>
                  <select value={form.urgency}
                    onChange={e => setForm(f => ({ ...f, urgency: e.target.value }))}
                    className="w-full px-3 py-2 border border-paper-border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-teal bg-white">
                    {['low','medium','high','critical'].map(u => <option key={u} value={u} className="capitalize">{u}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-ink mb-1">Description</label>
                <textarea rows={2} value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="What will volunteers do?"
                  className="w-full px-3 py-2 border border-paper-border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-teal bg-white resize-none"
                />
              </div>
<div>
                <label className="block text-xs font-medium text-ink mb-1">Skills Required (comma-separated)</label>
                <input type="text" value={form.skillsRequired}
                  onChange={e => setForm(f => ({ ...f, skillsRequired: e.target.value }))}
                  placeholder="e.g. First Aid, Mandarin, Physical fitness"
                  className="w-full px-3 py-2 border border-paper-border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-teal bg-white"
                />
              </div>
              <button type="submit" disabled={isPending}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-navy text-white rounded-sm text-sm font-semibold hover:bg-navy-dark disabled:opacity-50">
                {isPending
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Posting…</>
                  : <><Send size={14} /> Post to Volunteer Board</>}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Tasks table */}
      {isLoading ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-10 text-ink-muted">
          <Zap className="mx-auto h-8 w-8 mb-2 opacity-30" />
          <p className="text-sm">No volunteer tasks posted yet.</p>
        </div>
      ) : (
        <div className="border border-paper-border rounded-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-paper border-b border-paper-border">
                {['Task', 'Organisation', 'Date / Time', 'Slots', 'Urgency', 'Status'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-ink-muted uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tasks.map(t => {
                const urgCls = {
                  critical: 'bg-red-light text-red-dark',
                  high:     'bg-amber-light text-amber-dark',
                  medium:   'bg-teal-light text-teal-dark',
                  low:      'bg-paper text-ink-muted',
                }[t.urgency] || 'bg-paper text-ink-muted';

                const fillPct = t.slotsTotal > 0
                  ? Math.round((t.slotsFilled / t.slotsTotal) * 100)
                  : 0;

                return (
                  <tr key={t.id} className="border-b border-paper-border last:border-0 hover:bg-paper-hover">
                    <td className="py-3 px-4 max-w-[220px]">
                      <p className="text-sm font-medium text-ink truncate">{t.title}</p>
                      <p className="text-xs text-ink-muted truncate">{t.location}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-ink">{t.organization}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-ink">{t.date}</p>
                      <p className="text-xs text-ink-muted">{t.timeSlot}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm font-medium text-ink">{t.slotsFilled}/{t.slotsTotal}</p>
                      <div className="w-16 h-1.5 bg-paper-border rounded-full mt-1">
                        <div
                          className={`h-full rounded-full ${fillPct >= 90 ? 'bg-red' : fillPct >= 60 ? 'bg-amber' : 'bg-teal'}`}
                          style={{ width: `${fillPct}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${urgCls}`}>
                        {t.urgency}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          t.status === 'full'      ? 'danger' :
                          t.status === 'filling'   ? 'warning' :
                          t.status === 'completed' ? 'default' : 'success'
                        }
                        className="text-xs capitalize"
                      >
                        {t.status}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Summary stat card ────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon, variant = 'default',
}: {
  label: string;
  value: number | string;
  sub: string;
  icon: React.ReactNode;
  variant?: 'default' | 'warning' | 'danger';
}) {
  const border = variant === 'danger'  ? 'border-l-4 border-l-red' :
                 variant === 'warning' ? 'border-l-4 border-l-amber' : '';
  return (
    <div className={`bg-white border border-paper-border rounded-sm p-4 ${border}`}>
      <div className="flex items-center gap-2 mb-2">{icon}
        <span className="text-sm font-medium text-ink-muted">{label}</span>
      </div>
      <div className="text-2xl font-bold text-ink">{value}</div>
      <div className="text-xs text-ink-muted mt-0.5">{sub}</div>
    </div>
  );
}

// ─── Main ResourceManagement (Gov) ────────────────────────────────────────────

export function ResourceManagement() {
  const [tab, setTab] = useState<'communities' | 'hospitals' | 'tasks'>('communities');
  const [editingHospital, setEditingHospital] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: commData, isLoading: commL, refetch: refC } = useCommunities();
  const { data: hosData,  isLoading: hosL,  refetch: refH } = useHospitals();
  const { data: taskData, isLoading: taskL, refetch: refT } = useVolunteerTasks();

  const communities = commData?.communities || [];
  const hospitals   = hosData?.hospitals    || [];
  const tasks       = taskData?.tasks       || [];

  // Derived stats
  const totalMembers    = communities.reduce((s, c) => s + c.totalMembers,     0);
  const availMembers    = communities.reduce((s, c) => s + c.availableMembers, 0);
  const deployedMembers = communities.reduce((s, c) => s + c.deployedMembers,  0);
  const totalBeds       = hospitals.reduce((s, h) => s + h.totalBeds,     0);
  const availBeds       = hospitals.reduce((s, h) => s + h.availableBeds, 0);
  const criticalHosps   = hospitals.filter(h => h.totalBeds > 0 && (h.availableBeds / h.totalBeds) < 0.1).length;
  const openTasks       = tasks.filter(t => t.status !== 'completed' && t.status !== 'full').length;

  const refresh = () => {
    setRefreshKey(k => k + 1);
    refC(); refH(); refT();
  };

  const TABS = [
    { id: 'communities' as const, label: `Community Orgs (${communities.length})` },
    { id: 'hospitals'   as const, label: `Hospitals (${hospitals.length})` },
    { id: 'tasks'       as const, label: `Volunteer Tasks (${openTasks})` },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-ink mb-1">Resource Management</h1>
          <p className="text-sm text-ink-muted">Manage community organisations, hospital capacity, and volunteer tasks</p>
        </div>
        <button onClick={refresh}
          className="flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-sm hover:bg-navy-dark text-sm">
          <RefreshCw size={15} className={commL || hosL || taskL ? 'animate-spin' : ''} /> Refresh All
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Community Organisations"
          value={communities.length}
          sub={`${communities.filter(c => c.status === 'active').length} active · ${communities.filter(c => c.status === 'deployed').length} deployed`}
          icon={<Users size={18} className="text-teal" />}
        />
        <StatCard
          label="Total Volunteer Pool"
          value={`${availMembers}/${totalMembers}`}
          sub={`${deployedMembers} currently deployed`}
          icon={<CheckCircle size={18} className="text-teal" />}
          variant={availMembers / Math.max(totalMembers, 1) < 0.3 ? 'warning' : 'default'}
        />
        <StatCard
          label="Hospital Capacity"
          value={`${availBeds}/${totalBeds}`}
          sub={`${criticalHosps} hospital${criticalHosps !== 1 ? 's' : ''} critically low`}
          icon={<Activity size={18} className="text-teal" />}
          variant={criticalHosps > 0 ? 'danger' : 'default'}
        />
        <StatCard
          label="Open Volunteer Tasks"
          value={openTasks}
          sub={`${tasks.filter(t => t.urgency === 'critical').length} critical urgency`}
          icon={<Zap size={18} className="text-amber" />}
          variant={tasks.some(t => t.urgency === 'critical' && t.status !== 'full') ? 'warning' : 'default'}
        />
      </div>

      {/* Critical alerts */}
      {criticalHosps > 0 && (
        <div className="mb-4 flex items-start gap-3 bg-red-light border border-red rounded-sm px-4 py-3">
          <AlertTriangle size={15} className="text-red shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-dark">
              {criticalHosps} hospital{criticalHosps > 1 ? 's' : ''} at critically low bed capacity (&lt;10%).
            </p>
            <p className="text-xs text-red-dark opacity-80 mt-0.5">
              Review hospital data and coordinate with MOH for capacity relief.
            </p>
          </div>
        </div>
      )}
      {availMembers / Math.max(totalMembers, 1) < 0.25 && totalMembers > 0 && (
        <div className="mb-4 flex items-start gap-3 bg-amber-light border border-amber rounded-sm px-4 py-3">
          <AlertTriangle size={15} className="text-amber-dark shrink-0 mt-0.5" />
          <p className="text-sm font-semibold text-amber-dark">
            Volunteer availability below 25% — consider requesting additional community aid.
          </p>
        </div>
      )}

      {/* Tab panel */}
      <div className="bg-white border border-paper-border rounded-sm overflow-hidden">
        {/* Tab headers */}
        <div className="flex border-b border-paper-border">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                tab === t.id ? 'bg-navy text-white' : 'text-ink hover:bg-paper-hover'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6">

          {/* ── Community Organisations ── */}
          {tab === 'communities' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-ink-muted">
                  {communities.length} registered organisations ·{' '}
                  {communities.filter(c => c.isVerified).length} verified
                </p>
                <button className="flex items-center gap-2 px-4 py-2 border border-paper-border rounded-sm text-sm hover:bg-paper-hover">
                  <Plus size={15} /> Add Organisation
                </button>
              </div>

              {/* Group by type */}
              {(['government', 'healthcare', 'ngo', 'grassroots', 'corporate', 'religious'] as const).map(type => {
                const group = communities.filter(c => c.type === type);
                if (group.length === 0) return null;
                const cfg = ORG_TYPE_CFG[type];
                return (
                  <div key={type} className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${cfg.cls}`}>{cfg.label}</span>
                      <span className="text-xs text-ink-muted">{group.length} organisation{group.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="border border-paper-border rounded-sm overflow-hidden">
                      {group.map(org => <CommunityRow key={org.id} org={org} />)}
                    </div>
                  </div>
                );
              })}

              {commL && (
                <div className="text-center py-10">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal" />
                </div>
              )}
              {!commL && communities.length === 0 && (
                <div className="text-center py-10 text-ink-muted">
                  <Users className="mx-auto h-8 w-8 mb-2 opacity-30" />
                  <p className="text-sm">No community organisations registered yet.</p>
                </div>
              )}
            </div>
          )}

          {/* ── Hospitals ── */}
          {tab === 'hospitals' && (
            <div>
              <p className="text-sm text-ink-muted mb-4">
                Edit bed counts and ICU availability in real time. Changes reflect immediately across all portals.
              </p>

              {hosL ? (
                <div className="text-center py-10">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal" />
                </div>
              ) : hospitals.length === 0 ? (
                <div className="text-center py-10 text-ink-muted">
                  <Activity className="mx-auto h-8 w-8 mb-2 opacity-30" />
                  <p className="text-sm">No hospital data found.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {hospitals.map(h => {
                    const pct    = h.totalBeds > 0 ? (h.availableBeds / h.totalBeds) * 100 : 0;
                    const bar    = pct > 30 ? 'bg-teal' : pct > 10 ? 'bg-amber' : 'bg-red';
                    const status = pct > 30 ? { l: 'Available', v: 'success' as const }
                                 : pct > 10 ? { l: 'Limited',   v: 'warning' as const }
                                 :             { l: 'Critical',  v: 'danger'  as const };
                    const isEditing = editingHospital === h.id;

                    return (
                      <div key={h.id}
                        className={`bg-white border border-paper-border rounded-sm overflow-hidden ${
                          status.v === 'danger' ? 'border-l-4 border-l-red' : ''
                        }`}>
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="font-semibold text-ink">{h.name}</p>
                              <p className="text-xs text-ink-muted mt-0.5">{h.address}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={status.v} className="text-xs">{status.l}</Badge>
                              <button onClick={() => setEditingHospital(isEditing ? null : h.id)}
                                className="flex items-center gap-1 px-2.5 py-1 border border-paper-border rounded-sm text-xs hover:bg-paper-hover">
                                <Edit size={12} /> {isEditing ? 'Cancel' : 'Edit'}
                              </button>
                            </div>
                          </div>

                          {!isEditing && (
                            <>
                              <div className="grid grid-cols-3 gap-4 mb-3">
                                {[
                                  { l: 'Available Beds', v: `${h.availableBeds}/${h.totalBeds}` },
                                  { l: 'ICU Available',  v: h.icuAvailable },
                                  { l: 'Trauma Bays',    v: h.traumaBays },
                                ].map(s => (
                                  <div key={s.l} className="bg-paper rounded-sm p-3 text-center">
                                    <p className="text-xl font-bold text-ink">{s.v}</p>
                                    <p className="text-[10px] text-ink-muted mt-0.5">{s.l}</p>
                                  </div>
                                ))}
                              </div>
                              <div className="h-2 bg-paper-border rounded-full overflow-hidden">
                                <div className={`h-full ${bar} rounded-full transition-all`}
                                  style={{ width: `${pct}%` }} />
                              </div>
                              <p className="text-[11px] text-ink-muted mt-1 text-right">
                                {pct.toFixed(0)}% capacity available
                                {h.lastUpdatedAt && ` · updated ${new Date(h.lastUpdatedAt).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })}`}
                              </p>
                            </>
                          )}

                          {isEditing && (
                            <HospitalEditForm
                              hospital={h}
                              onSave={() => { setEditingHospital(null); refH(); }}
                              onCancel={() => setEditingHospital(null)}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Volunteer Tasks ── */}
          {tab === 'tasks' && (
            <TaskManagement tasks={tasks} isLoading={taskL} />
          )}
        </div>
      </div>
    </div>
  );
}