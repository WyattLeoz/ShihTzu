import { HTMLAttributes } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

const variants = {
  default: 'bg-ink-muted text-white',
  success: 'bg-teal text-white',
  warning: 'bg-amber text-white',
  danger: 'bg-red text-white',
  info: 'bg-navy-mid text-white',
};

export function Badge({ variant = 'default', className = '', children, ...props }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center px-2 py-0.5
        text-xs font-medium
        ${variants[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </span>
  );
}