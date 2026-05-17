import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Bell, MapPin, Clock, AlertTriangle, Plus } from 'lucide-react';
import mockIncidents from '../../data/mockIncidents';
import { getTimeAgo, getIncidentEmoji, getSeverityColor } from '../../lib/ticketUtils';
import { Card, CardContent } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { FABButton, Button } from '../../components/Button';

export default function PublicHome() {
  const [incidents, setIncidents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    setIncidents(mockIncidents.filter(i => i.status === 'open').sort((a, b) => b.aiScore - a.aiScore));
    setShowBanner(mockIncidents.some(i => i.severity === 3 && i.status === 'open'));

    // Initialize mock alerts
    setAlerts([
      {
        id: 'ALERT-001',
        title: 'Heavy rainfall expected',
        message: 'Heavy rainfall expected in western region. Stay away from low-lying areas.',
        severity: 'medium',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        type: 'weather'
      },
      {
        id: 'ALERT-002',
        title: 'Road closure alert',
        message: 'Bukit Timah Road closed due to fallen tree. Use alternative routes.',
        severity: 'low',
        timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
        type: 'traffic'
      }
    ]);
  }, []);

  const highSeverityIncident = incidents.find(i => i.severity === 3);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Sticky navigation */}
      <nav className="sticky top-0 z-40 bg-primary text-white px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6" />
          <span className="font-semibold text-lg">QuickAid</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/public/alerts">
            <Bell className="w-6 h-6 cursor-pointer hover:opacity-80 transition-opacity" />
          </Link>
        </div>
      </nav>

      {/* Active incident banner */}
      {showBanner && highSeverityIncident && (
        <div className="mx-4 mt-4 bg-[#FCEBEB] border-l-4 border-[#E24B4A] rounded-card p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <AlertTriangle className="w-5 h-5 text-[#E24B4A] flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-text-primary text-sm">
                  {highSeverityIncident.title}
                </h3>
                <p className="text-text-muted text-xs mt-1">
                  Reported {getTimeAgo(highSeverityIncident.reportedAt)}
                </p>
              </div>
            </div>
            <Link to={`/responder/ticket/${highSeverityIncident.id}`}>
              <span className="text-primary text-sm font-medium hover:underline">
                View details
              </span>
            </Link>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="px-4 mt-6">
        <h2 className="text-xl font-semibold text-text-primary mb-4">Latest alerts</h2>

        {/* Broadcast alerts */}
        {alerts.length > 0 && (
          <div className="space-y-3 mb-6">
            {alerts.map(alert => (
              <Card key={alert.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`severity-dot severity-${alert.severity} mt-1 flex-shrink-0`} />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-sm text-text-primary">
                          {alert.title}
                        </h3>
                        <p className="text-text-muted text-xs mt-1">
                          {alert.message}
                        </p>
                      </div>
                      <span className="text-text-muted text-xs whitespace-nowrap ml-2">
                        {getTimeAgo(alert.timestamp)}
                      </span>
                    </div>
                    <Badge variant="neutral" className="mt-2 text-xs">
                      {alert.type}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Incident feed */}
        <div className="space-y-3">
          {incidents.map(incident => (
            <Link
              key={incident.id}
              to={`/responder/ticket/${incident.id}`}
              className="block"
            >
              <Card className="p-4 hover:shadow-card-elevated transition-shadow cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className={`severity-dot ${getSeverityColor(incident.severity)} mt-1 flex-shrink-0`} />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm text-text-primary">
                          {getIncidentEmoji(incident.type)} {incident.title}
                        </h3>
                        <p className="text-text-muted text-xs mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {incident.location}
                        </p>
                      </div>
                      <span className="text-text-muted text-xs whitespace-nowrap ml-2 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {getTimeAgo(incident.reportedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {incidents.length === 0 && (
          <div className="text-center py-12">
            <Shield className="w-16 h-16 text-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">No active incidents</h3>
            <p className="text-text-muted mb-6">
              Stay safe! Check back later for updates.
            </p>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="px-4 mt-6 mb-4">
        <div className="grid grid-cols-2 gap-3">
          <Link to="/public/report">
            <Button variant="secondary" className="w-full" icon={Plus}>
              Report incident
            </Button>
          </Link>
          <Link to="/public/volunteer">
            <Button variant="secondary" className="w-full" icon={Shield}>
              Volunteer
            </Button>
          </Link>
        </div>
      </div>

      {/* FAB button */}
      <Link to="/public/report">
        <FABButton />
      </Link>
    </div>
  );
}