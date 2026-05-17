import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  type: ToastType;
  message: string;
  onClose: () => void;
}

const icons = {
  success: <CheckCircle size={18} className="text-teal" />,
  error: <AlertCircle size={18} className="text-red" />,
  info: <Info size={18} className="text-navy-mid" />,
};

const bgColors = {
  success: 'bg-teal-light',
  error: 'bg-red-light',
  info: 'bg-navy-light',
};

export function Toast({ type, message, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`
            fixed top-4 right-4 z-50
            flex items-center gap-3 px-4 py-3
            border border-paper-border rounded-sm
            ${bgColors[type]}
          `}
        >
          {icons[type]}
          <span className="text-sm text-ink">{message}</span>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className="text-ink-muted hover:text-ink"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Simple toast manager
let toastId = 0;
const toasts: Map<number, { type: ToastType; message: string }> = new Map();
const listeners: Set<() => void> = new Set();

export function showToast(type: ToastType, message: string) {
  const id = ++toastId;
  toasts.set(id, { type, message });
  listeners.forEach(l => l());

  setTimeout(() => {
    toasts.delete(id);
    listeners.forEach(l => l());
  }, 5500);
}

export function useToasts() {
  const [, setUpdate] = useState(0);

  useEffect(() => {
    const listener = () => setUpdate(prev => prev + 1);
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);

  const removeToast = (id: number) => {
    toasts.delete(id);
    listeners.forEach(l => l());
  };

  return {
    toasts: Array.from(toasts.entries()).map(([id, toast]) => ({
      id,
      ...toast,
      onClose: () => removeToast(id),
    })),
  };
}