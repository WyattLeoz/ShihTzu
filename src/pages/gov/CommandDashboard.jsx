import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Radio, BarChart3, FileText, Activity, Users, Database, AlertCircle, MapPin, Clock, ChevronDown } from 'lucide-react';
import mockIncidents from '../../data/mockIncidents';
import mockHospitals from '../../data/mockHospitals';
import mockVolunteers from '../../data/mockVolunteers';
import { getTimeAgo, getIncidentEmoji, getSeverityColor } from '../../lib/ticketUtils';
import { Card, CardContent } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { SeverityBadge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function CommandDashboard() {
  const [incidents, setIncidents] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [broadcasts, setBroadcasts] = useState([
    {
      id: 'BROADCAST-001',
      message: 'Heavy rainfall expected in western region. Stay safe.',
      audience: 'all',
      timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    }
  ]);
  const [newBroadcast, setNewBroadcast] = useState('');
  const [audience, setAudience] = useState('all');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    // Sort incidents by AI score
    const sortedIncidents = [...mockIncidents].sort((a, b) => b.aiScore - a.aiScore);
    setIncidents(sortedIncidents);
  }, []);

  const handleSendBroadcast = async () => {
    if (!newBroadcast.trim()) return;

    setSending(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const broadcast = {
        id: `BROADCAST-${Date.now()}`,
        message: newBroadcast,
        audience,
        timestamp: new Date().toISOString(),
      };

      setBroadcasts([broadcast, ...broadcasts]);
      setNewBroadcast('');
      alert('Broadcast sent successfully!');
    } catch (error) {
      alert('Failed to send broadcast. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const getSeverityBorderClass = (severity) => {
    switch (severity) {
      case 3: return 'severity-border-high';
      case 2: return 'severity-border-medium';
      default: return 'severity-border-low';
    }
  };

  const getMarkerColor = (severity) => {
    switch (severity) {
      case 3: return '#E24B4A';
      case 2: return '#EF9F27';
      default: return '#1D9E75';
    }
  };

  const activeIncidents = incidents.filter(i => i.status === 'open').length;
  const resourcesDeployed = 42;
  const activeVolunteers = mockVolunteers.filter(v => v.available).length;
  const criticalHospitals = mockHospitals.filter(h => (h.occupiedBeds / h.totalBeds) > 0.8).length;

  const tabItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'analytics', label: 'Analytics', icon: Activity },
    { id: 'report', label: 'Reports', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top navigation bar */}
      <nav className="bg-[#042C53] text-white px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Shield className="w-6 h-6" />
          <div>
            <h1 className="font-semibold text-lg">QuickAid Command</h1>
            <div className="flex items-center gap-2 text-xs text-white/70">
              <span className="w-2 h-2 bg-[#E24B4A] rounded-full animate-pulse-live" />
              <span>LIVE</span>
              <span>•</span>
              <span>{new Date().toLocaleString('en-SG', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium">MA</span>
            </div>
            <span className="text-sm">MOH Admin</span>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div className="p-6">
        {/* Tabs */}
        <div className="flex gap-6 mb-6 border-b border-border">
          {tabItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <Link key={item.id} to={`/gov/${item.id === 'dashboard' ? 'dashboard' : item.id}`}>
                <div className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative
                  ${isActive ? 'text-primary' : 'text-text-muted hover:text-text-primary'}
                `}>
                  <Icon className="w-4 h-4" />
                  {item.label}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-text-muted">Active incidents</span>
                <AlertCircle className="w-4 h-4 text-[#E24B4A]" />
              </div>
              <p className="text-3xl font-semibold text-[#E24B4A]">{activeIncidents}</p>
              <div className="flex items-center gap-1 mt-2 text-xs text-[#E24B4A]">
                <span>↑ 12%</span>
                <span className="text-text-muted">from yesterday</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-text-muted">Resources deployed</span>
                <Activity className="w-4 h-4 text-primary" />
              </div>
              <p className="text-3xl font-semibold text-primary">{resourcesDeployed}</p>
              <div className="flex items-center gap-1 mt-2 text-xs text-primary">
                <span>↑ 8%</span>
                <span className="text-text-muted">from last hour</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-text-muted">Volunteers active</span>
                <Users className="w-4 h-4 text-[#1D9E75]" />
              </div>
              <p className="text-3xl font-semibold text-[#1D9E75]">{activeVolunteers}</p>
              <div className="flex items-center gap-1 mt-2 text-xs text-[#1D9E75]">
                <span>↑ 15%</span>
                <span className="text-text-muted">new signups today</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-text-muted">Hospitals >80% capacity</span>
                <Database className="w-4 h-4 text-[#EF9F27]" />
              </div>
              <p className="text-3xl font-semibold text-[#EF9F27]">{criticalHospitals}</p>
              <div className="flex items-center gap-1 mt-2 text-xs text-[#EF9F27]">
                <span>→ Stable</span>
                <span className="text-text-muted">no change</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Three column layout */}
        <div className="grid grid-cols-12 gap-4">
          {/* Left column - Incidents */}
          <div className="col-span-3">
            <Card>
              <CardHeader className="pb-3">
                <h3 className="font-semibold text-text-primary">Active incidents</h3>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[calc(100vh-400px)] overflow-y-auto scrollbar-thin">
                  {incidents
                    .filter(i => i.status === 'open')
                    .map((incident) => (
                      <div
                        key={incident.id}
                        className={`p-4 border-b border-border last:border-0 ${getSeverityBorderClass(incident.severity)} hover:bg-gray-50 transition-colors`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getIncidentEmoji(incident.type)}</span>
                            <h4 className="font-medium text-sm text-text-primary">
                              {incident.title}
                            </h4>
                          </div>
                          <SeverityBadge severity={incident.severity} className="text-xs" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-xs text-text-muted">
                            <MapPin className="w-3 h-3" />
                            <span>{incident.location}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-text-muted">
                            <Clock className="w-3 h-3" />
                            <span>{getTimeAgo(incident.reportedAt)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Middle column - Map */}
          <div className="col-span-5">
            <Card className="h-full">
              <CardContent className="p-0 h-full min-h-[500px]">
                <MapContainer
                  center={[1.3521, 103.8198]}
                  zoom={12}
                  style={{ height: '100%', width: '100%' }}
                  className="rounded-t-lg"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {incidents.map((incident) => (
                    <CircleMarker
                      key={incident.id}
                      center={[incident.lat, incident.lng]}
                      radius={8}
                      pathOptions={{
                        color: getMarkerColor(incident.severity),
                        fillColor: getMarkerColor(incident.severity),
                        fillOpacity: 0.7,
                        weight: 2,
                      }}
                    >
                      <Popup>
                        <div className="p-2">
                          <h4 className="font-semibold text-sm mb-1">{incident.title}</h4>
                          <p className="text-xs text-text-muted mb-1">{incident.location}</p>
                          <Badge status={incident.status} className="text-xs">
                            {incident.status}
                          </Badge>
                        </div>
                      </Popup>
                    </CircleMarker>
                  ))}
                </MapContainer>
              </CardContent>
            </Card>
          </div>

          {/* Right column - Broadcast */}
          <div className="col-span-4">
            <Card>
              <CardHeader className="pb-3">
                <h3 className="font-semibold text-text-primary">Broadcast alert</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <textarea
                    value={newBroadcast}
                    onChange={(e) => setNewBroadcast(e.target.value)}
                    placeholder="Type your broadcast message here..."
                    rows={5}
                    className="w-full px-3 py-2 border border-border rounded-card focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none text-sm"
                  />

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Audience
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setAudience('all')}
                        className={`
                          px-4 py-2 rounded-lg text-sm font-medium transition-colors
                          ${audience === 'all'
                            ? 'bg-primary text-white'
                            : 'bg-white border border-border text-text-primary hover:bg-gray-50'
                          }
                        `}
                      >
                        All public
                      </button>
                      <button
                        onClick={() => setAudience('responders')}
                        className={`
                          px-4 py-2 rounded-lg text-sm font-medium transition-colors
                          ${audience === 'responders'
                            ? 'bg-primary text-white'
                            : 'bg-white border border-border text-text-primary hover:bg-gray-50'
                          }
                        `}
                      >
                        Responders only
                      </button>
                    </div>
                  </div>

                  <Button
                    onClick={handleSendBroadcast}
                    disabled={!newBroadcast.trim() || sending}
                    loading={sending}
                    variant="danger"
                    className="w-full"
                  >
                    {sending ? 'Sending...' : 'Send alert'}
                  </Button>

                  {broadcasts.length > 0 && (
                    <div className="border-t border-border pt-4 mt-4">
                      <h4 className="text-sm font-medium text-text-primary mb-3">
                        Last broadcast
                      </h4>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-text-primary mb-2">
                          {broadcasts[0].message}
                        </p>
                        <div className="flex items-center justify-between text-xs text-text-muted">
                          <span>
                            To: {broadcasts[0].audience === 'all' ? 'All public' : 'Responders only'}
                          </span>
                          <span>{getTimeAgo(broadcasts[0].timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}