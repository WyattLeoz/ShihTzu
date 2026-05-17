import React from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const badgeVariants = {
  high: 'bg-[#E24B4A] text-white',
  medium: 'bg-[#EF9F27] text-white',
  low: 'bg-[#1D9E75] text-white',
  neutral: 'bg-gray-200 text-text-primary',
  success: 'bg-green-500 text-white',
  warning: 'bg-amber-500 text-white',
  info: 'bg-blue-500 text-white',
};

const statusVariants = {
  open: 'bg-red-100 text-red-800',
  dispatched: 'bg-amber-100 text-amber-800',
  resolved: 'bg-green-100 text-green-800',
};

export function Badge({ children, variant = 'neutral', status, className = '' }) {
  const variantClass = status ? statusVariants[status] : badgeVariants[variant];

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${variantClass} ${className}`}>
      {children}
    </span>
  );
}

export function SeverityBadge({ severity, className = '' }) {
  const variants = {
    3: { class: 'bg-[#E24B4A] text-white', label: 'HIGH' },
    2: { class: 'bg-[#EF9F27] text-white', label: 'MEDIUM' },
    1: { class: 'bg-[#1D9E75] text-white', label: 'LOW' },
  };

  const variant = variants[severity] || variants[1];

  return (
    <Badge variant="neutral" className={`${variant.class} ${className}`}>
      {variant.label}
    </Badge>
  );
}

// Toast Notification System
let toastListeners = [];
let toastId = 0;

export function useToast() {
  return (message, type = 'info', duration = 3000) => {
    const id = ++toastId;
    const toast = { id, message, type, duration };

    toastListeners.forEach(listener => listener(toast));

    setTimeout(() => {
      removeToast(id);
    }, duration);
  };
}

export function addToastListener(listener) {
  toastListeners.push(listener);
  return () => {
    toastListeners = toastListeners.filter(l => l !== listener);
  };
}

function removeToast(id) {
  toastListeners.forEach(listener => listener({ id, type: 'remove' }));
}

export function ToastContainer({ toasts, onRemove }) {
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
  };

  const typeStyles = {
    success: 'bg-green-500',
    error: 'bg-[#E24B4A]',
    info: 'bg-[#042C53]',
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => {
        if (toast.type === 'remove') return null;
        const Icon = icons[toast.type] || icons.info;

        return (
          <div
            key={toast.id}
            className={`${typeStyles[toast.type]} text-white px-6 py-4 rounded-card shadow-lg
              flex items-center gap-3 animate-slide-in`}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => onRemove(toast.id)}
              className="hover:bg-white/20 rounded-full p-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}