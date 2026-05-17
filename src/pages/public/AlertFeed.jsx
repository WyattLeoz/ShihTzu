import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Bell, Megaphone, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { BackButton } from '../../components/Button';
import { Card, CardContent } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { getTimeAgo } from '../../lib/ticketUtils';
import { EmptyState } from '../../components/LoadingSpinner';

export default function AlertFeed() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Mock alerts
    const mockAlerts = [
      {
        id: 'ALERT-001',
        title: 'Heavy rainfall expected',
        message: 'Heavy rainfall expected in western region over the next 2 hours. Stay away from low-lying areas and avoid unnecessary travel.',
        severity: 'medium',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        type: 'weather',
        author: 'Meteorological Service Singapore',
        status: 'active'
      },
      {
        id: 'ALERT-002',
        title: 'Road closure - Bukit Timah Road',
        message: 'Bukit Timah Road closed between Dunearn Road and Newton Circus due to fallen tree. Expected to reopen by 6 PM. Use alternative routes via PIE or CTE.',
        severity: 'low',
        timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
        type: 'traffic',
        author: 'LTA',
        status: 'active'
      },
      {
        id: 'ALERT-003',
        title: 'Medical assistance needed - Yishun',
        message: 'Seeking volunteers with medical certification for community health screening at Yishun Community Club. Contact +65 6789 1234.',
        severity: 'low',
        timestamp: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
        type: 'volunteer',
        author: 'QuickAid Volunteer Network',
        status: 'active'
      },
      {
        id: 'ALERT-004',
        title: 'Power outage restoration - AMK',
        message: 'Power has been fully restored in Ang Mo Kio Avenue 4 area. Thank you for your patience during the outage.',
        severity: 'low',
        timestamp: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
        type: 'infrastructure',
        author: 'SP Group',
        status: 'resolved'
      },
      {
        id: 'ALERT-005',
        title: 'Flood warning - Jurong West',
        message: 'Flash flood warning in effect for Jurong West area. Water levels rising rapidly. Seek higher ground if you are in low-lying areas.',
        severity: 'high',
        timestamp: new Date(Date.now() - 300 * 60 * 1000).toISOString(),
        type: 'weather',
        author: 'PUB',
        status: 'active'
      },
    ];

    setAlerts(mockAlerts);
  }, []);

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true;
    if (filter === 'active') return alert.status === 'active';
    if (filter === 'high') return alert.severity === 'high';
    return true;
  });

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high': return AlertTriangle;
      case 'medium': return Info;
      default: return CheckCircle;
    }
  };

  const getSeverityClass = (severity) => {
    switch (severity) {
      case 'high': return 'severity-high';
      case 'medium': return 'severity-medium';
      default: return 'severity-low';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'weather': return '🌤️';
      case 'traffic': return '🚗';
      case 'volunteer': return '🤝';
      case 'infrastructure': return '🏗️';
      default: return '📢';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-border px-4 py-4">
        <div className="flex items-center gap-4">
          <BackButton onClick={() => navigate('/public/home')} />
          <div className="flex items-center gap-2 flex-1">
            <Bell className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-semibold text-text-primary">Alert feed</h1>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-4 flex gap-2 overflow-x-auto">
        {['all', 'active', 'high'].map((filterOption) => (
          <button
            key={filterOption}
            onClick={() => setFilter(filterOption)}
            className={`
              px-4 py-2 rounded-pill text-sm font-medium whitespace-nowrap transition-colors
              ${filter === filterOption
                ? 'bg-primary text-white'
                : 'bg-white text-text-primary border border-border'
              }
            `}
          >
            {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
          </button>
        ))}
      </div>

      {/* Alerts list */}
      <div className="px-4 pb-8">
        {filteredAlerts.length > 0 ? (
          <div className="space-y-3">
            {filteredAlerts
              .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
              .map((alert) => {
                const SeverityIcon = getSeverityIcon(alert.severity);
                return (
                  <Card key={alert.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`severity-dot ${getSeverityClass(alert.severity)} mt-1 flex-shrink-0`} />
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{getTypeIcon(alert.type)}</span>
                            <h3 className="font-semibold text-sm text-text-primary">
                              {alert.title}
                            </h3>
                          </div>
                          <span className="text-text-muted text-xs whitespace-nowrap ml-2">
                            {getTimeAgo(alert.timestamp)}
                          </span>
                        </div>
                        <p className="text-text-muted text-sm mb-3 leading-relaxed">
                          {alert.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Megaphone className="w-3 h-3 text-text-muted" />
                            <span className="text-xs text-text-muted">{alert.author}</span>
                          </div>
                          <Badge
                            status={alert.status === 'active' ? 'open' : 'resolved'}
                            className="text-xs"
                          >
                            {alert.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
          </div>
        ) : (
          <EmptyState
            icon={Bell}
            title="No alerts found"
            description="There are no alerts matching your current filter."
            action={
              <button
                onClick={() => setFilter('all')}
                className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white font-medium rounded-card transition-colors"
              >
                Show all alerts
              </button>
            }
          />
        )}
      </div>
    </div>
  );
}