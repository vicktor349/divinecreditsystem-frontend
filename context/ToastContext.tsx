import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { MdCheckCircle, MdError, MdInfo, MdClose } from 'react-icons/md';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const iconMap = {
  success: { icon: MdCheckCircle, bg: 'bg-green-50 border-green-200', text: 'text-green-800', iconColor: 'text-green-500' },
  error:   { icon: MdError,        bg: 'bg-red-50 border-red-200',     text: 'text-red-800',   iconColor: 'text-red-500'   },
  info:    { icon: MdInfo,         bg: 'bg-blue-50 border-blue-200',   text: 'text-blue-800',  iconColor: 'text-blue-500'  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const dismiss = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast, i) => {
          const s = iconMap[toast.type];
          const Icon = s.icon;
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg max-w-sm animate-slide-right ${s.bg}`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <Icon size={20} className={`flex-shrink-0 mt-0.5 ${s.iconColor}`} />
              <p className={`text-sm font-medium flex-1 ${s.text}`}>{toast.message}</p>
              <button
                onClick={() => dismiss(toast.id)}
                className={`flex-shrink-0 ${s.iconColor} opacity-60 hover:opacity-100 transition-opacity`}
              >
                <MdClose size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
