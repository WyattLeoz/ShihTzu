import { useState } from 'react';
import { useBroadcasts, useCreateBroadcast } from '../../api/broadcasts';
import { useIncidents } from '../../api/incidents';
import { Broadcast, BroadcastAudience } from '../../types';
import {
  Megaphone, Plus, X, Edit2, Trash2, Send, Sparkles,
  Globe, Users, MapPin, AlertTriangle, CheckCircle, Clock,
} from 'lucide-react';
import { Badge } from '../../components/Badge';

const AUDIENCE_OPTIONS: { value: BroadcastAudience; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: 'all',        label: 'Everyone',   icon: <Globe  size={15} />, desc: 'All users on the platform'   },
  { value: 'responders', label: 'Responders', icon: <Users  size={15} />, desc: 'Internal responder teams'     },
  { value: 'zone',       label: 'By Zone',    icon: <MapPin size={15} />, desc: 'Specific geographic zone'     },
];

export function BroadcastManagement() {
  const [showCompose, setShowCompose] = useState(false);

  const { data: broadcastsData, isLoading, refetch } = useBroadcasts({ limit: 50 });
  const broadcasts = broadcastsData?.broadcasts || [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-ink mb-1">Broadcast Management</h1>
          <p className="text-sm text-ink-muted">Create, manage, and publish emergency communications</p>
        </div>
        <button onClick={() => setShowCompose(true)}
          className="flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-sm hover:bg-navy-dark transition-colors text-sm">
          <Plus size={16} /> New Broadcast
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard icon={<Globe size={20} className="text-navy" />}
          label="Public Broadcasts" value={broadcasts.filter(b => b.audience === 'all').length} />
        <StatCard icon={<Users size={20} className="text-teal" />}
          label="Responder Broadcasts" value={broadcasts.filter(b => b.audience === 'responders').length} />
        <StatCard icon={<MapPin size={20} className="text-amber" />}
          label="Zone Broadcasts" value={broadcasts.filter(b => b.audience === 'zone').length} />
      </div>

      {/* Broadcasts list */}
      <div className="bg-white border border-paper-border rounded-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-paper-border flex items-center justify-between">
          <h2 className="font-medium text-ink">All Broadcasts</h2>
          <button onClick={() => refetch()} className="text-xs text-teal hover:underline">Refresh</button>
        </div>
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal" />
            <p className="text-ink-muted mt-2">Loading broadcasts…</p>
          </div>
        ) : broadcasts.length === 0 ? (
          <div className="p-8 text-center text-ink-muted">
            <Megaphone className="mx-auto h-12 w-12 mb-2 opacity-30" />
            <p>No broadcasts yet. Create your first one.</p>
          </div>
        ) : (
          <div className="divide-y divide-paper-border">
            {broadcasts.map(broadcast => (
              <BroadcastRow key={broadcast.id} broadcast={broadcast} onDelete={() => refetch()} />
            ))}
          </div>
        )}
      </div>

      {showCompose && (
        <BroadcastComposer onClose={() => setShowCompose(false)} onSuccess={() => { setShowCompose(false); refetch(); }} />
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-white border border-paper-border rounded-sm p-4">
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-sm font-medium text-ink">{label}</span></div>
      <div className="text-2xl font-bold text-ink">{value}</div>
    </div>
  );
}

function BroadcastRow({ broadcast, onDelete }: { broadcast: Broadcast; onDelete: () => void }) {
  const [showDelete, setShowDelete] = useState(false);

  const audienceCls = broadcast.audience === 'all'
    ? 'bg-navy-light text-navy-mid'
    : broadcast.audience === 'responders'
    ? 'bg-teal-light text-teal-dark'
    : 'bg-amber-light text-amber-dark';

  return (
    <div className="px-4 py-4 hover:bg-paper-hover">
      {showDelete ? (
        <div className="flex items-center justify-between bg-red-light border border-red rounded-sm p-3">
          <p className="text-sm text-red-dark font-medium">Remove this broadcast?</p>
          <div className="flex gap-2">
            <button onClick={() => setShowDelete(false)}
              className="px-3 py-1 text-xs border border-paper-border rounded-sm hover:bg-white">Cancel</button>
            <button onClick={() => { setShowDelete(false); onDelete(); }}
              className="px-3 py-1 text-xs bg-red text-white rounded-sm hover:bg-red-dark">Remove</button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-medium text-ink">{broadcast.title}</h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${audienceCls}`}>
                {broadcast.audience}
              </span>
              {broadcast.zone && (
                <Badge variant="info" className="text-xs">{broadcast.zone}</Badge>
              )}
            </div>
            <p className="text-sm text-ink-muted line-clamp-2 mb-2">{broadcast.message}</p>
            <div className="flex items-center gap-3 text-xs text-ink-muted">
              <span className="flex items-center gap-1"><Users size={11} />{broadcast.sentBy.name}</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock size={11} />
                {new Date(broadcast.createdAt).toLocaleString('en-SG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
          <button onClick={() => setShowDelete(true)}
            className="shrink-0 p-2 text-ink-muted hover:text-red hover:bg-red-light rounded-sm transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Broadcast Composer with AI assistance ─────────────────────────────────────
function BroadcastComposer({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    title: '',
    message: '',
    audience: 'all' as BroadcastAudience,
    zone: '',
    incidentId: '',
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);
  const [step, setStep] = useState<'compose' | 'preview'>('compose');

  const { data: incidentsData } = useIncidents({ limit: 20 });
  const incidents = incidentsData?.incidents || [];
  const { mutate: createBroadcast, isPending } = useCreateBroadcast();

  const selectedIncident = incidents.find(i => i.id === form.incidentId);

  const handleAIDraft = async () => {
    setAiLoading(true);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const token = localStorage.getItem('quickaid-auth')
      ? JSON.parse(localStorage.getItem('quickaid-auth') || '{}').state?.accessToken
      : null;

    // Build context for AI
    const context = selectedIncident
      ? `Incident: ${selectedIncident.title}. Type: ${selectedIncident.type}. Severity: ${selectedIncident.severity === 1 ? 'Critical' : selectedIncident.severity === 2 ? 'High' : 'Medium'}. Location: ${selectedIncident.locationText}. Description: ${selectedIncident.description}`
      : 'General emergency broadcast for the public.';

    try {
      const response = await fetch(`${API_URL}/api/ai/broadcast-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ context, audience: form.audience, incidentId: form.incidentId }),
      });

      if (response.ok) {
        const data = await response.json();
        setForm(f => ({ ...f, title: data.title || f.title, message: data.message || f.message }));
        setAiGenerated(true);
      } else {
        // Fallback mock if endpoint not ready
        const mockTitle = selectedIncident
          ? `⚠ ${selectedIncident.type.toUpperCase()} ALERT: ${selectedIncident.locationText}`
          : '⚠ Emergency Alert';
        const mockMsg = selectedIncident
          ? `An emergency incident has been reported at ${selectedIncident.locationText}. ${selectedIncident.description} Authorities are responding. Please follow official instructions, avoid the area, and call 995 if you witness any immediate danger. Stay tuned to official channels for updates.`
          : 'An emergency situation has been identified in your area. Please follow official instructions from SCDF, SPF, and local authorities. Avoid unnecessary travel. Call 995 for fire/medical and 999 for police emergencies. Stay informed via 938Live and Gov.sg.';
        setForm(f => ({ ...f, title: mockTitle, message: mockMsg }));
        setAiGenerated(true);
      }
    } catch {
      const mockTitle = selectedIncident ? `⚠ ${selectedIncident.title}` : '⚠ Emergency Alert';
      const mockMsg = selectedIncident
        ? `An emergency has been reported at ${selectedIncident.locationText}. Please stay clear of the area. Authorities are on scene. Call 995 for emergencies.`
        : 'An emergency has been identified. Please remain alert and follow instructions from official authorities.';
      setForm(f => ({ ...f, title: mockTitle, message: mockMsg }));
      setAiGenerated(true);
    } finally {
      setAiLoading(false);
    }
  };

  const handlePublish = () => {
    createBroadcast(
      { title: form.title, message: form.message, audience: form.audience, zone: form.zone || undefined, incidentId: form.incidentId || undefined },
      { onSuccess }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-sm w-full max-w-2xl max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-paper-border flex items-center justify-between sticky top-0 bg-white">
          <h2 className="font-semibold text-ink flex items-center gap-2">
            <Megaphone size={18} /> {step === 'compose' ? 'Compose Broadcast' : 'Preview & Publish'}
          </h2>
          <button onClick={onClose} className="text-ink-muted hover:text-ink"><X size={20} /></button>
        </div>

        {step === 'compose' ? (
          <div className="p-6 space-y-5">
            {/* Audience */}
            <div>
              <label className="block text-sm font-medium text-ink mb-2">Audience *</label>
              <div className="grid grid-cols-3 gap-3">
                {AUDIENCE_OPTIONS.map(opt => (
                  <button key={opt.value} type="button"
                    onClick={() => setForm(f => ({ ...f, audience: opt.value }))}
                    className={`p-3 rounded-sm border-2 text-left transition-all ${
                      form.audience === opt.value ? 'border-navy bg-navy-light' : 'border-paper-border hover:border-navy-border'
                    }`}>
                    <div className="flex items-center gap-2 mb-1 text-ink">{opt.icon}<span className="text-sm font-semibold">{opt.label}</span></div>
                    <p className="text-xs text-ink-muted">{opt.desc}</p>
                  </button>
                ))}
              </div>
              {form.audience === 'zone' && (
                <input type="text" placeholder="Zone name (e.g. Jurong West)" value={form.zone}
                  onChange={e => setForm(f => ({ ...f, zone: e.target.value }))}
                  className="mt-2 w-full px-3 py-2 border border-paper-border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-navy"
                />
              )}
            </div>

            {/* Link to incident */}
            <div>
              <label className="block text-sm font-medium text-ink mb-2">Link to Incident (optional)</label>
              <select value={form.incidentId}
                onChange={e => setForm(f => ({ ...f, incidentId: e.target.value }))}
                className="w-full px-3 py-2 border border-paper-border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-navy bg-white">
                <option value="">— No linked incident —</option>
                {incidents.map(i => (
                  <option key={i.id} value={i.id}>[{i.ticketNumber}] {i.title} ({i.locationText})</option>
                ))}
              </select>
              {selectedIncident && (
                <div className="mt-2 p-3 bg-paper rounded-sm text-xs text-ink-muted">
                  <span className="font-semibold text-ink">{selectedIncident.title}</span> — {selectedIncident.locationText} · Severity: {selectedIncident.severity === 1 ? 'Critical' : selectedIncident.severity === 2 ? 'High' : 'Medium'}
                </div>
              )}
            </div>

            {/* AI Draft button */}
            <div className="flex items-center justify-between bg-paper rounded-sm p-4 border border-paper-border">
              <div>
                <p className="text-sm font-semibold text-ink flex items-center gap-2">
                  <Sparkles size={16} className="text-teal" /> AI Draft Assistant
                </p>
                <p className="text-xs text-ink-muted mt-0.5">
                  {form.incidentId
                    ? 'Generate a broadcast based on the linked incident data.'
                    : 'Generate a general emergency broadcast template.'}
                </p>
              </div>
              <button onClick={handleAIDraft} disabled={aiLoading}
                className="flex items-center gap-2 px-4 py-2 bg-teal text-white text-sm font-semibold rounded-sm hover:bg-teal-dark disabled:opacity-50 transition-colors whitespace-nowrap">
                {aiLoading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating…</>
                ) : (
                  <><Sparkles size={14} /> {aiGenerated ? 'Regenerate' : 'Generate Draft'}</>
                )}
              </button>
            </div>

            {aiGenerated && (
              <div className="flex items-center gap-2 text-xs text-teal bg-teal-light rounded-sm px-3 py-2">
                <CheckCircle size={13} /> Draft generated — review and edit below before publishing.
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Title *</label>
              <input type="text" required value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. ⚠ Flood Advisory — Jurong West"
                className="w-full px-3 py-2 border border-paper-border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-navy"
              />
            </div>

            {/* Message */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-ink">Message *</label>
                <span className="text-xs text-ink-muted">{form.message.length} chars</span>
              </div>
              <textarea required rows={6} value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                placeholder="Write your broadcast message here, or use AI to generate a draft…"
                className="w-full px-3 py-2 border border-paper-border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-navy resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={onClose} className="flex-1 px-4 py-2 border border-paper-border rounded-sm text-sm hover:bg-paper-hover">Cancel</button>
              <button
                onClick={() => setStep('preview')}
                disabled={!form.title || !form.message}
                className="flex-1 px-4 py-2 bg-navy text-white rounded-sm text-sm hover:bg-navy-dark disabled:opacity-50 transition-colors">
                Preview →
              </button>
            </div>
          </div>
        ) : (
          /* Preview step */
          <div className="p-6 space-y-5">
            <div className="bg-amber-light border border-amber rounded-sm p-4">
              <p className="text-sm font-semibold text-amber-dark mb-1">Review before publishing</p>
              <p className="text-xs text-amber-dark opacity-80">Once published, this broadcast will be visible to the selected audience immediately.</p>
            </div>

            <div className="bg-white border-2 border-navy rounded-sm overflow-hidden">
              <div className="bg-navy px-4 py-3 flex items-center gap-2">
                <Megaphone size={16} className="text-white" />
                <span className="text-white text-sm font-semibold">Broadcast Preview</span>
                <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  form.audience === 'all' ? 'bg-white text-navy' :
                  form.audience === 'responders' ? 'bg-teal text-white' : 'bg-amber text-white'
                }`}>{form.audience}{form.zone ? ` · ${form.zone}` : ''}</span>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-ink mb-2">{form.title || '(No title)'}</h3>
                <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">{form.message || '(No message)'}</p>
                {selectedIncident && (
                  <div className="mt-3 pt-3 border-t border-paper-border text-xs text-ink-muted">
                    Related: {selectedIncident.ticketNumber} — {selectedIncident.title}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep('compose')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-paper-border rounded-sm text-sm hover:bg-paper-hover">
                <Edit2 size={14} /> Edit
              </button>
              <button onClick={handlePublish} disabled={isPending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-teal text-white rounded-sm text-sm hover:bg-teal-dark disabled:opacity-50 transition-colors font-semibold">
                {isPending ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Publishing…</>
                ) : (
                  <><Send size={14} /> Publish Now</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}