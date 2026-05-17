import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';

// Public portal pages
import PublicHome from './pages/public/PublicHome';
import ReportIncident from './pages/public/ReportIncident';
import VolunteerSignup from './pages/public/VolunteerSignup';
import AlertFeed from './pages/public/AlertFeed';

// Responder portal pages
import TicketQueue from './pages/responder/TicketQueue';
import TicketDetail from './pages/responder/TicketDetail';
import ResourcePanel from './pages/responder/ResourcePanel';

// Government portal pages
import CommandDashboard from './pages/gov/CommandDashboard';
import BroadcastComposer from './pages/gov/BroadcastComposer';
import Analytics from './pages/gov/Analytics';
import ReportViewer from './pages/gov/ReportViewer';

function App() {
  return (
    <div className="min-h-screen bg-background">
      <Routes>
        {/* Landing page */}
        <Route path="/" element={<LandingPage />} />

        {/* Public portal routes */}
        <Route path="/public" element={<Navigate to="/public/home" replace />} />
        <Route path="/public/home" element={<PublicHome />} />
        <Route path="/public/report" element={<ReportIncident />} />
        <Route path="/public/volunteer" element={<VolunteerSignup />} />
        <Route path="/public/alerts" element={<AlertFeed />} />

        {/* Responder portal routes */}
        <Route path="/responder" element={<Navigate to="/responder/queue" replace />} />
        <Route path="/responder/queue" element={<TicketQueue />} />
        <Route path="/responder/ticket/:id" element={<TicketDetail />} />
        <Route path="/responder/resources" element={<ResourcePanel />} />

        {/* Government portal routes */}
        <Route path="/gov" element={<Navigate to="/gov/dashboard" replace />} />
        <Route path="/gov/dashboard" element={<CommandDashboard />} />
        <Route path="/gov/broadcast" element={<BroadcastComposer />} />
        <Route path="/gov/analytics" element={<Analytics />} />
        <Route path="/gov/report" element={<ReportViewer />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;