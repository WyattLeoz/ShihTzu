import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useIncidents } from '../../api/incidents';
import { useHospitals, useVolunteers } from '../../api/resources';
import { useBroadcasts } from '../../api/broadcasts';
import { StatusBadge } from '../../components/StatusBadge';
import { formatIncidentType, formatSeverity, getSeverityBorderColor } from '../../lib/formatters';
import { IncidentListItem, Hospital, Volunteer, Broadcast } from '../../types';
import { MapPin, Clock, Phone, Bed, Activity, UserCheck, AlertTriangle } from 'lucide-react';

export function PublicPortal() {
  const [activeTab, setActiveTab] = useState<'incidents' | 'resources' | 'broadcasts'>('incidents');
  const [resourceTab, setResourceTab] = useState<'hospitals' | 'volunteers'>('hospitals');

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
        <Link to="/login" className="text-sm text-teal hover:text-teal-dark">
          Login
        </Link>
      </div>

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