import React, { useState } from 'react';

export function Tabs({ defaultValue, children, className = '' }) {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <div className={className}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            activeTab,
            onTabChange: setActiveTab,
          });
        }
        return child;
      })}
    </div>
  );
}

export function TabsList({ children, activeTab, onTabChange, className = '' }) {
  return (
    <div className={`flex gap-4 border-b border-border ${className}`}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            isActive: child.props.value === activeTab,
            onClick: () => onTabChange(child.props.value),
          });
        }
        return child;
      })}
    </div>
  );
}

export function TabsTrigger({ value, children, isActive, onClick, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium transition-colors relative
        ${isActive ? 'text-primary' : 'text-text-muted hover:text-text-primary'}
        ${className}`}
    >
      {children}
      {isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
      )}
    </button>
  );
}

export function TabsContent({ value, activeTab, children, className = '' }) {
  if (value !== activeTab) return null;

  return (
    <div className={`mt-4 ${className}`}>
      {children}
    </div>
  );
}