import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useIncidents } from '../../api/incidents';
import { useHospitals, useVolunteers } from '../../api/resources';
import { useBroadcasts } from '../../api/broadcasts';
import { useCreateIncident } from '../../api/incidents';
import { StatusBadge } from '../../components/StatusBadge';
import { formatIncidentType, formatSeverity, getSeverityBorderColor } from '../../lib/formatters';
import { IncidentListItem, Hospital, Volunteer, Broadcast, IncidentType, Severity } from '../../types';
import { MapPin, Clock, Phone, Bed, Activity, UserCheck, AlertTriangle, Plus, Send, X, Navigation, UserPlus } from 'lucide-react';
import { VolunteerRegistration } from './VolunteerRegistration';

export function PublicPortal() {
  const [activeTab, setActiveTab] = useState<'incidents' | 'resources' | 'broadcasts'>('incidents');
  const [resourceTab, setResourceTab] = useState<'hospitals' | 'volunteers'>('hospitals');
  const [showReportForm, setShowReportForm] = useState(false);
  const [showVolunteerForm, setShowVolunteerForm] = useState(false);

  // API queries
  const { data: incidentsData, isLoading: incidentsLoading, error: incidentsError } = useIncidents({ limit: 20 });
  const { data: hospitalsData, isLoading: hospitalsLoading, error: hospitalsError } = useHospitals();
  const { data: volunteersData, isLoading: volunteersLoading, error: volunteersError } = useVolunteers();
  const { data: broadcastsData, isLoading: broadcastsLoading, error: broadcastsError } = useBroadcasts({ limit: 20 });

  const incidents = incidentsData?.incidents || [];
  const hospitals = hospitalsData?.hospitals || [];
  const volunteers = volunteersData?.volunteers || [];
  const broadcasts = broadcastsData?.broadcasts || [];

  return (
    <div className="min-h-screen bg-paper max-w-md mx-auto border-x border-paper-border">
      {/* Header */}
      <div className="h-12 bg-white border-b border-paper-border flex items-center justify-between px-4">
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

      {/* Incident Report Form Modal */}
      {showReportForm && (
        <IncidentReportForm onClose={() => setShowReportForm(false)} />
      )}

      {/* Volunteer Registration Modal */}
      {showVolunteerForm && (
        <VolunteerRegistration
          onClose={() => setShowVolunteerForm(false)}
          onSuccess={() => {
            // Refresh volunteer list after successful registration
          }}
        />
      )}

      {/* Main Tabs */}
      <div className="bg-white border-b border-paper-border">
        <div className="flex">
          <button
            onClick={() => setActiveTab('incidents')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'incidents'
                ? 'text-teal border-b-2 border-teal'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            Incidents
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'resources'
                ? 'text-teal border-b-2 border-teal'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            Resources
          </button>
          <button
            onClick={() => setActiveTab('broadcasts')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'broadcasts'
                ? 'text-teal border-b-2 border-teal'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            Broadcasts
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'incidents' && (
          <IncidentsList
            incidents={incidents}
            isLoading={incidentsLoading}
            error={incidentsError}
          />
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
          <BroadcastsList
            broadcasts={broadcasts}
            isLoading={broadcastsLoading}
            error={broadcastsError}
          />
        )}
      </div>
    </div>
  );
}

function IncidentsList({ incidents, isLoading, error }: {
  incidents: IncidentListItem[];
  isLoading: boolean;
  error: any;
}) {
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal"></div>
        <p className="text-ink-muted mt-2">Loading incidents...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red">Error loading incidents</p>
      </div>
    );
  }

  if (incidents.length === 0) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="mx-auto h-12 w-12 text-ink-muted mb-2" />
        <p className="text-ink-muted">No incidents reported</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {incidents.map((incident) => (
        <div
          key={incident.id}
          className={`bg-white border border-paper-border rounded-sm p-4 hover:bg-paper-hover transition-colors cursor-pointer ${getSeverityBorderColor(incident.severity)}`}
        >
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-medium text-ink text-sm">{incident.title}</h3>
            <StatusBadge status={incident.status} />
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-ink-muted">
              <MapPin size={14} />
              <span className="truncate">{incident.locationText}</span>
            </div>
            <div className="flex items-center gap-2 text-ink-muted">
              <Clock size={14} />
              <span>{new Date(incident.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-1 bg-paper-border text-ink-muted rounded">
                {formatIncidentType(incident.type)}
              </span>
              <span className="text-xs px-2 py-1 bg-paper-border text-ink-muted rounded">
                {formatSeverity(incident.severity)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ResourcesSection({ resourceTab, setResourceTab, hospitals, volunteers, hospitalsLoading, volunteersLoading, hospitalsError, volunteersError }: {
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
      {/* Resource sub-tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setResourceTab('hospitals')}
          className={`flex-1 py-2 text-sm font-medium rounded-sm transition-colors ${
            resourceTab === 'hospitals'
              ? 'bg-teal text-white'
              : 'bg-white text-ink hover:bg-paper-hover'
          }`}
        >
          Hospitals
        </button>
        <button
          onClick={() => setResourceTab('volunteers')}
          className={`flex-1 py-2 text-sm font-medium rounded-sm transition-colors ${
            resourceTab === 'volunteers'
              ? 'bg-teal text-white'
              : 'bg-white text-ink hover:bg-paper-hover'
          }`}
        >
          Volunteers
        </button>
      </div>

      {resourceTab === 'hospitals' ? (
        <HospitalsList
          hospitals={hospitals}
          isLoading={hospitalsLoading}
          error={hospitalsError}
        />
      ) : (
        <VolunteersList
          volunteers={volunteers}
          isLoading={volunteersLoading}
          error={volunteersError}
        />
      )}
    </div>
  );
}

function HospitalsList({ hospitals, isLoading, error }: {
  hospitals: Hospital[];
  isLoading: boolean;
  error: any;
}) {
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal"></div>
        <p className="text-ink-muted mt-2">Loading hospitals...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red">Error loading hospitals</p>
      </div>
    );
  }

  if (hospitals.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-ink-muted">No hospitals available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {hospitals.map((hospital) => (
        <div
          key={hospital.id}
          className="bg-white border border-paper-border rounded-sm p-4 hover:bg-paper-hover transition-colors"
        >
          <h3 className="font-medium text-ink text-sm mb-2">{hospital.name}</h3>
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between text-ink-muted">
              <span className="flex items-center gap-2">
                <Bed size={14} />
                Beds
              </span>
              <span className="text-ink font-medium">
                {hospital.availableBeds}/{hospital.totalBeds}
              </span>
            </div>
            <div className="flex items-center justify-between text-ink-muted">
              <span className="flex items-center gap-2">
                <Activity size={14} />
                ICU Available
              </span>
              <span className="text-ink font-medium">{hospital.icuAvailable}</span>
            </div>
            <div className="flex items-center justify-between text-ink-muted">
              <span>Trauma Bays</span>
              <span className="text-ink font-medium">{hospital.traumaBays}</span>
            </div>
            <div className="text-xs text-ink-muted mt-2">
              {hospital.address}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function VolunteersList({ volunteers, isLoading, error }: {
  volunteers: Volunteer[];
  isLoading: boolean;
  error: any;
}) {
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal"></div>
        <p className="text-ink-muted mt-2">Loading volunteers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red">Error loading volunteers</p>
      </div>
    );
  }

  if (volunteers.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-ink-muted">No volunteers available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {volunteers.map((volunteer) => (
        <div
          key={volunteer.id}
          className={`bg-white border border-paper-border rounded-sm p-4 hover:bg-paper-hover transition-colors ${volunteer.isAvailable ? 'border-l-4 border-l-teal' : ''}`}
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-medium text-ink text-sm">{volunteer.fullName}</h3>
              <div className="flex items-center gap-2 text-xs text-ink-muted mt-1">
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
            {volunteer.skills.map((skill) => (
              <span
                key={skill}
                className="text-xs px-2 py-1 bg-paper-border text-ink-muted rounded"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function BroadcastsList({ broadcasts, isLoading, error }: {
  broadcasts: Broadcast[];
  isLoading: boolean;
  error: any;
}) {
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal"></div>
        <p className="text-ink-muted mt-2">Loading broadcasts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red">Error loading broadcasts</p>
      </div>
    );
  }

  if (broadcasts.length === 0) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="mx-auto h-12 w-12 text-ink-muted mb-2" />
        <p className="text-ink-muted">No broadcasts available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {broadcasts.map((broadcast) => (
        <div
          key={broadcast.id}
          className="bg-white border border-paper-border rounded-sm p-4 hover:bg-paper-hover transition-colors"
        >
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-medium text-ink text-sm">{broadcast.title}</h3>
            <span className="text-xs px-2 py-1 bg-amber-light text-amber-dark rounded">
              {broadcast.audience.toUpperCase()}
            </span>
          </div>
          <p className="text-sm text-ink-muted mb-2">{broadcast.message}</p>
          <div className="flex items-center gap-2 text-xs text-ink-muted">
            <span>By: {broadcast.sentBy.name}</span>
            <span>•</span>
            <span>{new Date(broadcast.createdAt).toLocaleString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function IncidentReportForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    locationText: '',
    type: 'medical' as IncidentType,
    severity: 'medium' as Severity,
    estimatedCasualties: '',
    contactInfo: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const { mutate: createIncident } = useCreateIncident();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await createIncident({
        title: formData.title,
        description: formData.description,
        locationText: formData.locationText,
        type: formData.type,
        severity: formData.severity,
        estimatedCasualties: formData.estimatedCasualties ? parseInt(formData.estimatedCasualties) : undefined,
        contactInfo: formData.contactInfo
      });

      setSubmitSuccess(true);
      setTimeout(() => {
        onClose();
        setSubmitSuccess(false);
        setFormData({
          title: '',
          description: '',
          locationText: '',
          type: 'medical',
          severity: 'medium',
          estimatedCasualties: '',
          contactInfo: ''
        });
      }, 2000);
    } catch (error) {
      console.error('Failed to submit incident:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-sm p-6 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-teal-light rounded-full flex items-center justify-center mx-auto mb-4">
            <Send size={32} className="text-teal" />
          </div>
          <h3 className="text-lg font-semibold text-ink mb-2">Incident Reported</h3>
          <p className="text-sm text-ink-muted mb-4">
            Your incident has been submitted and will be reviewed by emergency responders.
          </p>
          <p className="text-xs text-ink-muted">
            You will receive updates as your incident is processed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-sm max-w-md w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="h-14 bg-navy flex items-center justify-between px-4">
          <h2 className="text-white font-semibold">Report Incident</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-white/80"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Brief description of the incident"
              className="w-full px-3 py-2 border border-paper-border rounded-sm focus:outline-none focus:ring-2 focus:ring-teal"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Incident Type *
            </label>
            <select
              required
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as IncidentType })}
              className="w-full px-3 py-2 border border-paper-border rounded-sm focus:outline-none focus:ring-2 focus:ring-teal"
            >
              <option value="medical">Medical Emergency</option>
              <option value="fire">Fire</option>
              <option value="accident">Traffic Accident</option>
              <option value="natural_disaster">Natural Disaster</option>
              <option value="security">Security Threat</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Severity */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Severity *
            </label>
            <select
              required
              value={formData.severity}
              onChange={(e) => setFormData({ ...formData, severity: e.target.value as Severity })}
              className="w-full px-3 py-2 border border-paper-border rounded-sm focus:outline-none focus:ring-2 focus:ring-teal"
            >
              <option value="low">Low - Minor incident</option>
              <option value="medium">Medium - Requires attention</option>
              <option value="high">High - Urgent response needed</option>
              <option value="critical">Critical - Life-threatening</option>
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Location *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={formData.locationText}
                onChange={(e) => setFormData({ ...formData, locationText: e.target.value })}
                placeholder="Address or location description"
                className="w-full px-3 py-2 border border-paper-border rounded-sm focus:outline-none focus:ring-2 focus:ring-teal pr-10"
              />
              <Navigation size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-ink-muted" />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Description *
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide details about what happened..."
              rows={4}
              className="w-full px-3 py-2 border border-paper-border rounded-sm focus:outline-none focus:ring-2 focus:ring-teal resize-none"
            />
          </div>

          {/* Estimated Casualties */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Estimated Casualties (if applicable)
            </label>
            <input
              type="number"
              min="0"
              value={formData.estimatedCasualties}
              onChange={(e) => setFormData({ ...formData, estimatedCasualties: e.target.value })}
              placeholder="Number of people affected"
              className="w-full px-3 py-2 border border-paper-border rounded-sm focus:outline-none focus:ring-2 focus:ring-teal"
            />
          </div>

          {/* Contact Info */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Contact Information *
            </label>
            <input
              type="text"
              required
              value={formData.contactInfo}
              onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
              placeholder="Your name and phone number"
              className="w-full px-3 py-2 border border-paper-border rounded-sm focus:outline-none focus:ring-2 focus:ring-teal"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3 bg-teal text-white font-medium rounded-sm hover:bg-teal-dark transition-colors disabled:bg-teal-light disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send size={16} />
                Submit Incident Report
              </>
            )}
          </button>

          {/* Disclaimer */}
          <p className="text-xs text-ink-muted text-center">
            By submitting this report, you agree that the information provided is accurate to the best of your knowledge.
            False reports may result in legal consequences.
          </p>
        </form>
      </div>
    </div>
  );
}