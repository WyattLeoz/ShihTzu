// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import apiClient from './client';
// import { Hospital, Volunteer, VolunteerSkill } from '../types';

// export function useHospitals() {
//   return useQuery({
//     queryKey: ['hospitals'],
//     queryFn: () => apiClient.get<{ hospitals: Hospital[] }>('/resources/hospitals'),
//     staleTime: 30000,
//   });
// }

// export function useUpdateHospital(id: string) {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: (data: {
//       availableBeds?: number;
//       icuAvailable?: number;
//       traumaBays?: number;
//     }) => apiClient.patch<Hospital>(`/resources/hospitals/${id}`, data),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['hospitals'] });
//     },
//   });
// }

// export function useVolunteers(params?: { skill?: VolunteerSkill; available?: boolean }) {
//   return useQuery({
//     queryKey: ['volunteers', params],
//     queryFn: () =>
//       apiClient.get<{ volunteers: Volunteer[] }>('/resources/volunteers', { params }),
//     staleTime: 30000,
//   });
// }

// export function useCreateVolunteer() {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: (data: {
//       fullName: string;
//       phone: string;
//       skills: VolunteerSkill[];
//       postalDistrict?: string;
//     }) => apiClient.post<Volunteer>('/volunteers', data),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['volunteers'] });
//     },
//   });
// }
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';
import { Hospital, Volunteer, VolunteerSkill, VolunteerTask } from '../types';

// ─── Hospitals ─────────────────────────────────────────────────────────────────
export function useHospitals() {
  return useQuery({
    queryKey: ['hospitals'],
    queryFn: () =>
      apiClient.get<{ hospitals: Hospital[] }>('/resources/hospitals'),
    staleTime: 30000,
  });
}

export function useUpdateHospital(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      availableBeds?: number;
      icuAvailable?: number;
      traumaBays?: number;
    }) => apiClient.patch<Hospital>(`/resources/hospitals/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospitals'] });
    },
  });
}

// ─── Volunteers ────────────────────────────────────────────────────────────────
export function useVolunteers(params?: {
  skill?: VolunteerSkill;
  available?: boolean;
}) {
  return useQuery({
    queryKey: ['volunteers', params],
    queryFn: () =>
      apiClient.get<{ volunteers: Volunteer[] }>('/resources/volunteers', {
        params,
      }),
    staleTime: 30000,
  });
}

export function useCreateVolunteer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      fullName: string;
      phone: string;
      skills: VolunteerSkill[];
      postalDistrict?: string;
    }) => apiClient.post<Volunteer>('/volunteers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteers'] });
    },
  });
}

// ─── Volunteer Task Board ─────────────────────────────────────────────────────
// Falls back to mock data until the backend endpoint is ready.
const MOCK_TASKS: VolunteerTask[] = [
  {
    id: 'vt-001',
    title: 'Flood Relief – Emergency Food Packing',
    description:
      'Pack emergency ration kits for displaced residents at Jurong West evacuation centre. No prior experience needed — supervisors will guide you.',
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
    title: 'Evacuation Centre – Registration Desk',
    description:
      'Assist SCDF staff with registering and tracking displaced evacuees. Laptop provided. Must be comfortable with basic data entry.',
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
    title: 'Language Support – Mandarin / Tamil / Malay',
    description:
      'Provide real-time translation for elderly residents who do not speak English at evacuation centres and first aid posts.',
    organization: "People's Association",
    orgType: 'government',
    taskType: 'translation',
    location: 'Multiple sites (Jurong West & Clementi)',
    date: 'Today',
    timeSlot: 'Flexible – on call from 9 AM',
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
    description:
      'Support SGH medical staff at temporary first aid posts. Valid first aid certification (SSFA or equivalent) is required.',
    organization: 'Singapore General Hospital',
    orgType: 'healthcare',
    taskType: 'medical_support',
    location: 'Jurong West Sports Centre – Medical Post B',
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
    description:
      'Help sort and distribute water, blankets, and hygiene kits to affected HDB blocks. Pair up in teams of two.',
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
    title: 'Blood Donation Drive – Walk-in',
    description:
      'Blood stocks at SGH are running low due to increased trauma cases. Walk-in donation session — all blood types needed urgently.',
    organization: 'Health Sciences Authority',
    orgType: 'healthcare',
    taskType: 'blood_donation',
    location: 'HSA Bloodbank @ HSA, 11 Outram Rd',
    date: 'Today & Tomorrow',
    timeSlot: '8:30 AM – 4:30 PM',
    slotsTotal: 200,
    slotsFilled: 143,
    skillsRequired: ['Age 16–60', 'Weight ≥ 45 kg', 'Good health'],
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
        return await apiClient.get<{ tasks: VolunteerTask[] }>(
          '/resources/volunteer-tasks'
        );
      } catch {
        // Endpoint not yet deployed — use mock data
        return { tasks: MOCK_TASKS };
      }
    },
    staleTime: 60000,
  });
}

export function useSignUpForTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      taskId: string;
      fullName: string;
      phone: string;
      nric: string;
    }) =>
      apiClient
        .post<{ message: string; confirmationCode: string }>(
          `/resources/volunteer-tasks/${data.taskId}/signup`,
          data
        )
        .catch(() => ({
          // Mock success when endpoint not ready
          message: 'Registration successful',
          confirmationCode: `QA-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteer-tasks'] });
    },
  });
}