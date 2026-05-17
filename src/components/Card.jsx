import React from 'react';

export function Card({ children, className = '', elevated = false, ...props }) {
  const shadowClass = elevated ? 'card-shadow-elevated' : 'card-shadow';
  return (
    <div className={`bg-white rounded-card p-6 ${shadowClass} ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return <div className={`mb-4 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }) {
  return <h3 className={`text-lg font-semibold text-text-primary ${className}`}>{children}</h3>;
}

export function CardContent({ children, className = '' }) {
  return <div className={className}>{children}</div>;
}