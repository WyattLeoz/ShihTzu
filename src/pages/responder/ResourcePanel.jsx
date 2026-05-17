import React, { useState, useEffect } from 'react';
import { Shield, List, Map, Database, Users, Building, Activity, ChevronRight } from 'lucide-react';
import mockHospitals from '../../data/mockHospitals';
import mockVolunteers from '../../data/mockVolunteers';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/LoadingSpinner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function ResourcePanel() {
  const [activeTab, setActiveTab] = useState('hospitals');
  const [activeNav, setActiveNav] = useState('resources');

  const getHospitalCapacityStatus = (hospital) => {
    const percentage = (hospital.occupiedBeds / hospital.totalBeds) * 100;
    if (percentage > 80) return { status: 'critical', color: '#E24B4A' };
    if (percentage > 60) return { status: 'warning', color: '#EF9F27' };
    return { status: 'good', color: '#1D9E75' };
  };

  const navItems = [
    { id: 'queue', label: 'Queue', icon: List },
    { id: 'map', label: 'Map', icon: Map },
    { id: 'resources', label: 'Resources', icon: Database },
  ];

  const skillDistribution = mockVolunteers.reduce((acc, volunteer) => {
    volunteer.skills.forEach(skill => {
      acc[skill] = (acc[skill] || 0) + 1;
    });
    return acc;
  }, {});

  const skillData = Object.entries(skillDistribution).map(([skill, count]) => ({
    skill,
    count,
  }));

  const pieColors = ['#1D9E75', '#EF9F27', '#E24B4A', '#042C53', '#6B7280', '#9333EA'];

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
              <div
                key={item.id}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium
                  transition-all duration-200 cursor-pointer
                  ${isActive
                    ? 'bg-[#E1F5EE] text-primary border-l-4 border-primary'
                    : 'text-text-primary hover:bg-gray-50'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-text-primary mb-2">Resource management</h1>
          <p className="text-text-muted">Monitor and manage emergency resources across Singapore</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-border">
          <button
            onClick={() => setActiveTab('hospitals')}
            className={`px-4 py-2 text-sm font-medium transition-colors relative pb-2
              ${activeTab === 'hospitals' ? 'text-primary' : 'text-text-muted'}`}
          >
            Hospitals
            {activeTab === 'hospitals' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('volunteers')}
            className={`px-4 py-2 text-sm font-medium transition-colors relative pb-2
              ${activeTab === 'volunteers' ? 'text-primary' : 'text-text-muted'}`}
          >
            Volunteers
            {activeTab === 'volunteers' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-sm font-medium transition-colors relative pb-2
              ${activeTab === 'overview' ? 'text-primary' : 'text-text-muted'}`}
          >
            Overview
            {activeTab === 'overview' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        </div>

        {/* Tab content */}
        {activeTab === 'hospitals' && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Building className="w-4 h-4 text-primary" />
                    <span className="text-xs text-text-muted">Total hospitals</span>
                  </div>
                  <p className="text-2xl font-semibold text-text-primary">{mockHospitals.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-[#E24B4A]" />
                    <span className="text-xs text-text-muted">Critical capacity</span>
                  </div>
                  <p className="text-2xl font-semibold text-[#E24B4A]">
                    {mockHospitals.filter(h => (h.occupiedBeds / h.totalBeds) > 0.8).length}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-primary" />
                    <span className="text-xs text-text-muted">Available beds</span>
                  </div>
                  <p className="text-2xl font-semibold text-text-primary">
                    {mockHospitals.reduce((acc, h) => acc + (h.totalBeds - h.occupiedBeds), 0)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="w-4 h-4 text-[#EF9F27]" />
                    <span className="text-xs text-text-muted">Total beds</span>
                  </div>
                  <p className="text-2xl font-semibold text-text-primary">
                    {mockHospitals.reduce((acc, h) => acc + h.totalBeds, 0)}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Hospital capacity overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mockHospitals.map(h => ({
                        name: h.name.split('(')[0].trim(),
                        percentage: Math.round((h.occupiedBeds / h.totalBeds) * 100)
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 10 }}
                          tickLine={false}
                          axisLine={false}
                          interval={0}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis hide />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white p-2 rounded shadow border">
                                  <p className="text-sm font-medium">{payload[0].payload.name}</p>
                                  <p className="text-xs">{payload[0].payload.percentage}% capacity</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="percentage" fill="#1D9E75" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                {mockHospitals.map((hospital) => {
                  const status = getHospitalCapacityStatus(hospital);
                  const percentage = Math.round((hospital.occupiedBeds / hospital.totalBeds) * 100);

                  return (
                    <Card key={hospital.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-medium text-sm text-text-primary mb-1">
                              {hospital.name}
                            </h3>
                            <p className="text-xs text-text-muted">{hospital.location}</p>
                          </div>
                          <Badge
                            status={status.status === 'critical' ? 'open' : status.status === 'warning' ? 'dispatched' : 'resolved'}
                          >
                            {status.status}
                          </Badge>
                        </div>

                        <div className="mb-2">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-text-muted">Capacity</span>
                            <span className="font-medium" style={{ color: status.color }}>
                              {percentage}%
                            </span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full transition-all duration-300"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: status.color
                              }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-text-muted">
                          <span>{hospital.occupiedBeds} occupied</span>
                          <span>{hospital.totalBeds - hospital.occupiedBeds} available</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'volunteers' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-xs text-text-muted">Total volunteers</span>
                  </div>
                  <p className="text-2xl font-semibold text-text-primary">{mockVolunteers.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-[#1D9E75]" />
                    <span className="text-xs text-text-muted">Available now</span>
                  </div>
                  <p className="text-2xl font-semibold text-[#1D9E75]">
                    {mockVolunteers.filter(v => v.available).length}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="w-4 h-4 text-[#042C53]" />
                    <span className="text-xs text-text-muted">Average radius</span>
                  </div>
                  <p className="text-2xl font-semibold text-text-primary">
                    {Math.round(mockVolunteers.reduce((acc, v) => acc + v.radius, 0) / mockVolunteers.length)}km
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Skill distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={skillData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ skill, percent }) => `${skill} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {skillData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Available volunteers</CardTitle>
                    <Button variant="ghost" size="sm">
                      View all <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {mockVolunteers
                      .filter(v => v.available)
                      .slice(0, 8)
                      .map((volunteer) => (
                        <div
                          key={volunteer.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div>
                            <h4 className="font-medium text-sm text-text-primary">{volunteer.name}</h4>
                            <p className="text-xs text-text-muted">{volunteer.location} • {volunteer.radius}km radius</p>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {volunteer.skills.slice(0, 2).map((skill, i) => (
                              <Badge key={i} variant="neutral" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Volunteer locations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-3">
                  {Array.from(new Set(mockVolunteers.map(v => v.location))).map((location) => {
                    const count = mockVolunteers.filter(v => v.location === location && v.available).length;
                    return (
                      <div key={location} className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-semibold text-primary">{count}</p>
                        <p className="text-xs text-text-muted">{location}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Resource status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-muted">Hospitals operating normally</span>
                      <Badge status="resolved">{mockHospitals.filter(h => (h.occupiedBeds / h.totalBeds) <= 0.8).length}/{mockHospitals.length}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-muted">Volunteers on standby</span>
                      <Badge status="open">{mockVolunteers.filter(v => v.available).length}/{mockVolunteers.length}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-muted">Total coverage area</span>
                      <Badge variant="neutral">Singapore-wide</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">System health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-text-muted">Hospital capacity</span>
                        <span className="font-medium text-[#1D9E75]">Good</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-[#1D9E75]" style={{ width: '65%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-text-muted">Volunteer availability</span>
                        <span className="font-medium text-[#EF9F27]">Moderate</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-[#EF9F27]" style={{ width: '75%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-text-muted">Resource allocation</span>
                        <span className="font-medium text-[#1D9E75]">Optimal</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-[#1D9E75]" style={{ width: '85%' }} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-[#FCEBEB] border-l-4 border-[#E24B4A] rounded-r-lg">
                    <AlertTriangle className="w-5 h-5 text-[#E24B4A] flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-sm text-text-primary mb-1">
                        Monitor SGH capacity
                      </h4>
                      <p className="text-xs text-text-muted">
                        SGH is approaching 80% capacity. Consider diverting non-critical cases to other hospitals.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-[#E1F5EE] border-l-4 border-primary rounded-r-lg">
                    <Activity className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-sm text-text-primary mb-1">
                        Volunteer recruitment drive
                      </h4>
                      <p className="text-xs text-text-muted">
                        Consider organizing recruitment drive in Jurong and Woodlands areas to improve coverage.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
                    <Database className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-sm text-text-primary mb-1">
                        Resource optimization
                      </h4>
                      <p className="text-xs text-text-muted">
                        Current resource allocation is optimal. Continue monitoring during peak hours.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}