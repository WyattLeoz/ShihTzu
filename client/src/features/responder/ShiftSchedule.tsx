import { useState } from 'react';
import { Calendar, Clock, Plus, Edit, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '../../components/Badge';

export function ShiftSchedule() {
  console.log('ShiftSchedule rendered');
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const shifts = [
    {
      id: 1,
      responder: 'John Smith',
      shift: 'Morning',
      start: '06:00',
      end: '14:00',
      status: 'active',
      unit: 'Zone A',
    },
    {
      id: 2,
      responder: 'Sarah Johnson',
      shift: 'Day',
      start: '08:00',
      end: '16:00',
      status: 'active',
      unit: 'Zone B',
    },
    {
      id: 3,
      responder: 'Mike Brown',
      shift: 'Afternoon',
      start: '14:00',
      end: '22:00',
      status: 'upcoming',
      unit: 'Zone C',
    },
    {
      id: 4,
      responder: 'Emily Davis',
      shift: 'Night',
      start: '22:00',
      end: '06:00',
      status: 'upcoming',
      unit: 'Zone A',
    },
    {
      id: 5,
      responder: 'Alex Wilson',
      shift: 'Day',
      start: '08:00',
      end: '16:00',
      status: 'completed',
      unit: 'Zone B',
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-ink mb-1">Shift Schedule</h1>
          <p className="text-sm text-ink-muted">Manage responder shifts and assignments</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('week')}
            className={`px-4 py-2 text-sm rounded-sm transition-colors ${
              viewMode === 'week'
                ? 'bg-teal text-white'
                : 'bg-white text-ink hover:bg-paper-hover border border-paper-border'
            }`}
          >
            Week View
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`px-4 py-2 text-sm rounded-sm transition-colors ${
              viewMode === 'month'
                ? 'bg-teal text-white'
                : 'bg-white text-ink hover:bg-paper-hover border border-paper-border'
            }`}
          >
            Month View
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-sm hover:bg-navy-dark transition-colors">
            <Plus size={16} />
            Add Shift
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-paper-border rounded-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-ink">Active Now</span>
            <Badge variant="success" className="text-xs">Live</Badge>
          </div>
          <div className="text-2xl font-bold text-ink">2</div>
          <div className="text-xs text-ink-muted mt-1">responders on duty</div>
        </div>

        <div className="bg-white border border-paper-border rounded-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-ink">Upcoming</span>
            <Badge variant="info" className="text-xs">Today</Badge>
          </div>
          <div className="text-2xl font-bold text-ink">3</div>
          <div className="text-xs text-ink-muted mt-1">shifts remaining</div>
        </div>

        <div className="bg-white border border-paper-border rounded-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-ink">Completed</span>
            <Badge variant="muted" className="text-xs">Today</Badge>
          </div>
          <div className="text-2xl font-bold text-ink">1</div>
          <div className="text-xs text-ink-muted mt-1">shifts finished</div>
        </div>

        <div className="bg-white border border-paper-border rounded-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-ink">Coverage</span>
            <Badge variant="warning" className="text-xs">Alert</Badge>
          </div>
          <div className="text-2xl font-bold text-ink">67%</div>
          <div className="text-xs text-ink-muted mt-1">target: 80%</div>
        </div>
      </div>

      {/* Shift Timeline */}
      <div className="bg-white border border-paper-border rounded-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-paper-border flex items-center justify-between">
          <h2 className="font-medium text-ink">Today's Schedule</h2>
          <div className="flex items-center gap-2 text-sm text-ink-muted">
            <Calendar size={14} />
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>

        <div className="divide-y divide-paper-border">
          {shifts.map((shift) => (
            <div key={shift.id} className="px-4 py-4 hover:bg-paper-hover">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-paper-border rounded-full flex items-center justify-center">
                    <Clock size={20} className="text-ink-muted" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-ink">{shift.responder}</h3>
                      <Badge variant={shift.status === 'active' ? 'success' : shift.status === 'upcoming' ? 'info' : 'muted'} className="text-xs capitalize">
                        {shift.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-ink-muted">
                      <span>{shift.shift}</span>
                      <span>•</span>
                      <span>{shift.start} - {shift.end}</span>
                      <span>•</span>
                      <span>{shift.unit}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-paper-hover rounded-sm text-ink-muted hover:text-ink">
                    <Edit size={16} />
                  </button>
                  {shift.status === 'active' && (
                    <button className="flex items-center gap-1 px-3 py-1 bg-red-light text-red text-sm rounded-sm hover:bg-red hover:text-white transition-colors">
                      <XCircle size={14} />
                      End Shift
                    </button>
                  )}
                  {shift.status === 'upcoming' && (
                    <button className="flex items-center gap-1 px-3 py-1 bg-teal-light text-teal text-sm rounded-sm hover:bg-teal hover:text-white transition-colors">
                      <CheckCircle size={14} />
                      Start Shift
                    </button>
                  )}
                </div>
              </div>

              {/* Timeline visualization */}
              <div className="mt-4 ml-16">
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-2 bg-paper-border rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        shift.status === 'active'
                          ? 'bg-teal animate-pulse'
                          : shift.status === 'upcoming'
                          ? 'bg-amber-light'
                          : 'bg-teal'
                      } rounded-full transition-all`}
                      style={{
                        width: shift.status === 'active'
                          ? '65%'
                          : shift.status === 'upcoming'
                          ? '0%'
                          : '100%',
                      }}
                    />
                  </div>
                  <span className="text-xs text-ink-muted w-16 text-right">
                    {shift.status === 'active' ? '65% complete' : shift.status === 'upcoming' ? 'Upcoming' : 'Completed'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <button className="flex items-center gap-3 p-4 bg-white border border-paper-border rounded-sm hover:bg-paper-hover transition-colors">
          <div className="w-10 h-10 bg-amber-light rounded-full flex items-center justify-center">
            <Plus size={20} className="text-amber" />
          </div>
          <div className="text-left">
            <div className="font-medium text-ink">Add One-Time Shift</div>
            <div className="text-xs text-ink-muted">Create temporary assignment</div>
          </div>
        </button>

        <button className="flex items-center gap-3 p-4 bg-white border border-paper-border rounded-sm hover:bg-paper-hover transition-colors">
          <div className="w-10 h-10 bg-teal-light rounded-full flex items-center justify-center">
            <Calendar size={20} className="text-teal" />
          </div>
          <div className="text-left">
            <div className="font-medium text-ink">Create Schedule</div>
            <div className="text-xs text-ink-muted">Set recurring shifts</div>
          </div>
        </button>

        <button className="flex items-center gap-3 p-4 bg-white border border-paper-border rounded-sm hover:bg-paper-hover transition-colors">
          <div className="w-10 h-10 bg-navy-light rounded-full flex items-center justify-center">
            <Edit size={20} className="text-navy" />
          </div>
          <div className="text-left">
            <div className="font-medium text-ink">Manage Requests</div>
            <div className="text-xs text-ink-muted">Time off and swaps</div>
          </div>
        </button>
      </div>
    </div>
  );
}