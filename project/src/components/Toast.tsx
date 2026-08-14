import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { cn } from '@/lib/utils';

export function ToastContainer() {
  const { toasts, removeToast } = useStore();

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'animate-slide-in-right flex items-center gap-3 rounded-lg border bg-white px-4 py-3 shadow-lg min-w-[280px] max-w-sm',
            toast.type === 'success' && 'border-green-200',
            toast.type === 'error' && 'border-red-200',
            toast.type === 'info' && 'border-blue-200'
          )}
        >
          {toast.type === 'success' && <CheckCircle2 size={20} className="text-green-500 shrink-0" />}
          {toast.type === 'error' && <XCircle size={20} className="text-red-500 shrink-0" />}
          {toast.type === 'info' && <Info size={20} className="text-blue-500 shrink-0" />}
          <p className="flex-1 text-sm font-medium text-ink-900">{toast.message}</p>
          <button onClick={() => removeToast(toast.id)} className="text-ink-400 hover:text-ink-600">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
