import { useState } from 'react';
import { useIncidents } from '../../api/incidents';
import { useHospitals, useVolunteers } from '../../api/resources';
import { IncidentListItem, Hospital, Volunteer } from '../../types';
import {
  MapPin,
  Navigation,
  AlertTriangle,
  Activity,
  UserCheck,
  Filter,
  Maximize2,
  Layers,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Flame,
  Droplets,
  Heart,
  Car,
  Building2,
  Users,
  HelpCircle,
  X,
} from 'lucide-react';
import { Badge } from '../../components/Badge';
import { StatusBadge } from '../../components/StatusBadge';
import { formatIncidentType, formatSeverity } from '../../lib/formatters';
import { IncidentType } from '../../types';

type FilterType = 'all' | 'incidents' | 'hospitals' | 'volunteers';
type SeverityFilter = 'all' | 1 | 2 | 3;

// ─── Icon + colour per incident type ─────────────────────────────────────────

function getIncidentIcon(type: IncidentType, iconClass: string) {
  switch (type) {
    case 'fire':           return <Flame      size={15} className={iconClass} />;
    case 'flood':          return <Droplets   size={15} className={iconClass} />;
    case 'medical':        return <Heart      size={15} className={iconClass} />;
    case 'road':           return <Car        size={15} className={iconClass} />;
    case 'infrastructure': return <Building2  size={15} className={iconClass} />;
    case 'civil':          return <Users      size={15} className={iconClass} />;
    default:               return <HelpCircle size={15} className={iconClass} />;
  }
}

// severity: 1 = Critical, 2 = High, 3 = Medium
function severityStyles(severity: number) {
  if (severity === 1)
    return {
      ring: 'ring-2 ring-red-500',
      iconClass: 'text-red-600',
      bg: 'bg-red-50',
      dot: 'bg-red-500',
      label: 'text-red-600',
    };
  if (severity === 2)
    return {
      ring: 'ring-2 ring-orange-500',
      iconClass: 'text-orange-600',
      bg: 'bg-orange-50',
      dot: 'bg-orange-500',
      label: 'text-orange-600',
    };
  return {
    ring: 'ring-2 ring-yellow-400',
    iconClass: 'text-yellow-600',
    bg: 'bg-yellow-50',
    dot: 'bg-yellow-400',
    label: 'text-yellow-600',
  };
}

// ─── Map Marker ───────────────────────────────────────────────────────────────

function MapMarker({
  point,
  onClick,
  isSelected,
}: {
  point: any;
  onClick: () => void;
  isSelected: boolean;
}) {
  let markerContent: React.ReactNode;
  let containerClass: string;

  if (point.type === 'incident') {
    const styles = severityStyles(point.data.severity);
    markerContent = getIncidentIcon(point.data.type, styles.iconClass);
    containerClass = `${styles.bg} ${styles.ring} shadow-md`;
  } else if (point.type === 'hospital') {
    markerContent = <Activity size={15} className="text-teal-600" />;
    containerClass = 'bg-teal-50 ring-2 ring-teal-500 shadow-md';
  } else if (point.type === 'volunteer') {
    markerContent = <UserCheck size={15} className="text-navy" />;
    containerClass = 'bg-blue-50 ring-2 ring-navy shadow-md';
  } else {
    markerContent = <MapPin size={15} className="text-gray-500" />;
    containerClass = 'bg-white ring-2 ring-gray-400 shadow-md';
  }

  return (
    <button
      onClick={onClick}
      title={
        point.type === 'incident'
          ? `${point.data.title} · ${formatSeverity(point.data.severity)}`
          : point.type === 'hospital'
          ? point.data.name
          : point.data.fullName
      }
      className={`
        absolute transform -translate-x-1/2 -translate-y-1/2
        w-8 h-8 rounded-full flex items-center justify-center
        hover:scale-125 transition-transform duration-150
        ${containerClass}
        ${isSelected ? 'scale-125 ring-offset-2' : ''}
      `}
      style={{
        left: `${point.x}%`,
        top:  `${point.y}%`,
        zIndex: isSelected ? 100 : 10,
      }}
    >
      {markerContent}
      {/* pointer tip */}
      <span
        className="absolute -bottom-1.5 left-1/2 -translate-x-1/2
          w-0 h-0 border-l-4 border-r-4 border-t-4
          border-l-transparent border-r-transparent border-t-current"
        style={{ color: 'inherit', opacity: 0.6 }}
      />
    </button>
  );
}

// ─── Legend Item ──────────────────────────────────────────────────────────────

function LegendItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-ink">
      {icon}
      <span>{label}</span>
    </div>
  );
}

// ─── Filter buttons ───────────────────────────────────────────────────────────

function FilterBtn({
  active,
  onClick,
  label,
  count,
}: {
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

// ─── Selected Item Detail ─────────────────────────────────────────────────────

function SelectedItemDetail({
  item,
  onClose,
}: {
  item: any;
  onClose: () => void;
}) {
  return (
    <div>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {item.type === 'incident' && (
            <span className={severityStyles(item.data.severity).iconClass}>
              {getIncidentIcon(
                item.data.type,
                severityStyles(item.data.severity).iconClass
              )}
            </span>
          )}
          {item.type === 'hospital'  && <Activity  size={16} className="text-teal-600" />}
          {item.type === 'volunteer' && <UserCheck size={16} className="text-navy" />}
          <span className="text-sm font-medium text-ink capitalize">{item.type}</span>
        </div>
        <button onClick={onClose} className="text-ink-muted hover:text-ink">
          <X size={16} />
        </button>
      </div>

      {item.type === 'incident' && (
        <div className="space-y-2">
          <h3 className="font-medium text-ink">{item.data.title}</h3>
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={item.data.status} />
            <Badge variant="info" className="text-xs">
              {formatIncidentType(item.data.type)}
            </Badge>
            <Badge variant="warning" className="text-xs">
              {formatSeverity(item.data.severity)}
            </Badge>
          </div>
          <p className="text-sm text-ink-muted">{item.data.locationText}</p>
          <p className="text-xs text-ink-muted">
            {new Date(item.data.createdAt).toLocaleString()}
          </p>
        </div>
      )}

      {item.type === 'hospital' && (
        <div className="space-y-2">
          <h3 className="font-medium text-ink">{item.data.name}</h3>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-ink-muted">Beds:</span>
              <span className="font-medium">
                {item.data.availableBeds}/{item.data.totalBeds}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-ink-muted">ICU:</span>
              <span className="font-medium">{item.data.icuAvailable}</span>
            </div>
          </div>
          <p className="text-sm text-ink-muted">{item.data.address}</p>
        </div>
      )}

      {item.type === 'volunteer' && (
        <div className="space-y-2">
          <h3 className="font-medium text-ink">{item.data.fullName}</h3>
          <Badge variant="success" className="text-xs">Available</Badge>
          <p className="text-sm text-ink-muted">{item.data.phone}</p>
          <div className="flex flex-wrap gap-1">
            {item.data.skills.map((skill: string) => (
              <Badge key={skill} variant="info" className="text-xs">
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main MapView ─────────────────────────────────────────────────────────────

export function MapView() {
  const [filterType, setFilterType]       = useState<FilterType>('all');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [selectedItem, setSelectedItem]   = useState<any>(null);
  const [zoom, setZoom]                   = useState(12);
  const [center]                          = useState({ lat: 1.3521, lng: 103.8198 });
  const [refreshKey, setRefreshKey]       = useState(0);

  const { data: incidentsData,  isLoading: incL, refetch: refI } = useIncidents({ limit: 50 });
  const { data: hospitalsData,  isLoading: hosL, refetch: refH } = useHospitals();
  const { data: volunteersData, isLoading: volL, refetch: refV } = useVolunteers();

  const incidents  = incidentsData?.incidents   || [];
  const hospitals  = hospitalsData?.hospitals   || [];
  const volunteers = volunteersData?.volunteers || [];

  const filteredIncidents =
    severityFilter === 'all'
      ? incidents
      : incidents.filter((i) => i.severity === severityFilter);

  const showIncidents  = filterType === 'all' || filterType === 'incidents';
  const showHospitals  = filterType === 'all' || filterType === 'hospitals';
  const showVolunteers = filterType === 'all' || filterType === 'volunteers';

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
    refI(); refH(); refV();
  };

  // Distribute markers across the viewport
  const mapPoints = (() => {
    const pts: any[] = [];

    if (showIncidents) {
      filteredIncidents.forEach((incident, i) => {
        pts.push({
          type: 'incident',
          data: incident,
          x: 20 + ((i * 37 + 10) % 65),
          y: 20 + ((i * 29 + 15) % 60),
        });
      });
    }
    if (showHospitals) {
      hospitals.forEach((hospital, i) => {
        pts.push({
          type: 'hospital',
          data: hospital,
          x: 15 + ((i * 43 + 25) % 70),
          y: 15 + ((i * 31 + 40) % 65),
        });
      });
    }
    if (showVolunteers) {
      volunteers
        .filter((v) => v.isAvailable)
        .forEach((volunteer, i) => {
          pts.push({
            type: 'volunteer',
            data: volunteer,
            x: 10 + ((i * 53 + 5) % 80),
            y: 10 + ((i * 41 + 20) % 75),
          });
        });
    }
    return pts;
  })();

  return (
    <div className="h-screen flex flex-col">
      {/* ── Header ── */}
      <div className="bg-white border-b border-paper-border px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-ink mb-1">Incident Map</h1>
            <p className="text-sm text-ink-muted">
              Real-time location tracking and resource visualisation
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-navy text-white
                rounded-sm hover:bg-navy-dark transition-colors"
            >
              <RefreshCw
                size={16}
                className={incL || hosL || volL ? 'animate-spin' : ''}
              />
              Refresh
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 border border-paper-border
                rounded-sm hover:bg-paper-hover transition-colors"
            >
              <Maximize2 size={16} />
              Fullscreen
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={16} className="text-ink-muted" />
            <span className="text-sm font-medium text-ink">Show:</span>
            <FilterBtn active={filterType === 'all'}       onClick={() => setFilterType('all')}       label="All" />
            <FilterBtn active={filterType === 'incidents'} onClick={() => setFilterType('incidents')} label="Incidents"  count={incidents.length} />
            <FilterBtn active={filterType === 'hospitals'} onClick={() => setFilterType('hospitals')} label="Hospitals"  count={hospitals.length} />
            <FilterBtn active={filterType === 'volunteers'} onClick={() => setFilterType('volunteers')} label="Volunteers" count={volunteers.filter((v) => v.isAvailable).length} />
          </div>

          {showIncidents && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-ink">Severity:</span>
              {([
                { val: 'all', label: 'All',      cls: '' },
                { val: 1,     label: 'Critical', cls: 'text-red-600' },
                { val: 2,     label: 'High',     cls: 'text-orange-600' },
                { val: 3,     label: 'Medium',   cls: 'text-yellow-600' },
              ] as const).map(({ val, label, cls }) => (
                <button
                  key={String(val)}
                  onClick={() => setSeverityFilter(val as SeverityFilter)}
                  className={`px-3 py-1 text-sm rounded-sm transition-colors font-medium
                    ${severityFilter === val
                      ? `bg-white border-2 border-current ${cls || 'border-ink text-ink'}`
                      : `text-ink-muted hover:text-ink`}
                  `}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Map Canvas ── */}
      <div className="flex-1 relative overflow-hidden" style={{ background: '#e8edf3' }}>
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-30">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Road-like lines for aesthetics */}
        <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none">
          <line x1="0" y1="40%" x2="100%" y2="40%" stroke="#64748b" strokeWidth="3" />
          <line x1="0" y1="70%" x2="100%" y2="70%" stroke="#64748b" strokeWidth="2" />
          <line x1="30%" y1="0" x2="30%" y2="100%" stroke="#64748b" strokeWidth="3" />
          <line x1="65%" y1="0" x2="65%" y2="100%" stroke="#64748b" strokeWidth="2" />
        </svg>

        {/* Markers */}
        <div className="absolute inset-0">
          {mapPoints.map((point, idx) => (
            <MapMarker
              key={idx}
              point={point}
              onClick={() =>
                setSelectedItem((prev: any) => (prev === point ? null : point))
              }
              isSelected={selectedItem === point}
            />
          ))}
        </div>

        {/* Zoom controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-1.5">
          <button
            onClick={() => setZoom((z) => Math.min(z + 1, 18))}
            className="p-2 bg-white border border-paper-border rounded-sm
              hover:bg-paper-hover shadow-sm"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(z - 1, 10))}
            className="p-2 bg-white border border-paper-border rounded-sm
              hover:bg-paper-hover shadow-sm"
          >
            <ZoomOut size={16} />
          </button>
          <button
            onClick={() => setZoom(12)}
            className="p-2 bg-white border border-paper-border rounded-sm
              hover:bg-paper-hover shadow-sm"
            title="Reset zoom"
          >
            <Navigation size={16} />
          </button>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white border border-paper-border
          rounded-sm p-3 shadow-sm space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <Layers size={14} className="text-ink-muted" />
            <span className="text-xs font-semibold text-ink">Legend</span>
          </div>

          {/* Incident types */}
          <p className="text-[10px] text-ink-muted uppercase tracking-wider">Incidents</p>
          <LegendItem icon={<Heart      size={13} className="text-red-600" />}    label="Medical" />
          <LegendItem icon={<Flame      size={13} className="text-orange-600" />} label="Fire" />
          <LegendItem icon={<Droplets   size={13} className="text-blue-600" />}   label="Flood" />
          <LegendItem icon={<Car        size={13} className="text-yellow-600" />} label="Road / Accident" />
          <LegendItem icon={<Building2  size={13} className="text-purple-600" />} label="Infrastructure" />
          <LegendItem icon={<Users      size={13} className="text-pink-600" />}   label="Civil" />

          {/* Severity dots */}
          <p className="text-[10px] text-ink-muted uppercase tracking-wider mt-1">Severity ring</p>
          <LegendItem icon={<span className="w-3 h-3 rounded-full ring-2 ring-red-500 inline-block" />}    label="Critical" />
          <LegendItem icon={<span className="w-3 h-3 rounded-full ring-2 ring-orange-500 inline-block" />} label="High" />
          <LegendItem icon={<span className="w-3 h-3 rounded-full ring-2 ring-yellow-400 inline-block" />} label="Medium" />

          {/* Other layers */}
          <p className="text-[10px] text-ink-muted uppercase tracking-wider mt-1">Other</p>
          <LegendItem icon={<Activity  size={13} className="text-teal-600" />} label="Hospital" />
          <LegendItem icon={<UserCheck size={13} className="text-navy" />}     label="Volunteer (available)" />
        </div>

        {/* Selected item detail panel */}
        {selectedItem && (
          <div className="absolute bottom-4 right-4 bg-white border border-paper-border
            rounded-sm p-4 shadow-lg w-72">
            <SelectedItemDetail
              item={selectedItem}
              onClose={() => setSelectedItem(null)}
            />
          </div>
        )}

        {/* Zoom badge */}
        <div className="absolute top-4 left-4 bg-white/80 border border-paper-border
          rounded-sm px-2 py-1 text-xs font-mono text-ink-muted">
          Zoom {zoom}
        </div>
      </div>
    </div>
  );
}