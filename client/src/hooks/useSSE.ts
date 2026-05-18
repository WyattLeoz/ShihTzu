import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authStore } from '../stores/authStore';
import { SSEEvent } from '../types';
import { showToast } from '../components/Toast';

type ConnectionState = 'connecting' | 'connected' | 'disconnected';

export function useSSE() {
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [lastEvent, setLastEvent] = useState<SSEEvent | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const queryClient = useQueryClient();

  const connect = () => {
    const token = authStore.getState().accessToken;

    if (!token) {
      setConnectionState('disconnected');
      return;
    }

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const url = `${API_URL}/api/sse?token=${encodeURIComponent(token)}`;

    eventSourceRef.current = new EventSource(url);

    eventSourceRef.current.onopen = () => {
      setConnectionState('connected');
      reconnectAttemptsRef.current = 0;
    };

    eventSourceRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as SSEEvent;

        if (data.type === 'connected') {
          return; // Ignore connection confirmation
        }

        setLastEvent(data);

        // Update React Query cache based on event type
        if (data.type === 'incident_updated' && data.payload) {
          const incident = data.payload;
          queryClient.setQueryData(['incident', incident.id], { incident, timeline: [] });
          queryClient.invalidateQueries({ queryKey: ['incidents'] });

          // Show toast notification for significant status changes
          if (incident.status === 'dispatched') {
            showToast('info', `Incident ${incident.ticketNumber} assigned to responder`);
          } else if (incident.status === 'on_scene') {
            showToast('success', `Incident ${incident.ticketNumber}: responder on scene`);
          } else if (incident.status === 'resolved') {
            showToast('success', `Incident ${incident.ticketNumber} has been resolved`);
          }
        } else if (data.type === 'timeline_added' && data.payload) {
          const update = data.payload;
          queryClient.setQueriesData({ queryKey: ['incident', update.incident_id] }, (old: any) => {
            if (old) {
              return {
                ...old,
                timeline: [...old.timeline, {
                  ...update,
                  author: {
                    name: update.author_name,
                    role: update.author_role,
                  },
                }],
              };
            }
            return old;
          });
        } else if (data.type === 'broadcast_sent' && data.payload) {
          showToast('info', `New broadcast: ${data.payload.title}`);
        }
      } catch (error) {
        console.error('Error parsing SSE event:', error);
      }
    };

    eventSourceRef.current.onerror = () => {
      setConnectionState('disconnected');
      eventSourceRef.current?.close();

      // Exponential backoff reconnection
      const backoffMs = Math.min(30000, 1000 * Math.pow(2, reconnectAttemptsRef.current));
      reconnectAttemptsRef.current++;

      reconnectTimeoutRef.current = setTimeout(() => {
        setConnectionState('connecting');
        connect();
      }, backoffMs);
    };
  };

  useEffect(() => {
    connect();

    return () => {
      eventSourceRef.current?.close();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    connectionState,
    lastEvent,
  };
}