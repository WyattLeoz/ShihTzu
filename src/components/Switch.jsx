import React from 'react';

export function Switch({ checked = false, onChange, disabled = false, className = '' }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200
        ${checked ? 'bg-primary' : 'bg-gray-300'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200
          ${checked ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
    </button>
  );
}

export function ToggleGroup({ children, value, onChange, className = '' }) {
  return (
    <div className={`flex gap-2 ${className}`}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            isActive: child.props.value === value,
            onClick: () => onChange(child.props.value),
          });
        }
        return child;
      })}
    </div>
  );
}

export function ToggleButton({ value, children, isActive, onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
        ${isActive
          ? 'bg-primary text-white'
          : 'bg-white border border-border text-text-primary hover:bg-gray-50'
        }
        ${className}
      `}
    >
      {children}
    </button>
  );
}