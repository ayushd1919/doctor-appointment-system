'use client';
import { createContext, useContext, useMemo, useState, PropsWithChildren } from 'react';

export type Toast = { id: string; title: string; description?: string; variant?: 'default' | 'error' | 'success' };

type ToastCtxType = {
  toasts: Toast[];
  push: (t: Omit<Toast,'id'>) => void;
  remove: (id: string) => void;
};

const ToastCtx = createContext<ToastCtxType | null>(null);

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const api = useMemo<ToastCtxType>(() => ({
    toasts,
    push: (t) => setToasts(prev => [...prev, { id: Math.random().toString(36).slice(2), ...t }]),
    remove: (id) => setToasts(prev => prev.filter(x => x.id !== id)),
  }), [toasts]);

  return (
    <ToastCtx.Provider value={api}>
      {children}
      {/* viewport */}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {toasts.map(t => (
          <div key={t.id}
               className={`card px-4 py-3 min-w-[260px] ${t.variant==='error' ? 'border-red-300' : t.variant==='success' ? 'border-emerald-300' : ''}`}>
            <div className="text-sm font-semibold">{t.title}</div>
            {t.description && <div className="text-xs text-slate-600 mt-1">{t.description}</div>}
            <button className="text-xs mt-2 underline" onClick={() => api.remove(t.id)}>Close</button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider />');
  return ctx;
}
