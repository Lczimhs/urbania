import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';

type ToastType = 'success' | 'error';
type Toast = { id: number; type: ToastType; message: string };

const ToastContext = createContext<(type: ToastType, message: string) => void>(() => {});

// Alerta flutuante de sucesso/erro exibido após salvar/excluir.
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = (id: number) => setToasts(t => t.filter(x => x.id !== id));

  const show = useCallback((type: ToastType, message: string) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, type, message }]);
    setTimeout(() => dismiss(id), 4500);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm">
        {toasts.map(t => (
          <div key={t.id} role="status" className={`flex items-start gap-3 p-4 rounded-xl shadow-lg border bg-white ${t.type === 'success' ? 'border-emerald-200' : 'border-red-200'}`}>
            {t.type === 'success' ? <CheckCircle2 className="text-emerald-600 shrink-0" size={20} /> : <XCircle className="text-red-600 shrink-0" size={20} />}
            <p className="text-sm text-slate-700 flex-1">{t.message}</p>
            <button onClick={() => dismiss(t.id)} className="text-slate-400 hover:text-slate-700"><X size={16} /></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const show = useContext(ToastContext);
  return {
    success: (message: string) => show('success', message),
    error: (message: string) => show('error', message),
  };
};

// Extrai a mensagem de erro devolvida pela API (ex.: exclusão bloqueada por vínculos)
export const apiError = (err: any, fallback: string) => err?.response?.data?.error || fallback;
