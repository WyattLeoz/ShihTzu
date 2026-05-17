import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Shield, List, Map, Database, ArrowLeft, Clock, MapPin, Sparkles, CheckCircle, AlertTriangle, ThermometerSun } from 'lucide-react';
import mockIncidents from '../../data/mockIncidents';
import mockHospitals from '../../data/mockHospitals';
import mockVolunteers from '../../data/mockVolunteers';
import { getTimeAgo, formatDateTime, getIncidentEmoji } from '../../lib/ticketUtils';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { SeverityBadge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useToast } from '../../components/Toast';
import { callClaude } from '../../lib/claudeApi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [incident, setIncident] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [activeNav, setActiveNav] = useState('queue');

  useEffect(() => {
    const foundIncident = mockIncidents.find(i => i.id === id);
    if (foundIncident) {
      setIncident(foundIncident);
      fetchRecommendations(foundIncident);
    } else {
      navigate('/responder/queue');
    }
  }, [id, navigate]);

  const fetchRecommendations = async (incidentData) => {
    setLoading(true);
    try {
      const systemPrompt = "You are an emergency response AI for Singapore. Given an incident report, generate exactly 3 ranked response options as JSON array: [{rank, action, rationale, resources_needed, estimated_time_minutes, confidence_score}]. Be specific to Singapore context (reference SCDF, TTSH, SGH, AMK Hub, etc).";

      const userMessage = `Incident Report:
- ID: ${incidentData.id}
- Type: ${incidentData.type}
- Title: ${incidentData.title}
- Location: ${incidentData.location}
- Description: ${incidentData.description}
- Severity: ${incidentData.severity}
- Status: ${incidentData.status}

Generate 3 ranked response recommendations.`;

      const response = await callClaude(systemPrompt, userMessage);

      if (response) {
        try {
          // Try to parse JSON from response
          const jsonMatch = response.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            setRecommendations(parsed);
          } else {
            // Fallback to mock data if parsing fails
            setRecommendations(getMockRecommendations(incidentData));
          }
        } catch (e) {
          setRecommendations(getMockRecommendations(incidentData));
        }
      } else {
        setRecommendations(getMockRecommendations(incidentData));
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setRecommendations(getMockRecommendations(incidentData));
    } finally {
      setLoading(false);
    }
  };

  const getMockRecommendations = (incidentData) => {
    return [
      {
        rank: 1,
        action: 'Dispatch SCDF ambulance team with medical equipment',
        rationale: 'Immediate medical response required based on incident description. SCDF can provide rapid medical assistance and transport to nearest hospital.',
        resources_needed: 'Ambulance, Medical Team, First Aid Kit',
        estimated_time_minutes: 8,
        confidence_score: 0.92
      },
      {
        rank: 2,
        action: 'Alert nearby volunteers for preliminary assistance',
        rationale: 'Volunteers in the area can provide initial support and information gathering while waiting for emergency services.',
        resources_needed: 'Trained Volunteers, First Aid Kit',
        estimated_time_minutes: 12,
        confidence_score: 0.78
      },
      {
        rank: 3,
        action: 'Coordinate with nearest hospital for bed availability',
        rationale: 'Pre-notify hospital to prepare emergency department and ensure bed availability for patient admission.',
        resources_needed: 'Hospital Coordination, Patient Transport',
        estimated_time_minutes: 15,
        confidence_score: 0.65
      }
    ];
  };

  const handleApprove = async (recommendation) => {
    setApproving(true);
    try {
      // Simulate API call to update incident status
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update local state
      setIncident(prev => ({ ...prev, status: 'dispatched' }));

      toast('Response approved and resources dispatched successfully!', 'success');

      setTimeout(() => {
        navigate('/responder/queue');
      }, 1500);
    } catch (error) {
      toast('Failed to approve response. Please try again.', 'error');
    } finally {
      setApproving(false);
    }
  };

  const getHospitalData = () => {
    return mockHospitals.slice(0, 3).map(hospital => ({
      name: hospital.name.split('(')[0].trim(),
      occupied: hospital.occupiedBeds,
      total: hospital.totalBeds,
      percentage: Math.round((hospital.occupiedBeds / hospital.totalBeds) * 100)
    }));
  };

  const availableVolunteers = mockVolunteers.filter(v => v.available).length;

  const navItems = [
    { id: 'queue', label: 'Queue', icon: List },
    { id: 'map', label: 'Map', icon: Map },
    { id: 'resources', label: 'Resources', icon: Database },
  ];

  if (!incident) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-border flex-shrink-0">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-semibold text-sm">QuickAid Ops</span>
          </div>
        </div>

        <nav className="p-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;

            return (
              <Link key={item.id} to={`/responder/${item.id === 'queue' ? 'queue' : item.id}`}>
                <div className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium
                  transition-all duration-200 cursor-pointer
                  ${isActive
                    ? 'bg-[#E1F5EE] text-primary border-l-4 border-primary'
                    : 'text-text-primary hover:bg-gray-50'
                  }
                `}>
                  <Icon className="w-4 h-4" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6">
        <div className="grid grid-cols-3 gap-4">
          {/* Left panel - Incident info and recommendations */}
          <div className="col-span-2 space-y-4">
            {/* Back button */}
            <Link to="/responder/queue">
              <div className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors mb-4">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Back to queue</span>
              </div>
            </Link>

            {/* Incident header */}
            <Card>
              <CardContent>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <Badge variant="neutral" className="mb-2">{incident.id}</Badge>
                    <h1 className="text-2xl font-semibold text-text-primary mb-2">
                      {incident.title}
                    </h1>
                    <div className="flex items-center gap-2 text-text-muted text-sm">
                      <Clock className="w-4 h-4" />
                      Reported {formatDateTime(incident.reportedAt)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <SeverityBadge severity={incident.severity} />
                    <Badge status={incident.status}>{incident.status}</Badge>
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{getIncidentEmoji(incident.type)}</span>
                    <h2 className="text-lg font-semibold text-text-primary">
                      {incident.category}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 text-text-muted mb-4">
                    <MapPin className="w-4 h-4" />
                    <span>{incident.location}</span>
                  </div>
                  <p className="text-text-primary leading-relaxed">
                    {incident.description}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* AI Recommendations */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <CardTitle>AI Recommendations</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="py-8">
                    <LoadingSpinner message="Generating AI recommendations..." />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recommendations.map((rec, index) => (
                      <div
                        key={rec.rank}
                        className={`p-4 rounded-card border-2 transition-all
                          ${index === 0 ? 'border-primary bg-[#E1F5EE]' : 'border-border bg-white'}
                        `}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-semibold text-primary">
                              #{rec.rank}
                            </span>
                            <h3 className="font-semibold text-text-primary">
                              {rec.action}
                            </h3>
                          </div>
                          {index === 0 && (
                            <Badge variant="neutral" className="bg-primary text-white">
                              Recommended
                            </Badge>
                          )}
                        </div>

                        <p className="text-text-muted text-sm mb-3">
                          {rec.rationale}
                        </p>

                        {/* Resources needed */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {rec.resources_needed.split(',').map((resource, i) => (
                            <span
                              key={i}
                              className="px-3 py-1 bg-gray-100 text-text-primary text-xs rounded-pill"
                            >
                              {resource.trim()}
                            </span>
                          ))}
                        </div>

                        {/* Confidence bar */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-text-muted">Confidence</span>
                            <span className="font-semibold text-primary">
                              {Math.round(rec.confidence_score * 100)}%
                            </span>
                          </div>
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all duration-300"
                              style={{ width: `${rec.confidence_score * 100}%` }}
                            />
                          </div>
                        </div>

                        {/* Time estimate */}
                        <div className="flex items-center gap-2 text-xs text-text-muted mb-3">
                          <Clock className="w-3 h-3" />
                          <span>Estimated time: {rec.estimated_time_minutes} minutes</span>
                        </div>

                        {/* Action button */}
                        {index === 0 && incident.status === 'open' && (
                          <Button
                            onClick={() => handleApprove(rec)}
                            disabled={approving}
                            loading={approving}
                            className="w-full"
                          >
                            {approving ? 'Approving...' : 'Approve & Dispatch'}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right panel - Resources and timeline */}
          <div className="col-span-1 space-y-4">
            {/* Hospital capacity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Hospital capacity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getHospitalData()} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={80}
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white p-2 rounded shadow border">
                                <p className="text-sm font-medium">{data.name}</p>
                                <p className="text-xs">{data.occupied}/{data.total} beds</p>
                                <p className="text-xs text-text-muted">{data.percentage}% occupied</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="occupied" fill="#1D9E75" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Volunteers */}
            <Card>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-text-primary">Available volunteers</span>
                  <Badge variant="success" className="bg-green-100 text-green-800">
                    {availableVolunteers}
                  </Badge>
                </div>
                <p className="text-xs text-text-muted">
                  Within 5km of incident location
                </p>
              </CardContent>
            </Card>

            {/* Weather widget */}
            <Card>
              <CardContent>
                <div className="flex items-center gap-3">
                  <ThermometerSun className="w-8 h-8 text-amber-500" />
                  <div>
                    <p className="text-2xl font-semibold text-text-primary">31°C</p>
                    <p className="text-xs text-text-muted">Partly cloudy</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Activity timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Activity timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative pl-4 border-l-2 border-dashed border-border">
                  {[
                    { time: formatDateTime(incident.reportedAt), action: 'Incident reported' },
                    { time: getTimeAgo(incident.reportedAt), action: 'AI analysis completed' },
                    incident.status === 'dispatched' && { time: 'Just now', action: 'Resources dispatched' }
                  ].filter(Boolean).map((item, index) => (
                    <div key={index} className="mb-4 last:mb-0">
                      <div className="absolute -left-1.5 w-3 h-3 bg-primary rounded-full" />
                      <p className="text-xs text-text-muted mb-1">{item.time}</p>
                      <p className="text-sm text-text-primary">{item.action}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}