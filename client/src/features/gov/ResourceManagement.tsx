import { useState } from 'react';
import { useHospitals, useVolunteers } from '../../api/resources';
import { Hospital, Volunteer } from '../../types';
import { Activity, Users, Phone, Bed, TrendingUp, AlertTriangle, CheckCircle, Edit, Plus } from 'lucide-react';
import { Badge } from '../../components/Badge';

export function ResourceManagement() {
  console.log('ResourceManagement rendered');
  const [activeTab, setActiveTab] = useState<'hospitals' | 'volunteers'>('hospitals');
  const [editingHospital, setEditingHospital] = useState<Hospital | null>(null);

  const { data: hospitalsData, isLoading: hospitalsLoading, refetch: refetchHospitals } = useHospitals();
  const { data: volunteersData, isLoading: volunteersLoading, refetch: refetchVolunteers } = useVolunteers();

  const hospitals = hospitalsData?.hospitals || [];
  const volunteers = volunteersData?.volunteers || [];

  const handleHospitalUpdate = async (hospital: Hospital) => {
    // In real app, this would call the API
    console.log('Updating hospital:', hospital);
    setEditingHospital(null);
    refetchHospitals();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-ink mb-1">Resource Management</h1>
          <p className="text-sm text-ink-muted">Monitor and allocate emergency resources</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-sm hover:bg-navy-dark transition-colors">
          <Plus size={16} />
          Add Resource
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-paper-border rounded-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-ink">Total Hospitals</span>
            <Activity size={20} className="text-teal" />
          </div>
          <div className="text-2xl font-bold text-ink">{hospitals.length}</div>
          <div className="text-xs text-ink-muted mt-1">in network</div>
        </div>

        <div className="bg-white border border-paper-border rounded-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-ink">Available Beds</span>
            <Bed size={20} className="text-teal" />
          </div>
          <div className="text-2xl font-bold text-ink">
            {hospitals.reduce((sum, h) => sum + h.availableBeds, 0)}
          </div>
          <div className="text-xs text-ink-muted mt-1">
            of {hospitals.reduce((sum, h) => sum + h.totalBeds, 0)} total
          </div>
        </div>

        <div className="bg-white border border-paper-border rounded-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-ink">Active Volunteers</span>
            <Users size={20} className="text-teal" />
          </div>
          <div className="text-2xl font-bold text-ink">
            {volunteers.filter(v => v.isAvailable).length}
          </div>
          <div className="text-xs text-ink-muted mt-1">
            of {volunteers.length} total
          </div>
        </div>

        <div className="bg-white border border-paper-border rounded-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-ink">System Status</span>
            <CheckCircle size={20} className="text-teal" />
          </div>
          <div className="text-2xl font-bold text-teal">Healthy</div>
          <div className="text-xs text-ink-muted mt-1">All systems operational</div>
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
            <HospitalManagement
              hospitals={hospitals}
              isLoading={hospitalsLoading}
              editingHospital={editingHospital}
              setEditingHospital={setEditingHospital}
              onUpdate={handleHospitalUpdate}
            />
          ) : (
            <VolunteerManagement
              volunteers={volunteers}
              isLoading={volunteersLoading}
              refetch={refetchVolunteers}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function HospitalManagement({
  hospitals,
  isLoading,
  editingHospital,
  setEditingHospital,
  onUpdate,
}: {
  hospitals: Hospital[];
  isLoading: boolean;
  editingHospital: Hospital | null;
  setEditingHospital: (hospital: Hospital | null) => void;
  onUpdate: (hospital: Hospital) => void;
}) {
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal"></div>
        <p className="text-ink-muted mt-2">Loading hospitals...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {hospitals.map((hospital) => {
        const bedPercentage = (hospital.availableBeds / hospital.totalBeds) * 100;
        const statusColor = bedPercentage > 30 ? 'bg-teal' : bedPercentage > 10 ? 'bg-amber' : 'bg-red';

        return (
          <div key={hospital.id} className="bg-paper border border-paper-border rounded-sm p-4 hover:bg-paper-hover transition-colors">
            {editingHospital?.id === hospital.id ? (
              <HospitalEditForm
                hospital={hospital}
                onSave={(updated) => {
                  onUpdate(updated);
                  setEditingHospital(null);
                }}
                onCancel={() => setEditingHospital(null)}
              />
            ) : (
              <>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-ink">{hospital.name}</h3>
                      <Badge variant="live" className="text-xs">Live</Badge>
                    </div>
                    <p className="text-sm text-ink-muted">{hospital.address}</p>
                  </div>
                  <button
                    onClick={() => setEditingHospital(hospital)}
                    className="p-2 hover:bg-paper-hover rounded-sm text-ink-muted hover:text-ink"
                  >
                    <Edit size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-ink-muted">Beds</span>
                      <span className="text-sm font-medium text-ink">
                        {hospital.availableBeds}/{hospital.totalBeds}
                      </span>
                    </div>
                    <div className="h-2 bg-paper-border rounded-full overflow-hidden">
                      <div
                        className={`h-full ${statusColor} rounded-full transition-all`}
                        style={{ width: `${bedPercentage}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-ink-muted">ICU</span>
                      <span className="text-sm font-medium text-ink">{hospital.icuAvailable}</span>
                    </div>
                    <div className="h-2 bg-paper-border rounded-full overflow-hidden">
                      <div
                        className={`h-full ${hospital.icuAvailable > 5 ? 'bg-teal' : 'bg-amber'} rounded-full transition-all`}
                        style={{ width: `${Math.min((hospital.icuAvailable / 20) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-ink-muted">Trauma Bays</span>
                      <span className="text-sm font-medium text-ink">{hospital.traumaBays}</span>
                    </div>
                    <div className="h-2 bg-paper-border rounded-full overflow-hidden">
                      <div
                        className={`h-full ${hospital.traumaBays > 2 ? 'bg-teal' : 'bg-amber'} rounded-full transition-all`}
                        style={{ width: `${Math.min((hospital.traumaBays / 10) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-paper-border">
                  <div className="flex items-center gap-2 text-xs text-ink-muted">
                    <Clock size={12} />
                    Last updated: {new Date(hospital.lastUpdatedAt).toLocaleString()}
                  </div>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

function HospitalEditForm({
  hospital,
  onSave,
  onCancel,
}: {
  hospital: Hospital;
  onSave: (hospital: Hospital) => void;
  onCancel: () => void;
}) {
  const [availableBeds, setAvailableBeds] = useState(hospital.availableBeds);
  const [icuAvailable, setIcuAvailable] = useState(hospital.icuAvailable);
  const [traumaBays, setTraumaBays] = useState(hospital.traumaBays);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-ink mb-1">Available Beds</label>
        <input
          type="number"
          min="0"
          max={hospital.totalBeds}
          value={availableBeds}
          onChange={(e) => setAvailableBeds(parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-paper-border rounded-sm focus:outline-none focus:ring-2 focus:ring-teal"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-ink mb-1">ICU Available</label>
        <input
          type="number"
          min="0"
          max="20"
          value={icuAvailable}
          onChange={(e) => setIcuAvailable(parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-paper-border rounded-sm focus:outline-none focus:ring-2 focus:ring-teal"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-ink mb-1">Trauma Bays</label>
        <input
          type="number"
          min="0"
          max="10"
          value={traumaBays}
          onChange={(e) => setTraumaBays(parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-paper-border rounded-sm focus:outline-none focus:ring-2 focus:ring-teal"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onSave({
            ...hospital,
            availableBeds,
            icuAvailable,
            traumaBays,
            lastUpdatedAt: new Date().toISOString(),
          })}
          className="flex-1 px-4 py-2 bg-teal text-white rounded-sm hover:bg-teal-dark transition-colors"
        >
          Save Changes
        </button>
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-paper-border rounded-sm hover:bg-paper-hover transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function VolunteerManagement({
  volunteers,
  isLoading,
  refetch,
}: {
  volunteers: Volunteer[];
  isLoading: boolean;
  refetch: () => void;
}) {
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal"></div>
        <p className="text-ink-muted mt-2">Loading volunteers...</p>
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
            <th className="text-left py-3 px-4 text-sm font-medium text-ink">Location</th>
            <th className="text-center py-3 px-4 text-sm font-medium text-ink">Status</th>
            <th className="text-center py-3 px-4 text-sm font-medium text-ink">Actions</th>
          </tr>
        </thead>
        <tbody>
          {volunteers.map((volunteer) => (
            <tr key={volunteer.id} className="border-b border-paper-border hover:bg-paper-hover">
              <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-teal-light rounded-full flex items-center justify-center">
                    <span className="text-teal text-xs font-semibold">
                      {volunteer.fullName.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-ink">{volunteer.fullName}</div>
                    <div className="text-xs text-ink-muted">ID: {volunteer.id.slice(0, 8)}</div>
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
                  {volunteer.skills.slice(0, 3).map((skill) => (
                    <Badge key={skill} variant="info" className="text-xs capitalize">
                      {skill.replace('_', ' ')}
                    </Badge>
                  ))}
                  {volunteer.skills.length > 3 && (
                    <Badge variant="muted" className="text-xs">
                      +{volunteer.skills.length - 3}
                    </Badge>
                  )}
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="text-sm text-ink-muted">
                  {volunteer.postalDistrict || 'Unknown'}
                </div>
              </td>
              <td className="py-3 px-4 text-center">
                {volunteer.isAvailable ? (
                  <div className="flex items-center justify-center gap-1">
                    <CheckCircle size={16} className="text-teal" />
                    <Badge variant="success" className="text-xs">Available</Badge>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-1">
                    <AlertTriangle size={16} className="text-amber" />
                    <Badge variant="muted" className="text-xs">Offline</Badge>
                  </div>
                )}
              </td>
              <td className="py-3 px-4 text-center">
                <button className="p-2 hover:bg-paper-hover rounded-sm text-ink-muted hover:text-ink">
                  <Edit size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Clock({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}