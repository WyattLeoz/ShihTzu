import { Routes, Route, Navigate } from 'react-router-dom';
import { ResponderPortal } from './ResponderPortal';
import { SupervisorView, TeamOverview } from './SupervisorView';
import { QueueView } from './QueueView';
import { NewIncident } from './NewIncident';
import { TicketDetail } from './TicketDetail';
import { ResourcesView } from './ResourcesView';
import { MapView } from './MapView';
import { PerformanceDashboard } from './PerformanceDashboard';
import { ShiftSchedule } from './ShiftSchedule';
import { useAuth } from '../../hooks/useAuth';

export default function ResponderRouter() {
  const { user } = useAuth();
  const isSupervisor = user?.role === 'supervisor';
  const isGovAdmin = user?.role === 'gov_admin';

  // Supervisor and gov admins get the enhanced supervisor view
  if (isSupervisor || isGovAdmin) {
    return (
      <SupervisorView>
        <Routes>
          <Route index element={<QueueView />} />
          <Route path="new" element={<NewIncident />} />
          <Route path="ticket/:id" element={<TicketDetail />} />
          <Route path="team" element={<TeamOverview />} />
          <Route path="analytics" element={<PerformanceDashboard />} />
          <Route path="resources" element={<ResourcesView />} />
          <Route path="map" element={<MapView />} />
          <Route path="schedule" element={<ShiftSchedule />} />
          <Route path="*" element={<Navigate to="/responder" replace />} />
        </Routes>
      </SupervisorView>
    );
  }

  // Regular responders get the standard view
  return (
    <ResponderPortal>
      <Routes>
        <Route index element={<QueueView />} />
        <Route path="new" element={<NewIncident />} />
        <Route path="ticket/:id" element={<TicketDetail />} />
        <Route path="resources" element={<ResourcesView />} />
        <Route path="map" element={<MapView />} />
        <Route path="*" element={<Navigate to="/responder" replace />} />
      </Routes>
    </ResponderPortal>
  );
}