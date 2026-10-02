import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { AlertTriangle, HelpCircle, X } from 'lucide-react';

export function Modal({ title, onClose, children, wide, spacious }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean; spacious?: boolean }) {
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className={`bg-white rounded-xl shadow-2xl w-full ${wide ? 'max-w-4xl' : spacious ? 'max-w-lg' : 'max-w-md'} max-h-[90vh] flex flex-col overflow-hidden`} onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X size={22} /></button>
        </div>
        <div className="overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// Janela de confirmação usada antes de excluir/cancelar.
// danger (padrão): ação destrutiva em vermelho; danger={false}: confirmação neutra no azul do sistema.
export function ConfirmModal({ title = 'Confirmação', message, confirmLabel = 'Sim', cancelLabel = 'Não', danger = true, onConfirm, onCancel }: {
  title?: string; message: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean; onConfirm: () => void; onCancel: () => void;
}) {
  // Esc fecha a janela, como o botão de cancelar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const Icone = danger ? AlertTriangle : HelpCircle;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in" onClick={onCancel}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-titulo" aria-describedby="confirm-mensagem"
        className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl ring-1 ring-slate-900/5 animate-modal-in" onClick={e => e.stopPropagation()}>
        <button type="button" onClick={onCancel} title="Fechar"
          className="absolute right-3 top-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition">
          <X size={18} />
        </button>

        <div className="px-6 pt-8 pb-6 text-center">
          <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center ring-8 ${danger ? 'bg-red-100 text-red-600 ring-red-50' : 'bg-sky-100 text-sky-700 ring-sky-50'}`}>
            <Icone size={26} strokeWidth={2.2} />
          </div>
          <h2 id="confirm-titulo" className="mt-5 text-lg font-bold text-slate-900">{title}</h2>
          <p id="confirm-mensagem" className="mt-2 text-sm leading-relaxed text-slate-500">{message}</p>
        </div>

        <div className="px-6 pb-6 grid grid-cols-2 gap-3">
          <button type="button" autoFocus onClick={onCancel}
            className="h-11 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-200 transition">
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm}
            className={`h-11 rounded-xl font-semibold text-white shadow-sm active:scale-[0.98] focus:outline-none focus-visible:ring-4 transition ${danger ? 'bg-red-600 hover:bg-red-700 shadow-red-600/25 focus-visible:ring-red-200' : 'bg-[#0a2540] hover:bg-[#06182c] shadow-slate-900/20 focus-visible:ring-sky-200'}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
