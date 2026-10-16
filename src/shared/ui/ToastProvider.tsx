"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

type ToastType = "success" | "error";

type ToastItem = {
  id: string;
  type: ToastType;
  message: string;
};

type ToastContextValue = {
  showToast: (options: { type: ToastType; message: string }) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast doit être utilisé dans ToastProvider.");
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, message }: { type: ToastType; message: string }) => {
      const id = crypto.randomUUID();
      setToasts((current) => [...current, { id, type, message }]);
      window.setTimeout(() => dismiss(id), 4500);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="toast toast-top toast-end z-[100] w-full max-w-sm p-4 pointer-events-none"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`alert shadow-lg pointer-events-auto toast-enter ${
              toast.type === "success" ? "alert-success" : "alert-error"
            }`}
            role="status"
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden="true" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              type="button"
              className="btn btn-ghost btn-xs btn-square"
              onClick={() => dismiss(toast.id)}
              aria-label="Fermer la notification"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
