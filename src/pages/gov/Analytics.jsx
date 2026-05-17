import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, BarChart3, FileText, TrendingUp, Clock, MapPin, Users } from 'lucide-react';
import mockIncidents from '../../data/mockIncidents';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('7d');

  // Mock data for 7-day trend
  const trendData = [
    { day: 'Mon', count: 12, resolved: 10 },
    { day: 'Tue', count: 18, resolved: 15 },
    { day: 'Wed', count: 15, resolved: 14 },
    { day: 'Thu', count: 22, resolved: 19 },
    { day: 'Fri', count: 19, resolved: 16 },
    { day: 'Sat', count: 14, resolved: 12 },
    { day: 'Sun', count: 11, resolved: 10 },
  ];

  // Incident type breakdown
  const typeData = [
    { type: 'Medical', count: 4, color: '#E24B4A' },
    { type: 'Flood', count: 3, color: '#1D9E75' },
    { type: 'Fire', count: 3, color: '#EF9F27' },
    { type: 'Road', count: 2, color: '#042C53' },
    { type: 'Infrastructure', count: 2, color: '#6B7280' },
    { type: 'Civil', count: 1, color: '#9333EA' },
  ];

  // Response time averages
  const responseTimeData = [
    { metric: 'Avg dispatch time', value: 8.5, unit: 'min', trend: '+12%' },
    { metric: 'Avg resolution time', value: 45.2, unit: 'min', trend: '-8%' },
    { metric: 'First responder ETA', value: 12.3, unit: 'min', trend: '+5%' },
  ];

  // Location breakdown
  const locationData = mockIncidents.reduce((acc, incident) => {
    const location = incident.location.split(',').pop().trim();
    acc[location] = (acc[location] || 0) + 1;
    return acc;
  }, {});

  const locationChartData = Object.entries(locationData)
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const severityData = [
    { name: 'High', value: mockIncidents.filter(i => i.severity === 3).length, color: '#E24B4A' },
    { name: 'Medium', value: mockIncidents.filter(i => i.severity === 2).length, color: '#EF9F27' },
    { name: 'Low', value: mockIncidents.filter(i => i.severity === 1).length, color: '#1D9E75' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top navigation bar */}
      <nav className="bg-[#042C53] text-white px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Shield className="w-6 h-6" />
          <h1 className="font-semibold text-lg">QuickAid Command</h1>
        </div>
      </nav>

      {/* Main content */}
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-text-primary mb-2">Analytics</h1>
            <p className="text-text-muted">Monitor incident trends and response metrics</p>
          </div>

          <div className="flex gap-2">
            {['7d', '30d', '90d'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${timeRange === range
                    ? 'bg-primary text-white'
                    : 'bg-white border border-border text-text-primary hover:bg-gray-50'
                  }
                `}
              >
                {range === '7d' ? '7 days' : range === '30d' ? '30 days' : '90 days'}
              </button>
            ))}
          </div>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-text-muted">Total incidents</p>
                  <p className="text-2xl font-semibold text-text-primary">{mockIncidents.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <span className="text-[#E24B4A]">↑ 12%</span>
                <span className="text-text-muted">vs last period</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-text-muted">Resolution rate</p>
                  <p className="text-2xl font-semibold text-text-primary">87%</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <span className="text-green-500">↑ 5%</span>
                <span className="text-text-muted">vs last period</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-xs text-text-muted">Avg response time</p>
                  <p className="text-2xl font-semibold text-text-primary">8.5m</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <span className="text-[#E24B4A]">↑ 12%</span>
                <span className="text-text-muted">vs last period</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-text-muted">Active locations</p>
                  <p className="text-2xl font-semibold text-text-primary">8</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <span className="text-green-500">→ Stable</span>
                <span className="text-text-muted">no change</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Incidents over 7 days</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #E5E3DC',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#1D9E75"
                      strokeWidth={2}
                      dot={{ fill: '#1D9E75', strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                      name="Total incidents"
                    />
                    <Line
                      type="monotone"
                      dataKey="resolved"
                      stroke="#042C53"
                      strokeWidth={2}
                      dot={{ fill: '#042C53', strokeWidth: 2 }}
                      name="Resolved"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">By incident type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={typeData}
                    layout="vertical"
                    margin={{ left: 80, right: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="type"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      width={70}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #E5E3DC',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {typeData.map((entry, index) => (
                        <defs key={`gradient-${index}`}>
                          <linearGradient id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                            <stop offset="100%" stopColor={entry.color} stopOpacity={0.7} />
                          </linearGradient>
                        </defs>
                      ))}
                      {typeData.map((entry, index) => (
                        <rect key={`bar-${index}`} fill={`url(#gradient-${index})`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Response time averages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {responseTimeData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-text-muted mb-1">{item.metric}</p>
                      <p className="text-2xl font-semibold text-text-primary">
                        {item.value}
                        <span className="text-sm font-normal text-text-muted ml-1">{item.unit}</span>
                      </p>
                    </div>
                    <div className={`text-sm font-medium ${item.trend.startsWith('+') ? 'text-[#E24B4A]' : 'text-green-500'}`}>
                      {item.trend}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Severity distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {severityData.map((item) => (
                  <div key={item.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-text-primary">{item.name}</span>
                      <span className="text-sm font-semibold" style={{ color: item.color }}>
                        {item.value}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-300"
                        style={{
                          width: `${(item.value / mockIncidents.length) * 100}%`,
                          backgroundColor: item.color
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top locations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {locationChartData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-primary">#{index + 1}</span>
                      <span className="text-sm text-text-primary">{item.location}</span>
                    </div>
                    <span className="text-sm font-semibold text-text-primary">{item.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}