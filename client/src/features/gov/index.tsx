import { Routes, Route, Navigate } from 'react-router-dom';
import { GovPortal, GovDashboard } from './GovPortal';
import { IncidentManagement } from './IncidentManagement';
import { ResourceManagement } from './ResourceManagement';

export default function GovRouter() {
  return (
    <GovPortal>
      <Routes>
        <Route index element={<GovDashboard />} />
        <Route path="incidents" element={<IncidentManagement />} />
        <Route path="resources" element={<ResourceManagement />} />
        <Route path="broadcasts" element={<BroadcastManagement />} />
        <Route path="analytics" element={<AnalyticsDashboard />} />
        <Route path="settings" element={<SystemSettings />} />
        <Route path="*" element={<Navigate to="/gov" replace />} />
      </Routes>
    </GovPortal>
  );
}

function BroadcastManagement() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-ink mb-1">Broadcast Management</h1>
        <p className="text-sm text-ink-muted">Create and manage public emergency broadcasts</p>
      </div>

      <div className="bg-white border border-paper-border rounded-sm p-8 text-center">
        <p className="text-ink-muted">Broadcast management interface - Coming Soon</p>
      </div>
    </div>
  );
}

function AnalyticsDashboard() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-ink mb-1">Analytics Dashboard</h1>
        <p className="text-sm text-ink-muted">System-wide performance and statistics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-paper-border rounded-sm p-4">
          <div className="text-sm font-medium text-ink mb-1">Total Incidents (30d)</div>
          <div className="text-2xl font-bold text-ink">1,247</div>
          <div className="text-xs text-teal mt-1">↑ 12% vs last period</div>
        </div>
        <div className="bg-white border border-paper-border rounded-sm p-4">
          <div className="text-sm font-medium text-ink mb-1">Avg Response Time</div>
          <div className="text-2xl font-bold text-ink">4.2m</div>
          <div className="text-xs text-teal mt-1">↓ 0.3m vs last period</div>
        </div>
        <div className="bg-white border border-paper-border rounded-sm p-4">
          <div className="text-sm font-medium text-ink mb-1">Resolution Rate</div>
          <div className="text-2xl font-bold text-ink">94%</div>
          <div className="text-xs text-teal mt-1">↑ 2% vs last period</div>
        </div>
        <div className="bg-white border border-paper-border rounded-sm p-4">
          <div className="text-sm font-medium text-ink mb-1">Active Users</div>
          <div className="text-2xl font-bold text-ink">847</div>
          <div className="text-xs text-teal mt-1">↑ 5% vs last period</div>
        </div>
      </div>
    </div>
  );
}

function SystemSettings() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-ink mb-1">System Settings</h1>
        <p className="text-sm text-ink-muted">Configure system-wide parameters</p>
      </div>

      <div className="bg-white border border-paper-border rounded-sm p-8 text-center">
        <p className="text-ink-muted">System settings interface - Coming Soon</p>
      </div>
    </div>
  );
}