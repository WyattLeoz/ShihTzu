import { Routes, Route, Navigate } from 'react-router-dom';
import { ResponderPortal } from './ResponderPortal';
import { QueueView } from './QueueView';
import { NewIncident } from './NewIncident';
import { TicketDetail } from './TicketDetail';
import { ResourcesView } from './ResourcesView';
import { MapView } from './MapView';
import { PerformanceDashboard } from './PerformanceDashboard';
import { ShiftSchedule } from './ShiftSchedule';
import { TeamOverview } from './SupervisorView';
import { useAuth } from '../../hooks/useAuth';

export default function ResponderRouter() {
  const { user } = useAuth();
  // gov_admins and legacy supervisors have supervisor permissions
  const isSupervisor = user?.role === 'gov_admin' || user?.role === 'supervisor';

  // Define base routes for all responders
  const baseRoutes = (
    <>
      <Route index element={<QueueView />} />
      <Route path="new" element={<NewIncident />} />
      <Route path="ticket/:id" element={<TicketDetail />} />
      <Route path="resources" element={<ResourcesView />} />
      <Route path="map" element={<MapView />} />
    </>
  );

  // Supervisor/gov admin only routes
  const supervisorRoutes = (
    <>
      <Route path="team" element={<TeamOverview />} />
      <Route path="analytics" element={<PerformanceDashboard />} />
      <Route path="schedule" element={<ShiftSchedule />} />
    </>
  );

  return (
    <ResponderPortal isSupervisor={isSupervisor}>
      <Routes>
        {baseRoutes}
        {supervisorRoutes}
        <Route path="*" element={<Navigate to="/responder" replace />} />
      </Routes>
    </ResponderPortal>
  );
}