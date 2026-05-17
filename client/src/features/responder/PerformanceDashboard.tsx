import { useState } from 'react';
import { TrendingUp, TrendingDown, Clock, CheckCircle, AlertTriangle, Activity } from 'lucide-react';
import { Badge } from '../../components/Badge';

export function PerformanceDashboard() {
  console.log('PerformanceDashboard rendered');
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');

  const metrics = {
    today: {
      totalIncidents: 23,
      avgResponseTime: 4.2,
      resolutionRate: 87,
      criticalHandled: 3,
    },
    week: {
      totalIncidents: 145,
      avgResponseTime: 4.5,
      resolutionRate: 91,
      criticalHandled: 18,
    },
    month: {
      totalIncidents: 623,
      avgResponseTime: 4.3,
      resolutionRate: 89,
      criticalHandled: 76,
    },
  };

  const currentMetrics = metrics[timeRange];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-ink mb-1">Performance Dashboard</h1>
          <p className="text-sm text-ink-muted">Track team performance and key metrics</p>
        </div>
        <div className="flex gap-2">
          {(['today', 'week', 'month'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 text-sm rounded-sm capitalize transition-colors ${
                timeRange === range
                  ? 'bg-teal text-white'
                  : 'bg-white text-ink hover:bg-paper-hover border border-paper-border'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Total Incidents"
          value={currentMetrics.totalIncidents}
          icon={<Activity size={20} className="text-teal" />}
          trend="up"
          trendValue="+12%"
          description="vs. previous period"
        />
        <MetricCard
          title="Avg Response Time"
          value={`${currentMetrics.avgResponseTime} min`}
          icon={<Clock size={20} className="text-amber" />}
          trend="down"
          trendValue="-0.3 min"
          description="vs. previous period"
        />
        <MetricCard
          title="Resolution Rate"
          value={`${currentMetrics.resolutionRate}%`}
          icon={<CheckCircle size={20} className="text-teal" />}
          trend="up"
          trendValue="+2%"
          description="vs. previous period"
        />
        <MetricCard
          title="Critical Cases"
          value={currentMetrics.criticalHandled}
          icon={<AlertTriangle size={20} className="text-red" />}
          trend="stable"
          trendValue="0%"
          description="vs. previous period"
        />
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Response Time Trend */}
        <div className="bg-white border border-paper-border rounded-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-paper-border">
            <h2 className="font-medium text-ink">Response Time Trend</h2>
          </div>
          <div className="p-4">
            <div className="h-48 flex items-end justify-between gap-2">
              {[
                { time: '00:00', value: 5.2 },
                { time: '04:00', value: 6.1 },
                { time: '08:00', value: 4.5 },
                { time: '12:00', value: 3.8 },
                { time: '16:00', value: 4.1 },
                { time: '20:00', value: 4.8 },
                { time: '23:59', value: 5.5 },
              ].map((data, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-teal rounded-t transition-all hover:bg-teal-dark"
                    style={{ height: `${(data.value / 7) * 100}%` }}
                    title={`${data.value} min`}
                  />
                  <div className="text-xs text-ink-muted">{data.time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Incident Types Distribution */}
        <div className="bg-white border border-paper-border rounded-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-paper-border">
            <h2 className="font-medium text-ink">Incident Types</h2>
          </div>
          <div className="p-4 space-y-3">
            {[
              { type: 'Medical', count: 12, percentage: 52, color: 'bg-teal' },
              { type: 'Traffic', count: 5, percentage: 22, color: 'bg-amber' },
              { type: 'Fire', count: 3, percentage: 13, color: 'bg-red' },
              { type: 'Other', count: 3, percentage: 13, color: 'bg-navy-light' },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-ink">{item.type}</span>
                  <span className="text-sm text-ink-muted">{item.count} ({item.percentage}%)</span>
                </div>
                <div className="h-2 bg-paper-border rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Performance Table */}
      <div className="bg-white border border-paper-border rounded-sm overflow-hidden mt-4">
        <div className="px-4 py-3 border-b border-paper-border">
          <h2 className="font-medium text-ink">Individual Performance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-paper-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-ink">Responder</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-ink">Incidents</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-ink">Avg Time</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-ink">Success Rate</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-ink">Rating</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'John Smith', incidents: 12, avgTime: 3.8, successRate: 92, rating: 'Excellent' },
                { name: 'Sarah Johnson', incidents: 10, avgTime: 4.1, successRate: 90, rating: 'Excellent' },
                { name: 'Mike Brown', incidents: 8, avgTime: 4.5, successRate: 88, rating: 'Good' },
                { name: 'Emily Davis', incidents: 9, avgTime: 4.2, successRate: 89, rating: 'Good' },
                { name: 'Alex Wilson', incidents: 7, avgTime: 4.8, successRate: 86, rating: 'Good' },
              ].map((responder, i) => (
                <tr key={i} className="border-b border-paper-border hover:bg-paper-hover">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-navy-light rounded-full flex items-center justify-center">
                        <span className="text-navy text-xs font-semibold">
                          {responder.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <span className="text-sm text-ink">{responder.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center text-sm text-ink">{responder.incidents}</td>
                  <td className="py-3 px-4 text-center text-sm text-ink">{responder.avgTime} min</td>
                  <td className="py-3 px-4 text-center text-sm text-ink">{responder.successRate}%</td>
                  <td className="py-3 px-4 text-center">
                    <Badge
                      variant={responder.rating === 'Excellent' ? 'success' : 'info'}
                      className="text-xs"
                    >
                      {responder.rating}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
  trend,
  trendValue,
  description,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend: 'up' | 'down' | 'stable';
  trendValue: string;
  description: string;
}) {
  const trendIcon = trend === 'up' ? (
    <TrendingUp size={14} className="text-teal" />
  ) : trend === 'down' ? (
    <TrendingDown size={14} className="text-teal" />
  ) : (
    <Activity size={14} className="text-ink-muted" />
  );

  const trendColor = trend === 'stable' ? 'text-ink-muted' : 'text-teal';

  return (
    <div className="bg-white border border-paper-border rounded-sm p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium text-ink">{title}</span>
        </div>
        <Badge variant="live" className="text-xs">Live</Badge>
      </div>
      <div className="text-2xl font-bold text-ink mb-1">{value}</div>
      <div className="flex items-center gap-2 text-xs">
        <div className={`flex items-center gap-1 ${trendColor}`}>
          {trendIcon}
          <span className="font-medium">{trendValue}</span>
        </div>
        <span className="text-ink-muted">{description}</span>
      </div>
    </div>
  );
}