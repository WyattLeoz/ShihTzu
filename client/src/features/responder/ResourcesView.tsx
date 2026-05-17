import { useState } from 'react';
import { useHospitals, useVolunteers } from '../../api/resources';
import { Hospital, Volunteer } from '../../types';
import { Bed, Activity, Phone, UserCheck, MapPin, RefreshCw, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Badge } from '../../components/Badge';

export function ResourcesView() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<'hospitals' | 'volunteers'>('hospitals');

  console.log('ResourcesView rendered');

  const { data: hospitalsData, isLoading: hospitalsLoading, refetch: refetchHospitals } = useHospitals({ queryKey: ['hospitals', refreshKey] });
  const { data: volunteersData, isLoading: volunteersLoading, refetch: refetchVolunteers } = useVolunteers({ queryKey: ['volunteers', refreshKey] });

  const hospitals = hospitalsData?.hospitals || [];
  const volunteers = volunteersData?.volunteers || [];

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    refetchHospitals();
    refetchVolunteers();
  };

  const availableHospitals = hospitals.filter(h => h.availableBeds > 0);
  const availableVolunteers = volunteers.filter(v => v.isAvailable);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="text-center py-8">
        <h1 className="text-2xl font-semibold text-ink mb-2">Resource Management</h1>
        <p className="text-sm text-ink-muted">If you can see this, the component is rendering!</p>
        <div className="mt-4">
          <p className="text-xs text-ink-muted">Hospitals: {hospitals.length}</p>
          <p className="text-xs text-ink-muted">Volunteers: {volunteers.length}</p>
        </div>
      </div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-ink mb-1">Resource Management</h1>
            <p className="text-sm text-ink-muted">Monitor and manage available resources</p>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-sm hover:bg-navy-dark transition-colors"
          >
            <RefreshCw size={16} className={hospitalsLoading || volunteersLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <SummaryCard
            title="Total Hospitals"
            value={hospitals.length}
            icon={<Activity size={20} className="text-teal" />}
            subtitle={`${availableHospitals.length} with capacity`}
          />
          <SummaryCard
            title="Available Beds"
            value={hospitals.reduce((sum, h) => sum + h.availableBeds, 0)}
            icon={<Bed size={20} className="text-teal" />}
            subtitle={`of ${hospitals.reduce((sum, h) => sum + h.totalBeds, 0)} total`}
          />
          <SummaryCard
            title="Total Volunteers"
            value={volunteers.length}
            icon={<UserCheck size={20} className="text-teal" />}
            subtitle={`${availableVolunteers.length} available`}
          />
          <SummaryCard
            title="ICU Capacity"
            value={hospitals.reduce((sum, h) => sum + h.icuAvailable, 0)}
            icon={<AlertTriangle size={20} className="text-amber" />}
            subtitle={`beds available`}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-paper-border rounded-sm overflow-hidden">
        <div className="flex border-b border-paper-border">
          <button
            onClick={() => setActiveTab('hospitals')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'hospitals'
                ? 'bg-navy text-white'
                : 'bg-white text-ink hover:bg-paper-hover'
            }`}
          >
            Hospitals
          </button>
          <button
            onClick={() => setActiveTab('volunteers')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'volunteers'
                ? 'bg-navy text-white'
                : 'bg-white text-ink hover:bg-paper-hover'
            }`}
          >
            Volunteers
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'hospitals' ? (
            <HospitalsTable hospitals={hospitals} isLoading={hospitalsLoading} />
          ) : (
            <VolunteersTable volunteers={volunteers} isLoading={volunteersLoading} />
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, icon, subtitle }: {
  title: string;
  value: number;
  icon: React.ReactNode;
  subtitle: string;
}) {
  return (
    <div className="bg-white border border-paper-border rounded-sm p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium text-ink">{title}</span>
        </div>
        <Badge variant="info" className="text-xs">Live</Badge>
      </div>
      <div className="text-2xl font-bold text-ink mb-1">{value}</div>
      <div className="text-xs text-ink-muted">{subtitle}</div>
    </div>
  );
}

function HospitalsTable({ hospitals, isLoading }: {
  hospitals: Hospital[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal"></div>
        <p className="text-ink-muted mt-2">Loading hospitals...</p>
      </div>
    );
  }

  if (hospitals.length === 0) {
    return (
      <div className="text-center py-12">
        <HospitalIcon className="mx-auto h-12 w-12 text-ink-muted mb-2" />
        <p className="text-ink-muted">No hospitals available</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-paper-border">
            <th className="text-left py-3 px-4 text-sm font-medium text-ink">Hospital</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-ink">Location</th>
            <th className="text-center py-3 px-4 text-sm font-medium text-ink">Beds</th>
            <th className="text-center py-3 px-4 text-sm font-medium text-ink">ICU</th>
            <th className="text-center py-3 px-4 text-sm font-medium text-ink">Trauma</th>
            <th className="text-center py-3 px-4 text-sm font-medium text-ink">Status</th>
          </tr>
        </thead>
        <tbody>
          {hospitals.map((hospital) => {
            const bedPercentage = (hospital.availableBeds / hospital.totalBeds) * 100;
            const statusColor = bedPercentage > 30 ? 'bg-teal' : bedPercentage > 10 ? 'bg-amber' : 'bg-red';

            return (
              <tr key={hospital.id} className="border-b border-paper-border hover:bg-paper-hover">
                <td className="py-3 px-4">
                  <div className="font-medium text-ink">{hospital.name}</div>
                  <div className="text-xs text-ink-muted">{hospital.phone}</div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2 text-sm text-ink-muted">
                    <MapPin size={14} />
                    <span className="truncate max-w-[200px]">{hospital.address}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-center">
                  <div className="text-sm font-medium text-ink">
                    {hospital.availableBeds}/{hospital.totalBeds}
                  </div>
                  <div className="w-16 h-1.5 bg-paper-border rounded-full mt-1 mx-auto">
                    <div
                      className={`h-full ${statusColor} rounded-full`}
                      style={{ width: `${bedPercentage}%` }}
                    />
                  </div>
                </td>
                <td className="py-3 px-4 text-center">
                  <div className="text-sm font-medium text-ink">{hospital.icuAvailable}</div>
                </td>
                <td className="py-3 px-4 text-center">
                  <div className="text-sm font-medium text-ink">{hospital.traumaBays}</div>
                </td>
                <td className="py-3 px-4 text-center">
                  <Badge
                    variant={bedPercentage > 30 ? 'success' : bedPercentage > 10 ? 'warning' : 'error'}
                    className="text-xs"
                  >
                    {bedPercentage > 30 ? 'Available' : bedPercentage > 10 ? 'Limited' : 'Critical'}
                  </Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function VolunteersTable({ volunteers, isLoading }: {
  volunteers: Volunteer[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal"></div>
        <p className="text-ink-muted mt-2">Loading volunteers...</p>
      </div>
    );
  }

  if (volunteers.length === 0) {
    return (
      <div className="text-center py-12">
        <UserCheck className="mx-auto h-12 w-12 text-ink-muted mb-2" />
        <p className="text-ink-muted">No volunteers available</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-paper-border">
            <th className="text-left py-3 px-4 text-sm font-medium text-ink">Volunteer</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-ink">Contact</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-ink">Skills</th>
            <th className="text-center py-3 px-4 text-sm font-medium text-ink">Availability</th>
            <th className="text-center py-3 px-4 text-sm font-medium text-ink">Status</th>
          </tr>
        </thead>
        <tbody>
          {volunteers.map((volunteer) => (
            <tr key={volunteer.id} className="border-b border-paper-border hover:bg-paper-hover">
              <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-navy-light rounded-full flex items-center justify-center">
                    <span className="text-navy text-xs font-semibold">
                      {volunteer.fullName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-ink">{volunteer.fullName}</div>
                  </div>
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2 text-sm text-ink-muted">
                  <Phone size={14} />
                  <span>{volunteer.phone}</span>
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="flex flex-wrap gap-1">
                  {volunteer.skills.map((skill) => (
                    <Badge key={skill} variant="info" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </td>
              <td className="py-3 px-4 text-center">
                {volunteer.isAvailable ? (
                  <div className="flex items-center justify-center gap-1 text-teal">
                    <CheckCircle size={14} />
                    <span className="text-sm font-medium">Available</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-1 text-ink-muted">
                    <XCircle size={14} />
                    <span className="text-sm">Unavailable</span>
                  </div>
                )}
              </td>
              <td className="py-3 px-4 text-center">
                <Badge variant={volunteer.isAvailable ? 'success' : 'muted'} className="text-xs">
                  {volunteer.isAvailable ? 'Ready' : 'Offline'}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HospitalIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-6-6h12" />
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  );
}