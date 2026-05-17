import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Shield, List, Map, Database, Clock, MapPin } from 'lucide-react';
import mockIncidents from '../../data/mockIncidents';
import { getTimeAgo, getIncidentEmoji, getSeverityColor } from '../../lib/ticketUtils';
import { Card, CardContent } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { SeverityBadge } from '../../components/Badge';
import { EmptyState } from '../../components/LoadingSpinner';
import { ToastProvider } from '../../components/Toast';

export default function TicketQueue() {
  const [incidents, setIncidents] = useState([]);
  const [activeNav, setActiveNav] = useState('queue');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Sort incidents by AI score (highest priority first)
    const sortedIncidents = [...mockIncidents].sort((a, b) => b.aiScore - a.aiScore);
    setIncidents(sortedIncidents);
  }, []);

  const filteredIncidents = incidents.filter(incident => {
    if (filter === 'all') return true;
    if (filter === 'open') return incident.status === 'open';
    if (filter === 'dispatched') return incident.status === 'dispatched';
    if (filter === 'high') return incident.severity === 3;
    return true;
  });

  const getSeverityBorderClass = (severity) => {
    switch (severity) {
      case 3: return 'severity-border-high';
      case 2: return 'severity-border-medium';
      default: return 'severity-border-low';
    }
  };

  const navItems = [
    { id: 'queue', label: 'Queue', icon: List },
    { id: 'map', label: 'Map', icon: Map },
    { id: 'resources', label: 'Resources', icon: Database },
  ];

  return (
    <ToastProvider>
      <div className="min-h-screen bg-background flex">
        {/* Sidebar */}
        <aside className="w-60 bg-white border-r border-border flex-shrink-0">
          {/* Logo */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <span className="font-semibold text-sm">QuickAid Ops</span>
            </div>
            <Badge variant="neutral" className="mt-2 text-xs bg-gray-100">
              Responder Portal
            </Badge>
          </div>

          {/* Navigation */}
          <nav className="p-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveNav(item.id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium
                    transition-all duration-200
                    ${isActive
                      ? 'bg-[#E1F5EE] text-primary border-l-4 border-primary'
                      : 'text-text-primary hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-text-primary">Incident queue</h1>
              <Badge variant="neutral" className="bg-gray-100">
                {incidents.filter(i => i.status === 'open').length} open
              </Badge>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              {['all', 'open', 'dispatched', 'high'].map((filterOption) => (
                <button
                  key={filterOption}
                  onClick={() => setFilter(filterOption)}
                  className={`
                    px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                    ${filter === filterOption
                      ? 'bg-primary text-white'
                      : 'bg-white text-text-primary border border-border hover:bg-gray-50'
                    }
                  `}
                >
                  {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Incident list */}
          {filteredIncidents.length > 0 ? (
            <div className="space-y-3">
              {filteredIncidents.map((incident) => (
                <Link
                  key={incident.id}
                  to={`/responder/ticket/${incident.id}`}
                  className="block"
                >
                  <Card
                    className={`p-4 hover:bg-[#F0FDF8] hover:shadow-card-elevated transition-all cursor-pointer ${getSeverityBorderClass(incident.severity)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{getIncidentEmoji(incident.type)}</span>
                          <h3 className="font-semibold text-sm text-text-primary">
                            {incident.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-text-muted">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {incident.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {getTimeAgo(incident.reportedAt)}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 ml-4">
                        <SeverityBadge severity={incident.severity} />
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-text-muted">AI Score:</span>
                          <span className="text-xs font-semibold text-text-primary">
                            {Math.round(incident.aiScore * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={List}
              title="No incidents found"
              description="There are no incidents matching your current filter."
              action={
                <button
                  onClick={() => setFilter('all')}
                  className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white font-medium rounded-card transition-colors"
                >
                  Show all incidents
                </button>
              }
            />
          )}
        </main>
      </div>
    </ToastProvider>
  );
}