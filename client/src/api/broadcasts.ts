import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';
import { Broadcast, BroadcastAudience } from '../types';

export function useBroadcasts(params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['broadcasts', params],
    queryFn: () =>
      apiClient.get<{
        broadcasts: Broadcast[];
        total: number;
        limit: number;
        offset: number;
      }>('/broadcasts', { params }),
    staleTime: 30000,
  });
}

export function useCreateBroadcast() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      title: string;
      message: string;
      audience: BroadcastAudience;
      zone?: string;
      incidentId?: string;
    }) => apiClient.post<Broadcast>('/broadcasts', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broadcasts'] });
    },
  });
}