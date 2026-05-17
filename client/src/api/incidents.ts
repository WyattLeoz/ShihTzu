import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';
import { Incident, IncidentListItem, IncidentUpdate, IncidentType, IncidentStatus } from '../types';

export function useIncidents(params?: {
  status?: IncidentStatus;
  type?: IncidentType;
  severity?: number;
  q?: string;
  sortBy?: 'created_at' | 'severity' | 'ai_score';
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ['incidents', params],
    queryFn: () =>
      apiClient.get<{
        incidents: IncidentListItem[];
        total: number;
        limit: number;
        offset: number;
      }>('/incidents', { params }),
    staleTime: 30000,
  });
}

export function useIncident(id: string) {
  return useQuery({
    queryKey: ['incident', id],
    queryFn: () =>
      apiClient.get<{
        incident: Incident;
        timeline: IncidentUpdate[];
      }>(`/incidents/${id}`),
    staleTime: 0,
    enabled: !!id,
  });
}

export function useCreateIncident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      type: IncidentType;
      title: string;
      description: string;
      locationText: string;
      locationLat?: number;
      locationLng?: number;
      severity?: number;
    }) => apiClient.post<{ message: string; ticketNumber: string }>('/incidents', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
  });
}

export function useUpdateIncident(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Incident>) =>
      apiClient.patch<{ message: string }>(`/incidents/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incident', id] });
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
  });
}

export function useApproveIncident(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (option: number) =>
      apiClient.patch<{ message: string }>(`/incidents/${id}/approve`, { option }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incident', id] });
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
  });
}

export function useUpdateIncidentStatus(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (status: IncidentStatus) =>
      apiClient.patch<{ message: string; status: string }>(`/incidents/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incident', id] });
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
  });
}

export function useAddIncidentUpdate(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) =>
      apiClient.post<IncidentUpdate>(`/tickets/${id}/updates`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incident', id] });
    },
  });
}