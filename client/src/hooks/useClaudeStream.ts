import { useState, useCallback } from 'react';
import { streamAITriage } from '../api/ai';
import { AIOption } from '../types';

type StreamState = 'idle' | 'streaming' | 'complete' | 'error';

export function useClaudeStream() {
  const [state, setState] = useState<StreamState>('idle');
  const [streamedText, setStreamedText] = useState('');
  const [options, setOptions] = useState<AIOption[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<{ abort: () => void } | null>(null);

  const trigger = useCallback(async (incidentId: string) => {
    setState('streaming');
    setStreamedText('');
    setOptions(null);
    setError(null);

    const stream = await streamAITriage(incidentId);

    stream.onText((text) => {
      setStreamedText(prev => prev + text);
    });

    stream.onComplete((options) => {
      setState('complete');
      setOptions(options);
    });

    stream.onError((error) => {
      setState('error');
      setError(error);
    });

    setAbortController({ abort: stream.abort });

    await stream.start();
  }, []);

  const reset = useCallback(() => {
    setState('idle');
    setStreamedText('');
    setOptions(null);
    setError(null);
    setAbortController(null);
  }, []);

  return {
    streamedText,
    isStreaming: state === 'streaming',
    isComplete: state === 'complete',
    isError: state === 'error',
    options,
    error,
    trigger,
    reset,
    abort: abortController?.abort,
  };
}