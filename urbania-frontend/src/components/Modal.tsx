import type { ReactNode } from 'react';
import { AlertTriangle, X } from 'lucide-react';

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

// Janela de confirmação usada antes de excluir/cancelar
export function ConfirmModal({ title = 'Confirmação', message, confirmLabel = 'Sim', cancelLabel = 'Não', danger = true, onConfirm, onCancel }: {
  title?: string; message: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <Modal title={title} onClose={onCancel}>
      <div className="p-6 flex gap-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${danger ? 'bg-red-100 text-red-600' : 'bg-sky-100 text-sky-600'}`}>
          <AlertTriangle size={20} />
        </div>
        <p className="text-slate-700 pt-2">{message}</p>
      </div>
      <div className="px-6 py-4 border-t flex justify-end gap-3 bg-slate-50">
        <button onClick={onCancel} className="px-4 py-2 border rounded-lg font-semibold text-slate-600 hover:bg-white">{cancelLabel}</button>
        <button onClick={onConfirm} className={`px-4 py-2 rounded-lg font-bold text-white ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-sky-600 hover:bg-sky-700'}`}>{confirmLabel}</button>
      </div>
    </Modal>
  );
}
