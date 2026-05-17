import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="mb-4 text-red">
        <AlertTriangle size={48} />
      </div>
      <h3 className="text-lg font-semibold text-ink mb-2">{title}</h3>
      {message && (
        <p className="text-sm text-ink-muted text-center mb-4">{message}</p>
      )}
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm">
          Try Again
        </Button>
      )}
    </div>
  );
}