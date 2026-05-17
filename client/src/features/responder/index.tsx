import { Routes, Route, Navigate } from 'react-router-dom';
import { ResponderPortal } from './ResponderPortal';
import { QueueView } from './QueueView';
import { NewIncidentForm } from './NewIncidentForm';
import { TicketDetail } from './TicketDetail';

export default function ResponderRouter() {
  return (
    <ResponderPortal>
      <Routes>
        <Route index element={<QueueView />} />
        <Route path="new" element={<NewIncidentForm />} />
        <Route path="ticket/:id" element={<TicketDetail />} />
        <Route path="resources" element={<div className="p-6">Resources View</div>} />
        <Route path="map" element={<div className="p-6">Map View</div>} />
        <Route path="*" element={<Navigate to="/responder" replace />} />
      </Routes>
    </ResponderPortal>
  );
}