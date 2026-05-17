import { useState, useEffect } from 'react';
import { useIncidents } from '../../api/incidents';
import { useHospitals, useVolunteers } from '../../api/resources';
import { IncidentListItem, Hospital, Volunteer } from '../../types';
import { MapPin, Navigation, AlertTriangle, Activity, UserCheck, Filter, Maximize2, Layers, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';
import { Badge } from '../../components/Badge';
import { StatusBadge } from '../../components/StatusBadge';
import { formatIncidentType, formatSeverity, getSeverityBorderColor } from '../../lib/formatters';

type FilterType = 'all' | 'incidents' | 'hospitals' | 'volunteers';
type SeverityFilter = 'all' | 'critical' | 'high' | 'medium' | 'low';

export function MapView() {
  console.log('MapView rendered');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [zoom, setZoom] = useState(12);
  const [center, setCenter] = useState({ lat: 40.7128, lng: -74.0060 });
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: incidentsData, isLoading: incidentsLoading, refetch: refetchIncidents } = useIncidents({ limit: 50, queryKey: ['incidents-map', refreshKey] });
  const { data: hospitalsData, isLoading: hospitalsLoading, refetch: refetchHospitals } = useHospitals({ queryKey: ['hospitals-map', refreshKey] });
  const { data: volunteersData, isLoading: volunteersLoading, refetch: refetchVolunteers } = useVolunteers({ queryKey: ['volunteers-map', refreshKey] });

  const incidents = incidentsData?.incidents || [];
  const hospitals = hospitalsData?.hospitals || [];
  const volunteers = volunteersData?.volunteers || [];

  const filteredIncidents = incidents.filter(incident => {
    if (severityFilter === 'all') return true;
    return incident.severity === severityFilter;
  });

  const showIncidents = filterType === 'all' || filterType === 'incidents';
  const showHospitals = filterType === 'all' || filterType === 'hospitals';
  const showVolunteers = filterType === 'all' || filterType === 'volunteers';

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    refetchIncidents();
    refetchHospitals();
    refetchVolunteers();
  };

  const handleZoomIn = () => setZoom(Math.min(zoom + 1, 18));
  const handleZoomOut = () => setZoom(Math.max(zoom - 1, 10));

  // Simulated map coordinates for demo (in real app, use real map library)
  const generateMapPoints = () => {
    const points: any[] = [];

    if (showIncidents) {
      filteredIncidents.forEach((incident, index) => {
        const lat = center.lat + (Math.sin(index * 0.5) * 0.05);
        const lng = center.lng + (Math.cos(index * 0.5) * 0.05);
        points.push({
          type: 'incident',
          data: incident,
          lat, lng,
          x: 50 + (Math.sin(index * 0.5) * 30),
          y: 50 + (Math.cos(index * 0.5) * 30)
        });
      });
    }

    if (showHospitals) {
      hospitals.forEach((hospital, index) => {
        const lat = center.lat + (Math.sin(index * 0.7 + 1) * 0.04);
        const lng = center.lng + (Math.cos(index * 0.7 + 1) * 0.04);
        points.push({
          type: 'hospital',
          data: hospital,
          lat, lng,
          x: 50 + (Math.sin(index * 0.7 + 1) * 25),
          y: 50 + (Math.cos(index * 0.7 + 1) * 25)
        });
      });
    }

    if (showVolunteers) {
      volunteers.filter(v => v.isAvailable).forEach((volunteer, index) => {
        const lat = center.lat + (Math.sin(index * 0.9 + 2) * 0.03);
        const lng = center.lng + (Math.cos(index * 0.9 + 2) * 0.03);
        points.push({
          type: 'volunteer',
          data: volunteer,
          lat, lng,
          x: 50 + (Math.sin(index * 0.9 + 2) * 20),
          y: 50 + (Math.cos(index * 0.9 + 2) * 20)
        });
      });
    }

    return points;
  };

  const mapPoints = generateMapPoints();

  return (
    <div className="h-screen flex flex-col">
      <div className="text-center py-8">
        <h1 className="text-2xl font-semibold text-ink mb-2">Incident Map</h1>
        <p className="text-sm text-ink-muted">If you can see this, the component is rendering!</p>
      </div>
      {/* Header */}
      <div className="bg-white border-b border-paper-border px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-ink mb-1">Incident Map</h1>
            <p className="text-sm text-ink-muted">Real-time location tracking and resource visualization</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-sm hover:bg-navy-dark transition-colors"
            >
              <RefreshCw size={16} className={incidentsLoading || hospitalsLoading || volunteersLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-paper-border rounded-sm hover:bg-paper-hover transition-colors">
              <Maximize2 size={16} />
              Fullscreen
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-ink-muted" />
            <span className="text-sm font-medium text-ink">Show:</span>
            <FilterButton
              active={filterType === 'all'}
              onClick={() => setFilterType('all')}
              label="All"
            />
            <FilterButton
              active={filterType === 'incidents'}
              onClick={() => setFilterType('incidents')}
              label="Incidents"
              count={incidents.length}
            />
            <FilterButton
              active={filterType === 'hospitals'}
              onClick={() => setFilterType('hospitals')}
              label="Hospitals"
              count={hospitals.length}
            />
            <FilterButton
              active={filterType === 'volunteers'}
              onClick={() => setFilterType('volunteers')}
              label="Volunteers"
              count={volunteers.filter(v => v.isAvailable).length}
            />
          </div>

          {showIncidents && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-ink">Severity:</span>
              <SeverityFilter
                active={severityFilter === 'all'}
                onClick={() => setSeverityFilter('all')}
                label="All"
              />
              <SeverityFilter
                active={severityFilter === 'critical'}
                onClick={() => setSeverityFilter('critical')}
                label="Critical"
                color="red"
              />
              <SeverityFilter
                active={severityFilter === 'high'}
                onClick={() => setSeverityFilter('high')}
                label="High"
                color="orange"
              />
              <SeverityFilter
                active={severityFilter === 'medium'}
                onClick={() => setSeverityFilter('medium')}
                label="Medium"
                color="yellow"
              />
              <SeverityFilter
                active={severityFilter === 'low'}
                onClick={() => setSeverityFilter('low')}
                label="Low"
                color="green"
              />
            </div>
          )}
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative bg-slate-100 overflow-hidden">
        {/* Simulated Map Background */}
        <div className="absolute inset-0 opacity-20">
          <svg width="100%" height="100%">
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94a3b8" strokeWidth="0.5"/>
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Map Points */}
        <div className="absolute inset-0">
          {mapPoints.map((point, index) => (
            <MapMarker
              key={index}
              point={point}
              onClick={() => setSelectedItem(point)}
              isSelected={selectedItem === point}
            />
          ))}
        </div>

        {/* Map Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <button
            onClick={handleZoomIn}
            className="p-2 bg-white border border-paper-border rounded-sm hover:bg-paper-hover shadow-sm"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 bg-white border border-paper-border rounded-sm hover:bg-paper-hover shadow-sm"
          >
            <ZoomOut size={16} />
          </button>
          <button
            onClick={() => {
              setZoom(12);
              setCenter({ lat: 40.7128, lng: -74.0060 });
            }}
            className="p-2 bg-white border border-paper-border rounded-sm hover:bg-paper-hover shadow-sm"
            title="Reset View"
          >
            <Navigation size={16} />
          </button>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white border border-paper-border rounded-sm p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Layers size={16} className="text-ink-muted" />
            <span className="text-sm font-medium text-ink">Legend</span>
          </div>
          <div className="space-y-2 text-xs">
            <LegendItem icon={<AlertTriangle size={14} className="text-red" />} label="Critical Incident" />
            <LegendItem icon={<AlertTriangle size={14} className="text-orange" />} label="High Severity" />
            <LegendItem icon={<AlertTriangle size={14} className="text-yellow" />} label="Medium Severity" />
            <LegendItem icon={<Activity size={14} className="text-teal" />} label="Hospital" />
            <LegendItem icon={<UserCheck size={14} className="text-navy" />} label="Available Volunteer" />
          </div>
        </div>

        {/* Selected Item Detail */}
        {selectedItem && (
          <div className="absolute bottom-4 right-4 bg-white border border-paper-border rounded-sm p-4 shadow-sm max-w-sm">
            <SelectedItemDetail
              item={selectedItem}
              onClose={() => setSelectedItem(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function MapMarker({ point, onClick, isSelected }: {
  point: any;
  onClick: () => void;
  isSelected: boolean;
}) {
  const getMarkerStyle = () => {
    switch (point.type) {
      case 'incident':
        return {
          bgColor: point.data.severity === 'critical' ? 'bg-red' :
                   point.data.severity === 'high' ? 'bg-orange' :
                   point.data.severity === 'medium' ? 'bg-yellow' : 'bg-green',
          icon: <AlertTriangle size={16} className="text-white" />
        };
      case 'hospital':
        return {
          bgColor: 'bg-teal',
          icon: <Activity size={16} className="text-white" />
        };
      case 'volunteer':
        return {
          bgColor: 'bg-navy',
          icon: <UserCheck size={16} className="text-white" />
        };
      default:
        return {
          bgColor: 'bg-gray',
          icon: <MapPin size={16} className="text-white" />
        };
    }
  };

  const { bgColor, icon } = getMarkerStyle();

  return (
    <button
      onClick={onClick}
      className={`absolute transform -translate-x-1/2 -translate-y-1/2 ${bgColor} rounded-full p-2 shadow-lg hover:scale-110 transition-transform ${isSelected ? 'ring-2 ring-navy ring-offset-2' : ''}`}
      style={{
        left: `${point.x}%`,
        top: `${point.y}%`,
        zIndex: isSelected ? 100 : 1
      }}
    >
      {icon}
      <div className={`absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 ${bgColor} rotate-45 -z-10`} />
    </button>
  );
}

function FilterButton({ active, onClick, label, count }: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-sm rounded-sm transition-colors ${
        active
          ? 'bg-navy text-white'
          : 'bg-white text-ink hover:bg-paper-hover border border-paper-border'
      }`}
    >
      {label}
      {count !== undefined && ` (${count})`}
    </button>
  );
}

function SeverityFilter({ active, onClick, label, color }: {
  active: boolean;
  onClick: () => void;
  label: string;
  color?: string;
}) {
  const colorClass = color === 'red' ? 'text-red' :
                    color === 'orange' ? 'text-orange' :
                    color === 'yellow' ? 'text-yellow' :
                    color === 'green' ? 'text-green' : 'text-ink';

  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-sm rounded-sm transition-colors ${
        active
          ? 'bg-white text-ink border-2 border-current font-medium'
          : 'text-ink-muted hover:text-ink'
      } ${colorClass}`}
    >
      {label}
    </button>
  );
}

function LegendItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 text-ink">
      {icon}
      <span>{label}</span>
    </div>
  );
}

function SelectedItemDetail({ item, onClose }: { item: any; onClose: () => void }) {
  return (
    <div>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {item.type === 'incident' && <AlertTriangle size={16} className="text-red" />}
          {item.type === 'hospital' && <Activity size={16} className="text-teal" />}
          {item.type === 'volunteer' && <UserCheck size={16} className="text-navy" />}
          <span className="text-sm font-medium text-ink capitalize">{item.type}</span>
        </div>
        <button
          onClick={onClose}
          className="text-ink-muted hover:text-ink"
        >
          ×
        </button>
      </div>

      {item.type === 'incident' && (
        <div className="space-y-2">
          <h3 className="font-medium text-ink">{item.data.title}</h3>
          <div className="flex items-center gap-2">
            <StatusBadge status={item.data.status} />
            <Badge variant="info" className="text-xs">{formatIncidentType(item.data.type)}</Badge>
            <Badge variant="warning" className="text-xs">{formatSeverity(item.data.severity)}</Badge>
          </div>
          <p className="text-sm text-ink-muted">{item.data.locationText}</p>
          <p className="text-xs text-ink-muted">{new Date(item.data.createdAt).toLocaleString()}</p>
        </div>
      )}

      {item.type === 'hospital' && (
        <div className="space-y-2">
          <h3 className="font-medium text-ink">{item.data.name}</h3>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-ink-muted">Beds:</span>
              <span className="font-medium">{item.data.availableBeds}/{item.data.totalBeds}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-ink-muted">ICU:</span>
              <span className="font-medium">{item.data.icuAvailable}</span>
            </div>
          </div>
          <p className="text-sm text-ink-muted">{item.data.address}</p>
          <p className="text-sm text-ink-muted">{item.data.phone}</p>
        </div>
      )}

      {item.type === 'volunteer' && (
        <div className="space-y-2">
          <h3 className="font-medium text-ink">{item.data.fullName}</h3>
          <div className="flex items-center gap-2">
            <Badge variant="success" className="text-xs">Available</Badge>
          </div>
          <p className="text-sm text-ink-muted">{item.data.phone}</p>
          <div className="flex flex-wrap gap-1">
            {item.data.skills.map((skill: string) => (
              <Badge key={skill} variant="info" className="text-xs">{skill}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}