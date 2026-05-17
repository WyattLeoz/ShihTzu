import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSSE } from '../../hooks/useSSE';
import { LogOut, LayoutDashboard, Plus, Map as MapIcon, Users } from 'lucide-react';
import { Badge } from '../../components/Badge';

export function ResponderPortal() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { connectionState } = useSSE();

  const navItems = [
    { path: '/responder', label: 'Queue', icon: LayoutDashboard },
    { path: '/responder/new', label: 'New Incident', icon: Plus },
    { path: '/responder/resources', label: 'Resources', icon: Users },
    { path: '/responder/map', label: 'Map', icon: MapIcon },
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
            <div className="w-8 h-8 bg-navy rounded-sm flex items-center justify-center">
              <span className="text-white font-semibold text-sm">Q</span>
            </div>
            <span className="text-navy font-semibold text-sm">QuickAid Ops</span>
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
                        ? 'bg-navy text-white'
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
            <div className="w-8 h-8 bg-navy-light rounded-full flex items-center justify-center">
              <span className="text-navy text-xs font-semibold">
                {user?.fullName?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink truncate">
                {user?.fullName || 'Unknown'}
              </p>
              <Badge variant="info" className="text-[10px]">
                {user?.role || 'user'}
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
        <Outlet />
      </main>
    </div>
  );
}