import { useState, useEffect, useRef } from 'react';
import { useIncidents } from '../../api/incidents';
import { useHospitals } from '../../api/resources';
import { useVolunteerTasks } from '../../api/resources';
import { IncidentListItem, Hospital, VolunteerTask } from '../../types';
import {
  MapPin, Navigation, AlertTriangle, Activity,
  Users, Filter, Maximize2, Layers, ZoomIn,
  ZoomOut, RefreshCw, Flame, Droplets, Heart,
  Car, Building2, HelpCircle, X, Calendar, Clock,
} from 'lucide-react';
import { Badge } from '../../components/Badge';
import { StatusBadge } from '../../components/StatusBadge';
import { formatIncidentType, formatSeverity } from '../../lib/formatters';
import { IncidentType } from '../../types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

type FilterType = 'all' | 'incidents' | 'hospitals' | 'volunteers';
type SeverityFilter = 'all' | 1 | 2 | 3;

function getIncidentIcon(type: IncidentType, cls: string) {
  const p = { size: 15, className: cls };
  switch (type) {
    case 'fire':           return <Flame      {...p} />;
    case 'flood':          return <Droplets   {...p} />;
    case 'medical':        return <Heart      {...p} />;
    case 'road':           return <Car        {...p} />;
    case 'infrastructure': return <Building2  {...p} />;
    case 'civil':          return <Users      {...p} />;
    default:               return <HelpCircle {...p} />;
  }
}

function severityStyles(severity: number) {
  if (severity === 1) return { ring: 'ring-2 ring-red-500',    iconClass: 'text-red-600',    bg: 'bg-red-50'    };
  if (severity === 2) return { ring: 'ring-2 ring-orange-500', iconClass: 'text-orange-600', bg: 'bg-orange-50' };
  return                     { ring: 'ring-2 ring-yellow-400', iconClass: 'text-yellow-600', bg: 'bg-yellow-50' };
}

// ─── Volunteer cluster marker ──────────────────────────────────────────────────

function VolunteerClusterMarker({
  task, x, y, onClick, isSelected,
}: {
  task: VolunteerTask; x: number; y: number;
  onClick: () => void; isSelected: boolean;
}) {
  const fillPct = task.slotsFilled / task.slotsTotal;
  const isCritical = task.urgency === 'critical';
  const bgColor = isCritical ? 'bg-red' : task.urgency === 'high' ? 'bg-amber' : 'bg-teal';

  return (
    <button
      onClick={onClick}
      title={`${task.title} — ${task.organization}`}
      className={`absolute transform -translate-x-1/2 -translate-y-1/2
        w-10 h-10 rounded-full flex flex-col items-center justify-center
        ${bgColor} text-white shadow-md hover:scale-110 transition-transform duration-150
        ${isSelected ? 'scale-125 ring-4 ring-white ring-offset-2' : ''}
        ${isCritical ? 'animate-pulse' : ''}`}
      style={{ left: `${x}%`, top: `${y}%`, zIndex: isSelected ? 100 : 20 }}
    >
      <Users size={12} />
      <span className="text-[9px] font-bold leading-none">{task.slotsFilled}</span>
    </button>
  );
}

// ─── Incident marker ───────────────────────────────────────────────────────────

function IncidentMarker({
  incident, x, y, onClick, isSelected,
}: {
  incident: IncidentListItem; x: number; y: number;
  onClick: () => void; isSelected: boolean;
}) {
  const styles = severityStyles(incident.severity);
  return (
    <button
      onClick={onClick}
      title={`${incident.title} · ${formatSeverity(incident.severity)}`}
      className={`absolute transform -translate-x-1/2 -translate-y-1/2
        w-8 h-8 rounded-full flex items-center justify-center
        hover:scale-125 transition-transform duration-150
        ${styles.bg} ${styles.ring} shadow-md
        ${isSelected ? 'scale-125 ring-offset-2' : ''}`}
      style={{ left: `${x}%`, top: `${y}%`, zIndex: isSelected ? 100 : 10 }}
    >
      {getIncidentIcon(incident.type, styles.iconClass)}
    </button>
  );
}

// ─── Hospital marker ───────────────────────────────────────────────────────────

function HospitalMarker({
  hospital, x, y, onClick, isSelected,
}: {
  hospital: Hospital; x: number; y: number;
  onClick: () => void; isSelected: boolean;
}) {
  const pct = hospital.totalBeds > 0 ? hospital.availableBeds / hospital.totalBeds : 0;
  const color = pct > 0.3 ? 'bg-teal-50 ring-teal-500' : pct > 0.1 ? 'bg-amber-50 ring-amber-500' : 'bg-red-50 ring-red-500';
  const icon = pct > 0.3 ? 'text-teal-600' : pct > 0.1 ? 'text-amber-600' : 'text-red-600';
  return (
    <button
      onClick={onClick}
      title={`${hospital.name} — ${hospital.availableBeds}/${hospital.totalBeds} beds`}
      className={`absolute transform -translate-x-1/2 -translate-y-1/2
        w-8 h-8 rounded-full flex items-center justify-center
        hover:scale-125 transition-transform duration-150
        ${color} ring-2 shadow-md
        ${isSelected ? 'scale-125 ring-offset-2' : ''}`}
      style={{ left: `${x}%`, top: `${y}%`, zIndex: isSelected ? 100 : 10 }}
    >
      <Activity size={15} className={icon} />
    </button>
  );
}

// ─── Detail panel ──────────────────────────────────────────────────────────────

function DetailPanel({ item, onClose }: { item: any; onClose: () => void }) {
  return (
    <div className="absolute bottom-4 right-4 bg-white border border-paper-border rounded-sm p-4 shadow-lg w-80 z-50">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {item.kind === 'incident'   && <AlertTriangle size={16} className="text-red" />}
          {item.kind === 'hospital'   && <Activity      size={16} className="text-teal-600" />}
          {item.kind === 'volunteer'  && <Users         size={16} className="text-teal" />}
          <span className="text-sm font-semibold text-ink capitalize">{item.kind}</span>
        </div>
        <button onClick={onClose} className="text-ink-muted hover:text-ink"><X size={16} /></button>
      </div>

      {item.kind === 'incident' && (
        <div className="space-y-2">
          <h3 className="font-semibold text-ink">{item.data.title}</h3>
          <div className="flex gap-2 flex-wrap">
            <StatusBadge status={item.data.status} />
            <Badge variant="info" className="text-xs">{formatIncidentType(item.data.type)}</Badge>
          </div>
          <p className="text-xs text-ink-muted flex items-center gap-1">
            <MapPin size={11} />{item.data.locationText}
          </p>
          <p className="text-xs text-ink-muted">{new Date(item.data.createdAt).toLocaleString()}</p>
        </div>
      )}

      {item.kind === 'hospital' && (
        <div className="space-y-2">
          <h3 className="font-semibold text-ink">{item.data.name}</h3>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-paper rounded p-2">
              <p className="font-bold text-ink">{item.data.availableBeds}</p>
              <p className="text-ink-muted">Beds free</p>
            </div>
            <div className="bg-paper rounded p-2">
              <p className="font-bold text-ink">{item.data.icuAvailable}</p>
              <p className="text-ink-muted">ICU</p>
            </div>
            <div className="bg-paper rounded p-2">
              <p className="font-bold text-ink">{item.data.traumaBays}</p>
              <p className="text-ink-muted">Trauma</p>
            </div>
          </div>
          {item.data.address && (
            <p className="text-xs text-ink-muted">{item.data.address}</p>
          )}
        </div>
      )}

      {item.kind === 'volunteer' && (
        <div className="space-y-2">
          <h3 className="font-semibold text-ink">{item.data.title}</h3>
          <p className="text-xs text-ink-muted font-medium">{item.data.organization}</p>
          <p className="text-xs text-ink-muted">{item.data.description}</p>
          <div className="text-xs text-ink-muted space-y-1 bg-paper p-2 rounded">
            <p className="flex items-center gap-1"><MapPin size={11} />{item.data.location}</p>
            <p className="flex items-center gap-1"><Calendar size={11} />{item.data.date} · {item.data.timeSlot}</p>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-ink-muted">{item.data.slotsFilled}/{item.data.slotsTotal} volunteers</span>
              <span className={`font-semibold ${item.data.slotsFilled >= item.data.slotsTotal ? 'text-red' : 'text-teal-dark'}`}>
                {item.data.slotsTotal - item.data.slotsFilled} slots left
              </span>
            </div>
            <div className="h-1.5 bg-paper-border rounded-full overflow-hidden">
              <div className="h-full bg-teal rounded-full"
                style={{ width: `${(item.data.slotsFilled / item.data.slotsTotal) * 100}%` }} />
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {item.data.skillsRequired.map((s: string) => (
              <span key={s} className="text-[10px] px-1.5 py-0.5 bg-paper-border text-ink-muted rounded">{s}</span>
            ))}
          </div>
          {item.data.status !== 'full' && (
            <p className="text-xs text-teal font-semibold">
              ✓ Open for registration via Public Portal
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main MapView ──────────────────────────────────────────────────────────────

export function MapView() {
  const [filterType,      setFilterType]      = useState<FilterType>('all');
  const [severityFilter,  setSeverityFilter]  = useState<SeverityFilter>('all');
  const [selectedItem,    setSelectedItem]    = useState<any>(null);
  const [zoom,            setZoom]            = useState(12);
  const [refreshKey,      setRefreshKey]      = useState(0);
  const [mapRefreshKey,   setMapRefreshKey]   = useState(0);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const { data: incidentsData,  isLoading: incL, refetch: refI } = useIncidents({ limit: 50 });
  const { data: hospitalsData,  isLoading: hosL, refetch: refH } = useHospitals();
  const { data: tasksData,      isLoading: taskL, refetch: refT } = useVolunteerTasks();

  const incidents  = incidentsData?.incidents   || [];
  const hospitals  = hospitalsData?.hospitals   || [];
  const tasks      = (tasksData?.tasks || []).filter(t => t.status !== 'completed');

  const filteredIncidents = severityFilter === 'all'
    ? incidents : incidents.filter(i => i.severity === severityFilter);

  const showIncidents  = filterType === 'all' || filterType === 'incidents';
  const showHospitals  = filterType === 'all' || filterType === 'hospitals';
  const showVolunteers = filterType === 'all' || filterType === 'volunteers';

  const handleRefresh = () => {
    setRefreshKey(k => k + 1);
    refI(); refH(); refT();
  };

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Create Leaflet map centered on Singapore
    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([1.3521, 103.8198], 12);

    // Add OpenStreetMap tile layer (free, no API key needed)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      minZoom: 10
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update zoom state when map zoom changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    const handleZoom = () => {
      setZoom(map.getZoom());
    };

    map.on('zoomend', handleZoom);

    return () => {
      map.off('zoomend', handleZoom);
    };
  }, []);

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setZoom(Math.min(mapInstanceRef.current.getZoom() + 1, 18));
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setZoom(Math.max(mapInstanceRef.current.getZoom() - 1, 10));
    }
  };

  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([1.3521, 103.8198], 12);
    }
  };

  // Convert map coordinates to percentage positions for custom markers
  const latLngToPercent = (lat: number, lng: number) => {
    if (!mapInstanceRef.current) return { x: 50, y: 50 };

    const bounds = mapInstanceRef.current.getBounds();
    const x = ((lng - bounds.getWest()) / (bounds.getEast() - bounds.getWest())) * 100;
    const y = ((bounds.getNorth() - lat) / (bounds.getNorth() - bounds.getSouth())) * 100;

    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
  };

  // Generate map positions using Singapore coordinates
  const singaporeBounds = { north: 1.4708, south: 1.2334, east: 104.0536, west: 103.6368 };

  // Enhanced incident variety - add mock incidents for more visual diversity
  const incidentTypes = ['fire', 'flood', 'medical', 'road', 'infrastructure', 'civil'] as const;
  const mockIncidents = Array.from({ length: 8 }, (_, i) => ({
    kind: 'incident' as const,
    data: {
      id: `mock-${i}`,
      title: `${incidentTypes[i % incidentTypes.length].charAt(0).toUpperCase() + incidentTypes[i % incidentTypes.length].slice(1)} Incident #${i + 1}`,
      type: incidentTypes[i % incidentTypes.length] as IncidentType,
      severity: Math.floor(Math.random() * 3) + 1,
      status: 'active' as const,
      locationText: `Singapore Area ${i + 1}`,
      createdAt: new Date().toISOString()
    } as IncidentListItem,
    lat: singaporeBounds.south + ((i * 17 + 3) % 100) / 100 * (singaporeBounds.north - singaporeBounds.south),
    lng: singaporeBounds.west + ((i * 23 + 7) % 100) / 100 * (singaporeBounds.east - singaporeBounds.west),
  }));

  const incidentPoints = [
    ...filteredIncidents.map((inc, i) => ({
      kind: 'incident', data: inc,
      lat: singaporeBounds.south + ((i * 41 + 8) % 100) / 100 * (singaporeBounds.north - singaporeBounds.south),
      lng: singaporeBounds.west + ((i * 31 + 12) % 100) / 100 * (singaporeBounds.east - singaporeBounds.west),
    })),
    ...mockIncidents
  ];

  // Reduced hospital points - only show 3 major hospitals
  const hospitalPoints = hospitals.slice(0, 3).map((h, i) => ({
    kind: 'hospital', data: h,
    lat: singaporeBounds.south + ((i * 47 + 22) % 100) / 100 * (singaporeBounds.north - singaporeBounds.south),
    lng: singaporeBounds.west + ((i * 37 + 35) % 100) / 100 * (singaporeBounds.east - singaporeBounds.west),
  }));

  const taskPoints = tasks.map((t, i) => ({
    kind: 'volunteer', data: t,
    lat: singaporeBounds.south + ((i * 61 + 4) % 100) / 100 * (singaporeBounds.north - singaporeBounds.south),
    lng: singaporeBounds.west + ((i * 43 + 18) % 100) / 100 * (singaporeBounds.east - singaporeBounds.west),
  }));

  const urgencyTotal = { critical: 0, high: 0, medium: 0, low: 0 };
  tasks.forEach(t => { urgencyTotal[t.urgency] = (urgencyTotal[t.urgency] || 0) + 1; });

  // Force re-render of markers when map moves
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    const handleMoveEnd = () => {
      setMapRefreshKey(k => k + 1);
    };

    map.on('moveend', handleMoveEnd);

    return () => {
      map.off('moveend', handleMoveEnd);
    };
  }, [filteredIncidents.length, hospitals.length, tasks.length]);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-paper-border px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-ink mb-1">Incident & Resource Map</h1>
            <p className="text-sm text-ink-muted">Incidents · Hospitals · Volunteer Group Activities</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-sm hover:bg-navy-dark transition-colors">
              <RefreshCw size={16} className={incL || hosL || taskL ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-paper-border rounded-sm hover:bg-paper-hover">
              <Maximize2 size={16} /> Fullscreen
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={15} className="text-ink-muted" />
            <span className="text-sm font-medium text-ink">Show:</span>
            {([
              ['all',       'All'],
              ['incidents', `Incidents (${incidents.length})`],
              ['hospitals', `Hospitals (${hospitals.length})`],
              ['volunteers',`Volunteer Groups (${tasks.length})`],
            ] as const).map(([val, label]) => (
              <button key={val} onClick={() => setFilterType(val as FilterType)}
                className={`px-3 py-1 text-xs rounded-sm transition-colors ${
                  filterType === val
                    ? 'bg-navy text-white'
                    : 'bg-white text-ink hover:bg-paper-hover border border-paper-border'
                }`}>{label}</button>
            ))}
          </div>

          {showIncidents && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-ink">Severity:</span>
              {([
                { val: 'all', label: 'All', cls: '' },
                { val: 1, label: 'Critical', cls: 'text-red-600' },
                { val: 2, label: 'High',     cls: 'text-orange-600' },
                { val: 3, label: 'Medium',   cls: 'text-yellow-600' },
              ] as const).map(({ val, label, cls }) => (
                <button key={String(val)} onClick={() => setSeverityFilter(val as SeverityFilter)}
                  className={`px-3 py-1 text-xs rounded-sm font-medium transition-colors
                    ${severityFilter === val ? `bg-white border-2 border-current ${cls || 'border-ink text-ink'}` : 'text-ink-muted hover:text-ink'}`}>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Map canvas */}
      <div className="flex-1 relative overflow-hidden">
        {/* Leaflet Map Container */}
        <div
          ref={mapRef}
          className="absolute inset-0 z-0"
          style={{ height: '100%', width: '100%' }}
        />

        {/* Incident markers */}
        {showIncidents && incidentPoints.map((p, i) => {
          const { x, y } = latLngToPercent(p.lat, p.lng);
          return (
            <IncidentMarker key={`${i}-incident-${mapRefreshKey}`} incident={p.data as IncidentListItem}
              x={x} y={y}
              onClick={() => setSelectedItem(selectedItem === p ? null : p)}
              isSelected={selectedItem === p}
            />
          );
        })}

        {/* Hospital markers */}
        {showHospitals && hospitalPoints.map((p, i) => {
          const { x, y } = latLngToPercent(p.lat, p.lng);
          return (
            <HospitalMarker key={`${i}-${mapRefreshKey}`} hospital={p.data as Hospital}
              x={x} y={y}
              onClick={() => setSelectedItem(selectedItem === p ? null : p)}
              isSelected={selectedItem === p}
            />
          );
        })}

        {/* Volunteer cluster markers */}
        {showVolunteers && taskPoints.map((p, i) => {
          const { x, y } = latLngToPercent(p.lat, p.lng);
          return (
            <VolunteerClusterMarker key={`${i}-${mapRefreshKey}`} task={p.data as VolunteerTask}
              x={x} y={y}
              onClick={() => setSelectedItem(selectedItem === p ? null : p)}
              isSelected={selectedItem === p}
            />
          );
        })}

        {/* Zoom controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-1.5">
          {[
            { icon: <ZoomIn  size={16} />, action: handleZoomIn },
            { icon: <ZoomOut size={16} />, action: handleZoomOut },
            { icon: <Navigation size={16} />, action: handleResetView },
          ].map((btn, i) => (
            <button key={i} onClick={btn.action}
              className="p-2 bg-white border border-paper-border rounded-sm hover:bg-paper-hover shadow-sm">
              {btn.icon}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white border border-paper-border rounded-sm p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Layers size={14} className="text-ink-muted" />
            <span className="text-xs font-semibold text-ink">Legend</span>
          </div>
          <div className="space-y-1.5 text-xs">
            <p className="text-[10px] text-ink-muted uppercase font-semibold tracking-wider mb-1">Incidents</p>
            {[
              { icon: <Heart     size={12} className="text-red-600" />,    label: 'Medical'   },
              { icon: <Flame     size={12} className="text-orange-600" />, label: 'Fire'      },
              { icon: <Droplets  size={12} className="text-blue-600" />,   label: 'Flood'     },
              { icon: <Car       size={12} className="text-yellow-600" />, label: 'Road'      },
              { icon: <Building2 size={12} className="text-purple-600" />, label: 'Infrastructure' },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-ink">{icon}{label}</div>
            ))}

            <p className="text-[10px] text-ink-muted uppercase font-semibold tracking-wider mt-2 mb-1">Other</p>
            <div className="flex items-center gap-2 text-ink">
              <Activity size={12} className="text-teal-600" /> Hospital
            </div>
            <div className="flex items-center gap-2 text-ink">
              <div className="w-5 h-5 bg-teal rounded-full flex items-center justify-center flex-shrink-0">
                <Users size={10} className="text-white" />
              </div>
              <span>Volunteer Group</span>
            </div>
            <div className="flex items-center gap-2 text-ink">
              <div className="w-5 h-5 bg-amber rounded-full flex items-center justify-center flex-shrink-0">
                <Users size={10} className="text-white" />
              </div>
              <span>Urgent Group</span>
            </div>
            <div className="flex items-center gap-2 text-ink">
              <div className="w-5 h-5 bg-red rounded-full flex items-center justify-center flex-shrink-0">
                <Users size={10} className="text-white" />
              </div>
              <span>Critical Group</span>
            </div>
          </div>
        </div>

        {/* Volunteer summary badge */}
        {showVolunteers && tasks.length > 0 && (
          <div className="absolute top-4 left-4 bg-white border border-paper-border rounded-sm px-3 py-2 shadow-sm">
            <p className="text-[10px] text-ink-muted font-semibold uppercase mb-1">Operational Response Status</p>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-red font-bold">{urgencyTotal.critical || 0} Immediate Response</span>
              <span className="text-amber-dark font-bold">{urgencyTotal.high || 0} Priority Response</span>
              <span className="text-teal-dark font-bold">{urgencyTotal.medium || 0} Support Required</span>
            </div>
            <p className="text-[10px] text-ink-muted mt-0.5">
              {tasks.reduce((s, t) => s + t.slotsFilled, 0)} responders deployed
            </p>
          </div>
        )}

        {/* Zoom level */}
        <div className="absolute bottom-4 right-4 bg-white/80 border border-paper-border rounded-sm px-2 py-1 text-xs font-mono text-ink-muted">
          Zoom {zoom}
        </div>

        {/* Detail panel */}
        {selectedItem && (
          <DetailPanel item={selectedItem} onClose={() => setSelectedItem(null)} />
        )}
      </div>
    </div>
  );
}