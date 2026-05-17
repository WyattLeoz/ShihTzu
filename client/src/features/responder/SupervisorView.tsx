import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSSE } from '../../hooks/useSSE';
import { LogOut, LayoutDashboard, Plus, Map as MapIcon, Users, Shield, TrendingUp, Calendar, UserCheck } from 'lucide-react';
import { Badge } from '../../components/Badge';

export function SupervisorView() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { connectionState } = useSSE();

  const navItems = [
    { path: '/responder', label: 'Incident Queue', icon: LayoutDashboard },
    { path: '/responder/new', label: 'New Incident', icon: Plus },
    { path: '/responder/team', label: 'Team Overview', icon: UserCheck },
    { path: '/responder/analytics', label: 'Performance', icon: TrendingUp },
    { path: '/responder/resources', label: 'Resources', icon: Users },
    { path: '/responder/map', label: 'Live Map', icon: MapIcon },
    { path: '/responder/schedule', label: 'Shift Schedule', icon: Calendar },
  ];

  const isActive = (path: string) => {
    if (path === '/responder') {
      return location.pathname === '/responder' || location.pathname.startsWith('/responder/ticket');
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-paper-border flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-paper-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber rounded-sm flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <div>
              <span className="text-navy font-semibold text-sm">QuickAid</span>
              <span className="text-xs text-amber-dark block font-medium">SUPERVISOR</span>
            </div>
          </div>
        </div>

        {/* Connection indicator */}
        <div className="px-6 py-3 border-b border-paper-border flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              connectionState === 'connected' ? 'bg-teal' : 'bg-amber'
            }`}
          />
          <span className="text-xs font-mono text-ink-muted">
            {connectionState === 'connected' ? 'LIVE' : 'RECONNECTING'}
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <button
                    onClick={() => navigate(item.path)}
                    className={`
                      w-full flex items-center gap-3 px-6 py-2.5 text-sm font-medium
                      ${isActive(item.path)
                        ? 'bg-amber text-white'
                        : 'text-ink hover:bg-paper-hover'
                      }
                    `}
                  >
                    <Icon size={16} />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-paper-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-amber-light rounded-full flex items-center justify-center">
              <Shield size={14} className="text-amber-dark" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink truncate">
                {user?.fullName || 'Unknown'}
              </p>
              <Badge variant="warning" className="text-[10px]">
                {user?.role || 'supervisor'}
              </Badge>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2
              text-sm text-ink-muted hover:text-ink hover:bg-paper-hover rounded-sm
            "
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-paper">
        <div className="p-4 text-ink-muted text-sm">
          Debug: {location.pathname}
        </div>
        <Outlet />
      </main>
    </div>
  );
}

// Team Overview Component
export function TeamOverview() {
  console.log('TeamOverview rendered');
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="text-center py-8">
        <h1 className="text-2xl font-semibold text-ink mb-2">Team Overview</h1>
        <p className="text-sm text-ink-muted">If you can see this, the component is rendering!</p>
      </div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-ink mb-1">Team Overview</h1>
        <p className="text-sm text-ink-muted">Monitor your team's performance and status</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-paper-border rounded-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-ink">Active Responders</span>
            <Badge variant="success" className="text-xs">8 Active</Badge>
          </div>
          <div className="text-2xl font-bold text-ink">8</div>
          <div className="text-xs text-ink-muted mt-1">of 12 total team members</div>
        </div>

        <div className="bg-white border border-paper-border rounded-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-ink">Incidents Handled</span>
            <Badge variant="info" className="text-xs">Today</Badge>
          </div>
          <div className="text-2xl font-bold text-ink">23</div>
          <div className="text-xs text-ink-muted mt-1">+5 from yesterday</div>
        </div>

        <div className="bg-white border border-paper-border rounded-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-ink">Avg Response Time</span>
            <Badge variant="success" className="text-xs">Good</Badge>
          </div>
          <div className="text-2xl font-bold text-ink">4.2min</div>
          <div className="text-xs text-ink-muted mt-1">Target: 5 minutes</div>
        </div>
      </div>

      <div className="bg-white border border-paper-border rounded-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-paper-border">
          <h2 className="font-medium text-ink">Team Members</h2>
        </div>
        <div className="divide-y divide-paper-border">
          {[
            { name: 'John Smith', status: 'active', incidents: 4, lastActive: '2 min ago' },
            { name: 'Sarah Johnson', status: 'active', incidents: 3, lastActive: '5 min ago' },
            { name: 'Mike Brown', status: 'on-scene', incidents: 2, lastActive: '1 min ago' },
            { name: 'Emily Davis', status: 'active', incidents: 3, lastActive: '8 min ago' },
            { name: 'Alex Wilson', status: 'offline', incidents: 2, lastActive: '1 hour ago' },
          ].map((member, i) => (
            <div key={i} className="px-4 py-3 hover:bg-paper-hover">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-navy-light rounded-full flex items-center justify-center">
                    <span className="text-navy text-xs font-semibold">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-ink">{member.name}</div>
                    <div className="text-xs text-ink-muted">{member.lastActive}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge
                    variant={member.status === 'active' ? 'success' : member.status === 'on-scene' ? 'warning' : 'muted'}
                    className="text-xs capitalize"
                  >
                    {member.status}
                  </Badge>
                  <div className="text-sm text-ink-muted">{member.incidents} incidents</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}