import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';
import { Hospital, Volunteer, VolunteerSkill } from '../types';

export function useHospitals() {
  return useQuery({
    queryKey: ['hospitals'],
    queryFn: () => apiClient.get<{ hospitals: Hospital[] }>('/resources/hospitals'),
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

export function useVolunteers(params?: { skill?: VolunteerSkill; available?: boolean }) {
  return useQuery({
    queryKey: ['volunteers', params],
    queryFn: () =>
      apiClient.get<{ volunteers: Volunteer[] }>('/resources/volunteers', { params }),
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