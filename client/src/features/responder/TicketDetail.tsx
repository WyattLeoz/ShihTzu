import { useParams, useNavigate } from 'react-router-dom';
import { useIncident, useApproveIncident, useUpdateIncidentStatus, useAddIncidentUpdate } from '../../api/incidents';
import { useHospitals } from '../../api/resources';
import { useClaudeStream } from '../../hooks/useClaudeStream';
import { formatTimeAgo, formatDateTime } from '../../lib/utils';
import { formatSeverity, getSeverityBorderColor } from '../../lib/formatters';
import { StatusBadge } from '../../components/StatusBadge';
import { Button } from '../../components/Button';
import { ArrowLeft, Edit, AlertTriangle, CheckCircle, Clock, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

export function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = useIncident(id!);
  const { data: hospitalsData } = useHospitals();
  const { approveIncident, isPending: isApproving } = useApproveIncident(id!);
  const { updateStatus, isPending: isUpdatingStatus } = useUpdateIncidentStatus(id!);
  const { addUpdate, isPending: isAddingNote } = useAddIncidentUpdate(id!);
  const { streamedText, isStreaming, isComplete, options, error: aiError, trigger, reset } = useClaudeStream();

  const incident = data?.incident;
  const timeline = data?.timeline || [];

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (error || !incident) {
    return <div className="p-6">Error loading incident</div>;
  }

  const handleApprove = (optionIndex: number) => {
    approveIncident(optionIndex + 1);
  };

  const handleStatusChange = (newStatus: string) => {
    updateStatus(newStatus as any);
  };

  const handleAddNote = (content: string) => {
    addUpdate(content);
  };

  return (
    <div className="p-6">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/responder')}
          className="flex items-center gap-2 text-sm text-ink-muted hover:text-ink"
        >
          <ArrowLeft size={16} />
          Back to Queue
        </button>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Edit size={14} className="mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-xl font-mono font-semibold text-ink mb-1">
              {incident.ticketNumber}
            </h1>
            <div className="flex items-center gap-2">
              <StatusBadge status={incident.status} />
              <span
                className={`text-xs font-mono px-2 py-1 ${
                  incident.severity === 1
                    ? 'bg-red-light text-red-dark'
                    : incident.severity === 2
                      ? 'bg-amber-light text-amber-dark'
                      : 'bg-teal-light text-teal-dark'
                }`}
              >
                {formatSeverity(incident.severity)}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-ink-muted">
              Created {formatTimeAgo(incident.createdAt)}
            </div>
            <div className="text-xs text-ink-muted font-mono">
              {formatDateTime(incident.createdAt)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[58%_1fr] gap-6">
        {/* Left panel */}
        <div className="space-y-6">
          {/* Incident details */}
          <div className="bg-white border border-paper-border rounded-sm p-4">
            <h2 className="text-xs font-mono font-semibold text-ink-muted uppercase mb-4">
              Incident Details
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] font-mono text-ink-muted uppercase">Type</div>
                <div className="text-sm text-ink capitalize">{incident.type}</div>
              </div>
              <div>
                <div className="text-[10px] font-mono text-ink-muted uppercase">Location</div>
                <div className="text-sm text-ink">{incident.locationText}</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-[10px] font-mono text-ink-muted uppercase mb-1">Description</div>
              <div className="text-sm font-mono text-ink bg-paper-hover p-3 rounded-sm">
                {incident.description}
              </div>
            </div>
          </div>

          {/* AI Triage */}
          <div className="bg-white border border-paper-border rounded-sm p-4">
            <h2 className="text-xs font-mono font-semibold text-ink-muted uppercase mb-4">
              AI TRIAGE
            </h2>

            {!incident.aiTriageData && !isStreaming && !isComplete && (
              <div className="space-y-4">
                <p className="text-sm text-ink-muted">
                  Run AI triage to get ranked response options based on live hospital capacity and available resources.
                </p>
                {hospitalsData && (
                  <div className="flex gap-2 text-xs text-ink-muted">
                    <span>SGH {hospitalsData.hospitals[0]?.availableBeds || 0} beds available</span>
                    <span>·</span>
                    <span>20 volunteers on duty</span>
                  </div>
                )}
                <Button
                  onClick={() => trigger(incident.id)}
                  variant="primary"
                  size="lg"
                  className="w-full h-12"
                >
                  RUN AI TRIAGE
                </Button>
              </div>
            )}

            {isStreaming && (
              <div className="space-y-4">
                <div className="border-t-2 border-navy pt-3">
                  <h3 className="text-xs font-mono font-semibold text-teal uppercase mb-2">
                    AI ANALYSIS IN PROGRESS
                  </h3>
                  <div className="font-mono text-sm text-ink leading-relaxed min-h-[100px]">
                    {streamedText}
                    <span className="animate-pulse">█</span>
                  </div>
                </div>
                <div className="h-1 bg-paper-border rounded-full overflow-hidden">
                  <div className="h-full bg-navy animate-[pulse_1s_ease-in-out_infinite]" />
                </div>
              </div>
            )}

            {isComplete && options && (
              <div className="space-y-4">
                <div className="font-mono text-sm text-ink leading-relaxed">
                  {streamedText}
                </div>
                <div>
                  <h3 className="text-xs font-mono font-semibold text-ink-muted uppercase mb-3">
                    RESPONSE OPTIONS
                  </h3>
                  <div className="space-y-3">
                    {options.map((option, index) => (
                      <motion.div
                        key={option.rank}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.15 }}
                        className="border border-paper-border rounded-sm p-4 bg-white"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 bg-navy rounded-sm flex items-center justify-center">
                              <span className="text-white font-mono text-sm font-semibold">
                                {option.rank}
                              </span>
                            </div>
                            <h4 className="text-sm font-semibold text-ink">{option.action}</h4>
                          </div>
                          <span
                            className={`font-mono text-xs font-semibold ${
                              option.confidence >= 80
                                ? 'text-teal-dark'
                                : option.confidence >= 50
                                  ? 'text-amber-dark'
                                  : 'text-red-dark'
                            }`}
                          >
                            {option.confidence}
                          </span>
                        </div>
                        <div className="h-1.5 bg-paper-border rounded-full overflow-hidden mb-3">
                          <div
                            className={`h-full ${
                              option.confidence >= 80
                                ? 'bg-teal'
                                : option.confidence >= 50
                                  ? 'bg-amber'
                                  : 'bg-red'
                            }`}
                            style={{ width: `${option.confidence}%` }}
                          />
                        </div>
                        <p className="text-sm text-ink-muted mb-3">{option.rationale}</p>
                        {option.resources_required.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {option.resources_required.map((resource, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 bg-paper-hover text-xs font-mono text-ink-muted"
                              >
                                {resource}
                              </span>
                            ))}
                          </div>
                        )}
                        {option.notify.length > 0 && (
                          <div className="mb-3">
                            <div className="text-[10px] text-ink-muted uppercase mb-1">Will notify:</div>
                            <div className="text-xs text-ink">{option.notify.join(', ')}</div>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs text-ink-muted">
                            Est. ~{option.eta_minutes} min
                          </span>
                          {option.rank === 1 && !incident.approvedOption && (
                            <Button
                              onClick={() => handleApprove(0)}
                              isLoading={isApproving}
                              className="w-full h-10 rounded-sm"
                            >
                              APPROVE & DISPATCH
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {aiError && (
              <div className="text-sm text-red">
                AI triage failed: {aiError}
                <Button onClick={reset} variant="outline" size="sm" className="ml-2">
                  Retry
                </Button>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="bg-white border border-paper-border rounded-sm p-4">
            <h2 className="text-xs font-mono font-semibold text-ink-muted uppercase mb-4">
              Timeline
            </h2>
            <div className="space-y-4">
              {timeline.map((update, index) => (
                <div key={update.id} className="flex gap-3">
                  <div className="relative flex flex-col items-center">
                    <div
                      className={`
                        w-3 h-3 rounded-full ${
                          update.updateType === 'status_change'
                            ? 'bg-navy'
                            : update.updateType === 'dispatch'
                              ? 'bg-teal'
                              : update.updateType === 'note'
                                ? 'bg-ink-muted'
                                : 'bg-paper-border'
                        }
                      `}
                    />
                    {index < timeline.length - 1 && (
                      <div className="w-px h-full bg-paper-border mt-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[10px] text-ink-muted">
                        {formatDateTime(update.createdAt)}
                      </span>
                      {update.author && (
                        <span className="text-xs font-semibold text-ink">
                          {update.author.name}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-ink">{update.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Add note */}
            <div className="mt-4 pt-4 border-t border-paper-border">
              <textarea
                placeholder="Add a note..."
                rows={2}
                className="w-full px-3 py-2 border border-paper-border rounded-sm
                  text-sm placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-navy resize-none
                "
              />
              <div className="flex justify-end mt-2">
                <Button
                  size="sm"
                  onClick={() => handleAddNote('Sample note')}
                  isLoading={isAddingNote}
                >
                  Add Note
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Resources */}
          <div className="bg-white border border-paper-border rounded-sm p-4">
            <h2 className="text-xs font-mono font-semibold text-ink-muted uppercase mb-4">
              Resources
            </h2>
            <div className="space-y-3">
              {hospitalsData?.hospitals.map((hospital) => (
                <div key={hospital.id} className="pb-3 border-b border-paper-border last:border-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-semibold text-ink">{hospital.shortName}</span>
                    <span className="font-mono text-xs text-ink-muted">
                      {hospital.availableBeds} / {hospital.totalBeds}
                    </span>
                  </div>
                  <div className="h-1.5 bg-paper-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal"
                      style={{ width: `${(hospital.availableBeds / hospital.totalBeds) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-[10px] font-mono text-ink-muted">
                    <span>ICU: {hospital.icuAvailable}</span>
                    <span>Trauma: {hospital.traumaBays}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Map placeholder */}
          <div className="bg-white border border-paper-border rounded-sm p-4">
            <div className="h-[220px] bg-paper-hover rounded-sm flex items-center justify-center text-ink-muted text-sm">
              Map placeholder
            </div>
          </div>

          {/* Volunteers placeholder */}
          <div className="bg-white border border-paper-border rounded-sm p-4">
            <h2 className="text-xs font-mono font-semibold text-ink-muted uppercase mb-3">
              Volunteers on Duty
            </h2>
            <div className="text-sm text-ink-muted">Volunteer list placeholder</div>
          </div>
        </div>
      </div>
    </div>
  );
}