import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';

// ---------- types ----------

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean; // 危险操作红色按钮
}

interface ConfirmContextValue {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue>({
  confirm: async () => false,
});

// ---------- Provider ----------

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{
    opts: ConfirmOptions;
    resolve: (v: boolean) => void;
  } | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({ opts, resolve });
    });
  }, []);

  const handleClose = (result: boolean) => {
    state?.resolve(result);
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state &&
        createPortal(
          <ConfirmDialogModal opts={state.opts} onClose={handleClose} />,
          document.body
        )}
    </ConfirmContext.Provider>
  );
}

// ---------- Hook ----------

export function useConfirm() {
  return useContext(ConfirmContext).confirm;
}

// ---------- Modal ----------

function ConfirmDialogModal({
  opts,
  onClose,
}: {
  opts: ConfirmOptions;
  onClose: (result: boolean) => void;
}) {
  const {
    title,
    message,
    confirmText = '确定',
    cancelText = '取消',
    danger = false,
  } = opts;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 rounded-2xl bg-white shadow-2xl animate-in zoom-in">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-2">
          <div className="flex items-center gap-3">
            {danger && (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            )}
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <button
            onClick={() => onClose(false)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        {message && (
          <p className="px-6 py-2 text-sm text-gray-500 leading-relaxed">{message}</p>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 pb-6 pt-4">
          <button
            onClick={() => onClose(false)}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => onClose(true)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors ${
              danger
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-300'
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-300'
            } focus:outline-none focus:ring-2 focus:ring-offset-1`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
