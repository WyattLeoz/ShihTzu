import React from 'react';

export function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div
      className={`
        ${sizes[size]} border-primary/30 border-t-primary rounded-full animate-spin
        ${className}
      `}
    />
  );
}

export function LoadingState({ message = 'Loading...', className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center p-12 ${className}`}>
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-text-muted">{message}</p>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title = 'No items found',
  description = 'There are no items to display at the moment.',
  action,
  className = ''
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center ${className}`}>
      {Icon && (
        <Icon className="w-16 h-16 text-text-muted mb-4" />
      )}
      <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-text-muted mb-6 max-w-md">{description}</p>
      {action}
    </div>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'An error occurred while loading the data. Please try again.',
  onRetry,
  className = ''
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center ${className}`}>
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-[#E24B4A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-text-muted mb-6 max-w-md">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white font-medium rounded-card transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function SuccessState({
  icon: Icon,
  title = 'Success!',
  message = 'Your action was completed successfully.',
  action,
  className = ''
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center ${className}`}>
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
        {Icon ? (
          <Icon className="w-8 h-8 text-green-600" />
        ) : (
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-text-muted mb-6 max-w-md">{message}</p>
      {action}
    </div>
  );
}