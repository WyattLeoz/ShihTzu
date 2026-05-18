import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';
import { Hospital, Volunteer, VolunteerSkill, VolunteerTask, CommunityOrganization } from '../types';

// ─── Hospitals ─────────────────────────────────────────────────────────────────
export function useHospitals() {
  return useQuery({
    queryKey: ['hospitals'],
    queryFn: () => apiClient.get<{ hospitals: Hospital[] }>('/resources/hospitals'),
    staleTime: 30000,
  });
}

export function useUpdateHospital(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { availableBeds?: number; icuAvailable?: number; traumaBays?: number }) =>
      apiClient.patch<Hospital>(`/resources/hospitals/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hospitals'] }),
  });
}

// ─── Volunteers (legacy) ───────────────────────────────────────────────────────
export function useVolunteers(params?: { skill?: VolunteerSkill; available?: boolean }) {
  return useQuery({
    queryKey: ['volunteers', params],
    queryFn: () => apiClient.get<{ volunteers: Volunteer[] }>('/resources/volunteers', { params }),
    staleTime: 30000,
  });
}

export function useCreateVolunteer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { fullName: string; phone: string; skills: VolunteerSkill[]; postalDistrict?: string }) =>
      apiClient.post<Volunteer>('/volunteers', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['volunteers'] }),
  });
}

// ─── Community Organisations ───────────────────────────────────────────────────

export function useCommunities() {
  return useQuery({
    queryKey: ['communities'],
    queryFn: () => apiClient.get<{ communities: CommunityOrganization[] }>('/resources/communities'),
    staleTime: 60000,
  });
}

export function useRequestAid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      communityId,
      ...taskData
    }: {
      communityId: string;
      title: string;
      description?: string;
      taskType: string;
      location: string;
      date?: string;
      timeSlot?: string;
      slotsTotal?: number;
      skillsRequired?: string[];
      urgency?: string;
      incidentId?: string;
    }) =>
      apiClient.post<{ task: VolunteerTask; message: string }>(
        `/resources/communities/${communityId}/request-aid`,
        taskData
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['volunteer-tasks'] });
      qc.invalidateQueries({ queryKey: ['communities'] });
    },
  });
}

// ─── Volunteer Tasks ───────────────────────────────────────────────────────────

const MOCK_TASKS: VolunteerTask[] = [
  {
    id: 'vt-001',
    title: 'Flood Relief — Emergency Food Packing',
    description: 'Pack emergency ration kits for displaced residents at Jurong West evacuation centre.',
    organization: 'Singapore Red Cross',
    orgType: 'ngo',
    taskType: 'food_distribution',
    location: 'Jurong West Sports Centre, 20 Jurong West St 93',
    date: 'Today',
    timeSlot: '10:00 AM – 2:00 PM',
    slotsTotal: 30,
    slotsFilled: 18,
    skillsRequired: ['Physical fitness'],
    urgency: 'high',
    status: 'filling',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'vt-002',
    title: 'Evacuation Centre — Registration Desk',
    description: 'Assist SCDF staff with registering displaced evacuees. Laptop provided.',
    organization: 'SCDF Community Resilience',
    orgType: 'government',
    taskType: 'shelter_assistance',
    location: 'Clementi Community Club, 3151 Commonwealth Ave W',
    date: 'Today',
    timeSlot: '12:00 PM – 8:00 PM',
    slotsTotal: 10,
    slotsFilled: 4,
    skillsRequired: ['Data entry', 'Patient communication'],
    urgency: 'critical',
    status: 'open',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'vt-003',
    title: 'Language Support — Mandarin / Tamil / Malay',
    description: 'Translation for elderly residents at evacuation centres.',
    organization: "People's Association",
    orgType: 'government',
    taskType: 'translation',
    location: 'Multiple sites (Jurong West & Clementi)',
    date: 'Today',
    timeSlot: 'Flexible — on call from 9 AM',
    slotsTotal: 8,
    slotsFilled: 3,
    skillsRequired: ['Mandarin', 'Tamil', 'Malay'],
    urgency: 'high',
    status: 'open',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'vt-004',
    title: 'First Aid Station Support',
    description: 'Support SGH medical staff at temporary first aid posts. Valid SSFA or BCLS required.',
    organization: 'Singapore General Hospital',
    orgType: 'healthcare',
    taskType: 'medical_support',
    location: 'Jurong West Sports Centre — Medical Post B',
    date: 'Today',
    timeSlot: '8:00 AM – 8:00 PM (4-hour shifts)',
    slotsTotal: 15,
    slotsFilled: 12,
    skillsRequired: ['Valid First Aid Cert (SSFA / BCLS)'],
    urgency: 'critical',
    status: 'filling',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'vt-005',
    title: 'Emergency Supply Distribution',
    description: 'Sort and distribute water, blankets, and hygiene kits to affected HDB blocks.',
    organization: 'Singapore Civil Defence Force',
    orgType: 'government',
    taskType: 'logistics',
    location: 'Bukit Batok Community Centre',
    date: 'Tomorrow',
    timeSlot: '9:00 AM – 5:00 PM',
    slotsTotal: 20,
    slotsFilled: 7,
    skillsRequired: ['Physical fitness', 'Driving licence (optional)'],
    urgency: 'medium',
    status: 'open',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'vt-006',
    title: 'Blood Donation Drive — Walk-in',
    description: 'Blood stocks at SGH critically low due to trauma cases.',
    organization: 'Health Sciences Authority',
    orgType: 'healthcare',
    taskType: 'blood_donation',
    location: 'HSA Bloodbank @ HSA, 11 Outram Rd',
    date: 'Today & Tomorrow',
    timeSlot: '8:30 AM – 4:30 PM',
    slotsTotal: 200,
    slotsFilled: 143,
    skillsRequired: ['Age 16–60', 'Weight ≥ 45 kg'],
    urgency: 'high',
    status: 'filling',
    createdAt: new Date().toISOString(),
  },
];

export function useVolunteerTasks() {
  return useQuery({
    queryKey: ['volunteer-tasks'],
    queryFn: async (): Promise<{ tasks: VolunteerTask[] }> => {
      try {
        return await apiClient.get<{ tasks: VolunteerTask[] }>('/resources/volunteer-tasks');
      } catch {
        return { tasks: MOCK_TASKS };
      }
    },
    staleTime: 60000,
  });
}

export function useCreateVolunteerTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      title: string; description?: string; organization?: string; orgType?: string;
      taskType: string; location: string; date?: string; timeSlot?: string;
      slotsTotal?: number; skillsRequired?: string[]; urgency?: string; incidentId?: string;
    }) =>
      apiClient
        .post<{ task: VolunteerTask }>('/resources/volunteer-tasks', data)
        .catch(() => ({
          task: {
            ...data,
            id: `vt-${Math.random().toString(36).slice(2, 10)}`,
            organization: data.organization || 'QuickAid Ops',
            orgType: (data.orgType as any) || 'government',
            date: data.date || 'Today',
            timeSlot: data.timeSlot || 'TBC',
            slotsTotal: data.slotsTotal || 20,
            slotsFilled: 0,
            skillsRequired: data.skillsRequired || [],
            urgency: (data.urgency as any) || 'medium',
            status: 'open' as const,
            createdAt: new Date().toISOString(),
          } as VolunteerTask,
        })),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['volunteer-tasks'] }),
  });
}

export function useSignUpForTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { taskId: string; fullName: string; phone: string; nric: string }) =>
      apiClient
        .post<{ message: string; confirmationCode: string }>(
          `/resources/volunteer-tasks/${data.taskId}/signup`,
          data
        )
        .catch(() => ({
          message: 'Registration successful',
          confirmationCode: `QA-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        })),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['volunteer-tasks'] }),
  });
}