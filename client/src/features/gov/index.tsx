import { Routes, Route, Navigate } from 'react-router-dom';
import { GovPortal, GovDashboard } from './GovPortal';
import { IncidentManagement } from './IncidentManagement';
import { ResourceManagement } from './ResourceManagement';
import { BroadcastManagement } from './Broadcastmanagement';
import { MapView } from '../responder/MapView';

export default function GovRouter() {
  return (
    <GovPortal>
      <Routes>
        <Route index                element={<GovDashboard />}        />
        <Route path="incidents"     element={<IncidentManagement />}  />
        <Route path="resources"     element={<ResourceManagement />}  />
        <Route path="broadcasts"    element={<BroadcastManagement />} />
        <Route path="analytics"     element={<AnalyticsDashboard />}  />
        <Route path="map"           element={<MapView />}             />
        <Route path="settings"      element={<SystemSettings />}      />
        <Route path="*"             element={<Navigate to="/gov" replace />} />
      </Routes>
    </GovPortal>
  );
}

// ─── Analytics ─────────────────────────────────────────────────────────────────

function AnalyticsDashboard() {
  const stats = [
    { label: 'Total Incidents (30d)', value: '1,247', trend: '↑ 12%', good: false },
    { label: 'Avg Response Time',     value: '4.2m',  trend: '↓ 0.3m', good: true  },
    { label: 'Resolution Rate',       value: '94%',   trend: '↑ 2%',  good: true  },
    { label: 'Active Users',          value: '847',   trend: '↑ 5%',  good: true  },
  ];

  const incidentsByType = [
    { type: 'Medical',        count: 512, pct: 41, color: 'bg-red' },
    { type: 'Road Accident',  count: 298, pct: 24, color: 'bg-amber' },
    { type: 'Fire',           count: 187, pct: 15, color: 'bg-orange-500' },
    { type: 'Flood',          count: 150, pct: 12, color: 'bg-blue-500' },
    { type: 'Infrastructure', count: 62,  pct: 5,  color: 'bg-purple-500' },
    { type: 'Civil',          count: 38,  pct: 3,  color: 'bg-navy' },
  ];

  const responseByZone = [
    { zone: 'Jurong / West',      incidents: 312, avgTime: 4.1 },
    { zone: 'Central / City',     incidents: 287, avgTime: 3.8 },
    { zone: 'North / Woodlands',  incidents: 198, avgTime: 5.2 },
    { zone: 'East / Tampines',    incidents: 241, avgTime: 4.6 },
    { zone: 'North-East / Punggol', incidents: 209, avgTime: 4.9 },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-ink mb-1">Analytics Dashboard</h1>
        <p className="text-sm text-ink-muted">System-wide performance statistics — last 30 days</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => (
          <div key={i} className="bg-white border border-paper-border rounded-sm p-4">
            <p className="text-sm font-medium text-ink mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-ink">{s.value}</p>
            <p className={`text-xs mt-1 font-semibold ${s.good ? 'text-teal-dark' : 'text-red-dark'}`}>{s.trend} vs last period</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Incident type breakdown */}
        <div className="bg-white border border-paper-border rounded-sm p-5">
          <h2 className="font-semibold text-ink mb-4">Incidents by Type</h2>
          <div className="space-y-3">
            {incidentsByType.map(r => (
              <div key={r.type}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-ink">{r.type}</span>
                  <span className="font-semibold text-ink">{r.count} <span className="text-ink-muted font-normal text-xs">({r.pct}%)</span></span>
                </div>
                <div className="h-2 bg-paper-border rounded-full overflow-hidden">
                  <div className={`h-full ${r.color} rounded-full`} style={{ width: `${r.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Response by zone */}
        <div className="bg-white border border-paper-border rounded-sm p-5">
          <h2 className="font-semibold text-ink mb-4">Performance by Planning Zone</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-paper-border">
                  <th className="text-left py-2 text-ink-muted font-medium text-xs uppercase">Zone</th>
                  <th className="text-center py-2 text-ink-muted font-medium text-xs uppercase">Incidents</th>
                  <th className="text-center py-2 text-ink-muted font-medium text-xs uppercase">Avg Response</th>
                  <th className="text-center py-2 text-ink-muted font-medium text-xs uppercase">vs Target</th>
                </tr>
              </thead>
              <tbody>
                {responseByZone.map(z => {
                  const onTarget = z.avgTime <= 5;
                  return (
                    <tr key={z.zone} className="border-b border-paper-border hover:bg-paper-hover">
                      <td className="py-2.5 text-ink font-medium">{z.zone}</td>
                      <td className="py-2.5 text-center text-ink-muted">{z.incidents}</td>
                      <td className="py-2.5 text-center font-mono font-semibold text-ink">{z.avgTime}m</td>
                      <td className="py-2.5 text-center">
                        <span className={`text-xs font-semibold ${onTarget ? 'text-teal-dark' : 'text-red-dark'}`}>
                          {onTarget ? '✓ On target' : '✗ Over target'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Hourly distribution bar chart */}
      <div className="bg-white border border-paper-border rounded-sm p-5">
        <h2 className="font-semibold text-ink mb-4">Incident Volume by Hour (24h average)</h2>
        <div className="flex items-end gap-1 h-32">
          {[2,1,1,1,2,3,5,8,9,7,6,7,8,7,6,7,8,9,10,9,7,5,4,3].map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className={`w-full rounded-t ${v >= 9 ? 'bg-red' : v >= 7 ? 'bg-amber' : 'bg-teal'}`}
                style={{ height: `${(v / 10) * 100}%` }} />
              {i % 4 === 0 && <span className="text-[9px] text-ink-muted">{String(i).padStart(2,'0')}</span>}
            </div>
          ))}
        </div>
        <p className="text-xs text-ink-muted mt-2">Peak hours: 17:00–21:00. Lowest: 02:00–05:00.</p>
      </div>
    </div>
  );
}

// ─── Settings ──────────────────────────────────────────────────────────────────

function SystemSettings() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-ink mb-1">System Settings</h1>
        <p className="text-sm text-ink-muted">Configure system-wide parameters and integrations</p>
      </div>

      <div className="space-y-6">
        {[
          { section: 'Alert Thresholds', desc: 'Configured on the Command Dashboard → Thresholds button.' },
          { section: 'Data Sources',     desc: 'MOH outbreak data, PUB water levels, LTA traffic — all integrated via government APIs.' },
          { section: 'Notification Settings', desc: 'SMS, email and push notification templates for each broadcast audience.' },
          { section: 'Access Control',   desc: 'Manage user roles: gov_admin, supervisor, responder, citizen.' },
          { section: 'Audit Logs',       desc: 'All actions are logged with user ID, timestamp and IP address per PDPA requirements.' },
        ].map(({ section, desc }) => (
          <div key={section} className="bg-white border border-paper-border rounded-sm p-5">
            <h3 className="font-semibold text-ink mb-1">{section}</h3>
            <p className="text-sm text-ink-muted mb-3">{desc}</p>
            <button className="px-4 py-2 border border-paper-border rounded-sm text-sm hover:bg-paper-hover text-ink-muted">
              Configure →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}