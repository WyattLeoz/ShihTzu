import { AIOption, AITextEvent, AICompleteEvent, AIErrorEvent } from '../types';

export async function streamAITriage(incidentId: string): Promise<{
  onText: (callback: (text: string) => void) => void;
  onComplete: (callback: (options: AIOption[]) => void) => void;
  onError: (callback: (error: string) => void) => void;
  start: () => void;
  abort: () => void;
}> {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const token = localStorage.getItem('quickaid-auth') ? JSON.parse(localStorage.getItem('quickaid-auth') || '{}').state?.accessToken : null;

  let abortController: AbortController | null = null;
  const textCallbacks: ((text: string) => void)[] = [];
  const completeCallbacks: ((options: AIOption[]) => void)[] = [];
  const errorCallbacks: ((error: string) => void)[] = [];

  const onText = (callback: (text: string) => void) => {
    textCallbacks.push(callback);
  };

  const onComplete = (callback: (options: AIOption[]) => void) => {
    completeCallbacks.push(callback);
  };

  const onError = (callback: (error: string) => void) => {
    errorCallbacks.push(callback);
  };

  const start = async () => {
    abortController = new AbortController();

    try {
      const response = await fetch(`${API_URL}/api/ai/triage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ incidentId }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to start AI triage');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            if (data === '[DONE]') {
              break;
            }

            try {
              const event = JSON.parse(data);

              if (event.type === 'text') {
                textCallbacks.forEach(cb => cb(event.content));
              } else if (event.type === 'complete') {
                completeCallbacks.forEach(cb => cb(event.options));
              } else if (event.type === 'error') {
                errorCallbacks.forEach(cb => cb(event.error));
              }
            } catch (e) {
              // Ignore parse errors for partial JSON
            }
          }
        }
      }
    } catch (error) {
      if ((error as any).name !== 'AbortError') {
        errorCallbacks.forEach(cb => cb((error as Error).message));
      }
    }
  };

  const abort = () => {
    abortController?.abort();
  };

  return { onText, onComplete, onError, start, abort };
}