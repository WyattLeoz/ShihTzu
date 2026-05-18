import { ReactNode, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSSE } from '../../hooks/useSSE';
import {
  LogOut, LayoutDashboard, Plus, Map as MapIcon,
  Users, Shield, TrendingUp, Calendar, UserCheck,
  ChevronDown, ChevronRight, Edit, Trash2,
  CheckCircle, XCircle, Activity, AlertTriangle,
  Droplets, Flame, Car, Building2, Heart,
} from 'lucide-react';
import { Badge } from '../../components/Badge';

// ─── Layout wrapper ────────────────────────────────────────────────────────────

interface SupervisorViewProps { children?: ReactNode }

export function SupervisorView({ children }: SupervisorViewProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { connectionState } = useSSE();

  const navItems = [
    { path: '/responder',            label: 'Incident Queue',  icon: LayoutDashboard },
    { path: '/responder/new',        label: 'New Incident',    icon: Plus },
    { path: '/responder/team',       label: 'Teams',           icon: UserCheck },
    { path: '/responder/analytics',  label: 'Performance',     icon: TrendingUp },
    { path: '/responder/resources',  label: 'Resources',       icon: Users },
    { path: '/responder/map',        label: 'Live Map',        icon: MapIcon },
    { path: '/responder/schedule',   label: 'Shift Schedule',  icon: Calendar },
  ];

  const isActive = (path: string) => {
    if (path === '/responder')
      return location.pathname === '/responder' || location.pathname.startsWith('/responder/ticket');
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-64 bg-white border-r border-paper-border flex flex-col">
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
        <div className="px-6 py-3 border-b border-paper-border flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connectionState === 'connected' ? 'bg-teal' : 'bg-amber'}`} />
          <span className="text-xs font-mono text-ink-muted">
            {connectionState === 'connected' ? 'LIVE' : 'RECONNECTING'}
          </span>
        </div>
        <nav className="flex-1 py-4">
          <ul className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <button onClick={() => navigate(item.path)}
                    className={`w-full flex items-center gap-3 px-6 py-2.5 text-sm font-medium ${
                      isActive(item.path) ? 'bg-amber text-white' : 'text-ink hover:bg-paper-hover'
                    }`}>
                    <Icon size={16} />{item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="p-4 border-t border-paper-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-amber-light rounded-full flex items-center justify-center">
              <Shield size={14} className="text-amber-dark" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink truncate">{user?.fullName || 'Unknown'}</p>
              <Badge variant="warning" className="text-[10px]">{user?.role || 'supervisor'}</Badge>
            </div>
          </div>
          <button onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-ink-muted hover:text-ink hover:bg-paper-hover rounded-sm">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto bg-paper">{children}</main>
    </div>
  );
}

// ─── Team data types ───────────────────────────────────────────────────────────

type MemberStatus = 'active' | 'on-scene' | 'standby' | 'offline';
type TeamStatus   = 'active' | 'standby' | 'deployed' | 'offline';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  status: MemberStatus;
  currentAssignment?: string;
  lastActive: string;
}

interface SubTeam {
  id: string;
  name: string;
  lead: string;
  status: TeamStatus;
  members: TeamMember[];
  currentIncident?: string;
  location: string;
}

interface OperationalTeam {
  id: string;
  category: string;
  icon: React.ReactNode;
  color: string;
  agency: string;
  subTeams: SubTeam[];
}

// ─── Mock team data ────────────────────────────────────────────────────────────

const OPERATIONAL_TEAMS: OperationalTeam[] = [
  {
    id: 'flood',
    category: 'Flood Response',
    icon: <Droplets size={16} />,
    color: 'text-blue-600',
    agency: 'SCDF / PUB',
    subTeams: [
      {
        id: 'flood-jurong-a',
        name: 'Jurong Division Alpha',
        lead: 'SSgt Muthu Rajan',
        status: 'deployed',
        location: 'Jurong West Fire Station',
        currentIncident: 'INC-2847',
        members: [
          { id: 'fja1', name: 'Muthu Rajan',   role: 'Team Leader',    status: 'on-scene', currentAssignment: 'INC-2847 — Pump ops', lastActive: '2m ago' },
          { id: 'fja2', name: 'Lee Kai Xiang', role: 'Pump Operator',  status: 'on-scene', currentAssignment: 'INC-2847 — Pump ops', lastActive: '2m ago' },
          { id: 'fja3', name: 'Ahmad Danial',  role: 'Rescue Diver',   status: 'on-scene', currentAssignment: 'INC-2847 — Rescue',   lastActive: '5m ago' },
          { id: 'fja4', name: 'Priya Sharma',  role: 'Paramedic',      status: 'active',   currentAssignment: 'Medical standby',      lastActive: '1m ago' },
        ],
      },
      {
        id: 'flood-jurong-b',
        name: 'Jurong Division Bravo',
        lead: 'SSgt Wong Boon Teck',
        status: 'standby',
        location: 'Clementi Fire Station',
        members: [
          { id: 'fjb1', name: 'Wong Boon Teck', role: 'Team Leader',    status: 'standby', lastActive: '10m ago' },
          { id: 'fjb2', name: 'Ravi Kumar',      role: 'Pump Operator',  status: 'standby', lastActive: '10m ago' },
          { id: 'fjb3', name: 'Nur Aisyah',      role: 'Rescue Diver',   status: 'standby', lastActive: '12m ago' },
        ],
      },
      {
        id: 'flood-woodlands',
        name: 'Woodlands Division',
        lead: 'SSgt Tan Siew Lian',
        status: 'active',
        location: 'Woodlands Fire Station',
        members: [
          { id: 'fw1', name: 'Tan Siew Lian',  role: 'Team Leader',   status: 'active',  lastActive: '3m ago' },
          { id: 'fw2', name: 'Gopal Nathan',   role: 'Pump Operator', status: 'active',  lastActive: '3m ago' },
        ],
      },
    ],
  },
  {
    id: 'fire',
    category: 'Fire & Rescue',
    icon: <Flame size={16} />,
    color: 'text-orange-600',
    agency: 'SCDF',
    subTeams: [
      {
        id: 'fire-jurong',
        name: 'Jurong East Station',
        lead: 'LCP David Lim',
        status: 'active',
        location: 'Jurong East Fire Station',
        members: [
          { id: 'fje1', name: 'David Lim',    role: 'Station IC',  status: 'active',  lastActive: '5m ago' },
          { id: 'fje2', name: 'Faizal bin M', role: 'Fire Fighter', status: 'active',  lastActive: '5m ago' },
          { id: 'fje3', name: 'Chen Wei Ming', role: 'Fire Fighter', status: 'standby', lastActive: '8m ago' },
        ],
      },
      {
        id: 'fire-clementi',
        name: 'Clementi Station',
        lead: 'SSgt Harbajan Singh',
        status: 'standby',
        location: 'Clementi Fire Station',
        members: [
          { id: 'fc1', name: 'Harbajan Singh', role: 'Station IC',   status: 'standby', lastActive: '15m ago' },
          { id: 'fc2', name: 'Lim Shu Ting',  role: 'Fire Fighter', status: 'standby', lastActive: '15m ago' },
        ],
      },
    ],
  },
  {
    id: 'medical',
    category: 'Medical / EMS',
    icon: <Heart size={16} />,
    color: 'text-red-600',
    agency: 'SCDF EMS',
    subTeams: [
      {
        id: 'ems-alpha',
        name: 'EMS Alpha Team',
        lead: 'Paramedic Sarah Tan',
        status: 'deployed',
        location: 'En route INC-2845',
        currentIncident: 'INC-2845',
        members: [
          { id: 'ea1', name: 'Sarah Tan',     role: 'Senior Paramedic', status: 'on-scene', currentAssignment: 'INC-2845 CPR case', lastActive: '1m ago' },
          { id: 'ea2', name: 'Abdul Hamid',   role: 'Paramedic',        status: 'on-scene', currentAssignment: 'INC-2845 CPR case', lastActive: '1m ago' },
        ],
      },
      {
        id: 'ems-bravo',
        name: 'EMS Bravo Team',
        lead: 'Paramedic James Ng',
        status: 'active',
        location: 'Jurong West Ambulance Base',
        members: [
          { id: 'eb1', name: 'James Ng',    role: 'Senior Paramedic', status: 'active',  lastActive: '4m ago' },
          { id: 'eb2', name: 'Siti Rahimah', role: 'Paramedic',       status: 'active',  lastActive: '4m ago' },
        ],
      },
    ],
  },
  {
    id: 'police',
    category: 'Police / SPF',
    icon: <Shield size={16} />,
    color: 'text-navy',
    agency: 'SPF',
    subTeams: [
      {
        id: 'spf-jurong',
        name: 'Jurong West NPC',
        lead: 'Sgt Tan Wei Loong',
        status: 'active',
        location: 'Jurong West NPC',
        members: [
          { id: 'spfj1', name: 'Tan Wei Loong',  role: 'Patrol Sgt',   status: 'active',  lastActive: '2m ago' },
          { id: 'spfj2', name: 'R. Mahenthiran', role: 'Patrol Officer', status: 'active', lastActive: '2m ago' },
          { id: 'spfj3', name: 'Ng Mei Fong',    role: 'Patrol Officer', status: 'on-scene', currentAssignment: 'INC-2847 cordon', lastActive: '5m ago' },
        ],
      },
      {
        id: 'spf-bukit',
        name: 'Bukit Batok NPC',
        lead: 'Sgt Kamarulzaman',
        status: 'standby',
        location: 'Bukit Batok NPC',
        members: [
          { id: 'spfb1', name: 'Kamarulzaman', role: 'Patrol Sgt',    status: 'standby', lastActive: '20m ago' },
          { id: 'spfb2', name: 'Lee Jia Xin',  role: 'Patrol Officer', status: 'standby', lastActive: '20m ago' },
        ],
      },
    ],
  },
  {
    id: 'community',
    category: 'Volunteer Groups',
    icon: <Users size={16} />,
    color: 'text-teal-dark',
    agency: 'PA / SRC',
    subTeams: [
      {
        id: 'vol-redcross',
        name: 'Red Cross Jurong Chapter',
        lead: 'Priya Nair (Coordinator)',
        status: 'deployed',
        location: 'Jurong West Sports Centre',
        currentIncident: 'Evacuation Support',
        members: [
          { id: 'rc1', name: 'Priya Nair',      role: 'Coordinator',  status: 'active',  currentAssignment: 'Shelter ops', lastActive: '3m ago' },
          { id: 'rc2', name: 'Ahmad Fadzil',    role: 'First Aider',  status: 'active',  currentAssignment: 'First aid post', lastActive: '3m ago' },
          { id: 'rc3', name: 'Sarah Tan ML',    role: 'Counsellor',   status: 'active',  currentAssignment: 'Family support', lastActive: '5m ago' },
          { id: 'rc4', name: 'Ravi Kumar',      role: 'Logistics',    status: 'active',  currentAssignment: 'Supply dist.', lastActive: '8m ago' },
          { id: 'rc5', name: 'Li Wei',          role: 'Translator',   status: 'active',  currentAssignment: 'Elderly comms', lastActive: '6m ago' },
        ],
      },
      {
        id: 'vol-pa',
        name: "PA Jurong West Volunteers",
        lead: 'Mdm Helen Chong',
        status: 'standby',
        location: 'Jurong West CC',
        members: [
          { id: 'pa1', name: 'Helen Chong',  role: 'Grassroots Leader', status: 'active',  lastActive: '10m ago' },
          { id: 'pa2', name: 'Tony Lim',     role: 'Food Volunteer',    status: 'standby', lastActive: '15m ago' },
          { id: 'pa3', name: 'Fatimah bte S', role: 'Food Volunteer',  status: 'standby', lastActive: '15m ago' },
        ],
      },
    ],
  },
];

// ─── Status helpers ────────────────────────────────────────────────────────────

const TEAM_STATUS_CFG: Record<TeamStatus, { label: string; dot: string; cls: string }> = {
  active:   { label: 'Active',    dot: 'bg-teal',    cls: 'text-teal-dark bg-teal-light' },
  standby:  { label: 'Standby',   dot: 'bg-amber',   cls: 'text-amber-dark bg-amber-light' },
  deployed: { label: 'Deployed',  dot: 'bg-red',     cls: 'text-red-dark bg-red-light' },
  offline:  { label: 'Offline',   dot: 'bg-gray-400', cls: 'text-ink-muted bg-paper-border' },
};

const MEMBER_STATUS_CFG: Record<MemberStatus, { dot: string; label: string }> = {
  active:   { dot: 'bg-teal',    label: 'Active'   },
  'on-scene': { dot: 'bg-red',   label: 'On Scene' },
  standby:  { dot: 'bg-amber',   label: 'Standby'  },
  offline:  { dot: 'bg-gray-400', label: 'Offline' },
};

// ─── Sub-team card ─────────────────────────────────────────────────────────────

function SubTeamCard({
  subTeam,
  onEdit,
}: {
  subTeam: SubTeam;
  onEdit?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const scfg = TEAM_STATUS_CFG[subTeam.status];
  const activeCount = subTeam.members.filter(m => m.status === 'active' || m.status === 'on-scene').length;

  return (
    <div className={`bg-white border border-paper-border rounded-sm overflow-hidden ${
      subTeam.status === 'deployed' ? 'border-l-4 border-l-red' :
      subTeam.status === 'active' ? 'border-l-4 border-l-teal' : ''
    }`}>
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-paper-hover"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative">
            <span className={`w-2.5 h-2.5 rounded-full ${scfg.dot} flex-shrink-0 inline-block`} />
            {subTeam.status === 'deployed' && (
              <span className={`absolute inset-0 w-2.5 h-2.5 rounded-full ${scfg.dot} animate-ping opacity-60`} />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-ink text-sm truncate">{subTeam.name}</p>
            <p className="text-xs text-ink-muted truncate">Lead: {subTeam.lead}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-2">
          {subTeam.currentIncident && (
            <Badge variant="danger" className="text-[10px]">{subTeam.currentIncident}</Badge>
          )}
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${scfg.cls}`}>{scfg.label}</span>
          <span className="text-xs text-ink-muted">{activeCount}/{subTeam.members.length}</span>
          {open ? <ChevronDown size={14} className="text-ink-muted" /> : <ChevronRight size={14} className="text-ink-muted" />}
        </div>
      </div>

      {open && (
        <div className="border-t border-paper-border">
          {/* Sub-team details */}
          <div className="px-4 py-2 bg-paper flex items-center gap-4 text-xs text-ink-muted">
            <span className="flex items-center gap-1"><MapPin size={11} />{subTeam.location}</span>
          </div>
          {/* Members table */}
          <table className="w-full">
            <thead>
              <tr className="border-b border-paper-border">
                <th className="text-left px-4 py-2 text-[10px] font-semibold text-ink-muted uppercase">Name</th>
                <th className="text-left px-4 py-2 text-[10px] font-semibold text-ink-muted uppercase">Role</th>
                <th className="text-left px-4 py-2 text-[10px] font-semibold text-ink-muted uppercase">Status</th>
                <th className="text-left px-4 py-2 text-[10px] font-semibold text-ink-muted uppercase">Assignment</th>
              </tr>
            </thead>
            <tbody>
              {subTeam.members.map(m => {
                const mcfg = MEMBER_STATUS_CFG[m.status];
                return (
                  <tr key={m.id} className="border-b border-paper-border last:border-0 hover:bg-paper-hover">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-navy-light rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-navy text-[10px] font-bold">{m.name.charAt(0)}</span>
                        </div>
                        <span className="text-xs font-medium text-ink">{m.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-ink-muted">{m.role}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <div className="relative">
                          <span className={`w-2 h-2 rounded-full ${mcfg.dot} inline-block`} />
                          {m.status === 'on-scene' && (
                            <span className={`absolute inset-0 w-2 h-2 rounded-full ${mcfg.dot} animate-ping opacity-60`} />
                          )}
                        </div>
                        <span className="text-xs text-ink-muted">{mcfg.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-ink-muted">
                      {m.currentAssignment ?? <span className="italic">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-4 py-2 flex justify-end gap-2 border-t border-paper-border">
            <button className="text-xs text-teal hover:underline flex items-center gap-1">
              <Edit size={11} /> Edit Sub-team
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TeamOverview ──────────────────────────────────────────────────────────────

import { MapPin } from 'lucide-react';

export function TeamOverview() {
  const [expandedCategory, setExpandedCategory] = useState<string | null>('flood');
  const [showAddSubTeam, setShowAddSubTeam] = useState(false);
  const [filterStatus, setFilterStatus] = useState<TeamStatus | 'all'>('all');

  const totalActive   = OPERATIONAL_TEAMS.flatMap(t => t.subTeams).filter(st => st.status === 'active').length;
  const totalDeployed = OPERATIONAL_TEAMS.flatMap(t => t.subTeams).filter(st => st.status === 'deployed').length;
  const totalStandby  = OPERATIONAL_TEAMS.flatMap(t => t.subTeams).filter(st => st.status === 'standby').length;
  const totalMembers  = OPERATIONAL_TEAMS.flatMap(t => t.subTeams).flatMap(st => st.members).length;
  const activeMembers = OPERATIONAL_TEAMS.flatMap(t => t.subTeams).flatMap(st => st.members)
    .filter(m => m.status === 'active' || m.status === 'on-scene').length;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-ink mb-1">Operational Teams</h1>
          <p className="text-sm text-ink-muted">Category teams and sub-units — real-time status</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-sm hover:bg-navy-dark text-sm">
          <Plus size={16} /> Add Sub-team
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Teams Deployed',  value: totalDeployed, cls: 'text-red',       bgcls: 'bg-red-light border-red' },
          { label: 'Teams Active',    value: totalActive,   cls: 'text-teal-dark', bgcls: 'bg-teal-light border-teal' },
          { label: 'Teams Standby',   value: totalStandby,  cls: 'text-amber-dark', bgcls: 'bg-amber-light border-amber' },
          { label: 'Members Active',  value: `${activeMembers}/${totalMembers}`, cls: 'text-navy', bgcls: 'bg-navy-light border-navy-border' },
        ].map((s, i) => (
          <div key={i} className={`rounded-sm border p-4 ${s.bgcls}`}>
            <p className="text-xs font-medium text-ink-muted mb-1">{s.label}</p>
            <p className={`text-2xl font-black ${s.cls}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-xs font-medium text-ink-muted">Filter:</span>
        {(['all', 'deployed', 'active', 'standby', 'offline'] as const).map(s => (
          <button key={s} onClick={() => setFilterStatus(s as any)}
            className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors capitalize ${
              filterStatus === s ? 'bg-navy text-white' : 'bg-white border border-paper-border text-ink hover:bg-paper-hover'
            }`}>
            {s === 'all' ? 'All Status' : s}
          </button>
        ))}
      </div>

      {/* Category accordion */}
      <div className="space-y-4">
        {OPERATIONAL_TEAMS.map(team => {
          const filteredSubTeams = filterStatus === 'all'
            ? team.subTeams
            : team.subTeams.filter(st => st.status === filterStatus);
          if (filteredSubTeams.length === 0) return null;

          const deployedCount = filteredSubTeams.filter(st => st.status === 'deployed').length;
          const isOpen = expandedCategory === team.id;

          return (
            <div key={team.id} className="bg-white border border-paper-border rounded-sm overflow-hidden">
              {/* Category header */}
              <button
                onClick={() => setExpandedCategory(isOpen ? null : team.id)}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-paper-hover"
              >
                <div className="flex items-center gap-3">
                  <span className={team.color}>{team.icon}</span>
                  <div className="text-left">
                    <p className="font-semibold text-ink">{team.category}</p>
                    <p className="text-xs text-ink-muted">{team.agency} · {filteredSubTeams.length} sub-teams</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {deployedCount > 0 && (
                    <Badge variant="danger" className="text-xs">{deployedCount} deployed</Badge>
                  )}
                  <span className="text-xs text-ink-muted">
                    {filteredSubTeams.flatMap(st => st.members).filter(m => m.status !== 'offline').length} active members
                  </span>
                  {isOpen ? <ChevronDown size={16} className="text-ink-muted" /> : <ChevronRight size={16} className="text-ink-muted" />}
                </div>
              </button>

              {/* Sub-teams */}
              {isOpen && (
                <div className="border-t border-paper-border divide-y divide-paper-border/50">
                  {filteredSubTeams.map(st => (
                    <div key={st.id} className="px-4 py-2">
                      <SubTeamCard subTeam={st} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}