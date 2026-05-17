import React from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Bell, Search, MapPin, Upload, Download } from 'lucide-react';

const buttonVariants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  danger: 'btn-danger',
  ghost: 'btn-ghost',
  'primary-outline': 'bg-transparent border-2 border-primary text-primary hover:bg-primary/5 font-medium px-6 py-2.5 rounded-card transition-colors duration-200',
  'danger-outline': 'bg-transparent border-2 border-[#E24B4A] text-[#E24B4A] hover:bg-red-50 font-medium px-6 py-2.5 rounded-card transition-colors duration-200',
  pill: 'bg-primary hover:bg-primary-dark text-white font-medium px-6 py-3 rounded-pill transition-colors duration-200',
  'pill-outline': 'bg-transparent border-2 border-primary text-primary hover:bg-primary/5 font-medium px-6 py-3 rounded-pill transition-colors duration-200',
};

const buttonSizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-6 py-2.5',
  lg: 'px-8 py-3 text-lg',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  ...props
}) {
  const baseClass = 'inline-flex items-center justify-center gap-2 font-medium rounded-card transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  const variantClass = buttonVariants[variant] || buttonVariants.primary;
  const sizeClass = buttonSizes[size] || '';

  return (
    <button
      className={`${baseClass} ${variantClass} ${sizeClass} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      )}
      {Icon && iconPosition === 'left' && !loading && <Icon className="w-4 h-4" />}
      {children}
      {Icon && iconPosition === 'right' && !loading && <Icon className="w-4 h-4" />}
    </button>
  );
}

// Pre-configured button components for common use cases
export function BackButton({ to, onClick, className = '' }) {
  return (
    <Button
      variant="ghost"
      icon={ChevronLeft}
      className={className}
      onClick={onClick}
    >
      Back
    </Button>
  );
}

export function FABButton({ onClick, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`fixed bottom-6 right-6 bg-primary hover:bg-primary-dark text-white
        w-16 h-16 rounded-pill shadow-lg flex items-center justify-center
        transition-all duration-200 hover:scale-110 ${className}`}
    >
      <Plus className="w-6 h-6" />
    </button>
  );
}

export function IconButton({ icon: Icon, onClick, variant = 'ghost', className = '', ...props }) {
  const variantClass = buttonVariants[variant] || buttonVariants.ghost;

  return (
    <button
      onClick={onClick}
      className={`p-2 rounded-lg ${variantClass} ${className}`}
      {...props}
    >
      <Icon className="w-5 h-5" />
    </button>
  );
}

export function CloseButton({ onClick, className = '' }) {
  return (
    <IconButton
      icon={X}
      onClick={onClick}
      className={className}
    />
  );
}

export function NotificationButton({ count = 0, onClick, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`relative p-2 rounded-lg hover:bg-gray-100 transition-colors ${className}`}
    >
      <Bell className="w-5 h-5" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-[#E24B4A] text-white text-xs
          w-5 h-5 rounded-full flex items-center justify-center">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  );
}

export function SearchButton({ onClick, className = '' }) {
  return (
    <IconButton
      icon={Search}
      onClick={onClick}
      className={className}
    />
  );
}

export function LocationButton({ onClick, className = '' }) {
  return (
    <IconButton
      icon={MapPin}
      onClick={onClick}
      className={className}
    />
  );
}

export function UploadButton({ children, onChange, className = '', accept = 'image/*' }) {
  return (
    <label className={`inline-block ${className}`}>
      <input
        type="file"
        accept={accept}
        onChange={onChange}
        className="hidden"
      />
      <Button variant="secondary" icon={Upload}>
        {children || 'Upload'}
      </Button>
    </label>
  );
}

export function DownloadButton({ onClick, className = '' }) {
  return (
    <Button variant="secondary" icon={Download} onClick={onClick} className={className}>
      Export PDF
    </Button>
  );
}