"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X, Sparkles } from "lucide-react";

interface Toast {
  id: string;
  type?: "success" | "info" | "warning" | "error";
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (
    title: string,
    messageOrType?: string,
    type?: "success" | "info" | "warning" | "error",
    duration?: number
  ) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (
      title: string,
      messageOrType?: string,
      maybeType?: "success" | "info" | "warning" | "error",
      duration: number = 4000
    ) => {
      let message: string | undefined = messageOrType;
      let type: "success" | "info" | "warning" | "error" = maybeType || "success";

      if (
        messageOrType === "success" ||
        messageOrType === "info" ||
        messageOrType === "warning" ||
        messageOrType === "error"
      ) {
        type = messageOrType;
        message = undefined;
      }

      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newToast: Toast = { id, title, message, type, duration };

      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    },
    []
  );

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-6 right-6 z-[10000] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="pointer-events-auto w-full p-4 rounded-2xl bg-white border border-slate-200/90 shadow-[0_12px_32px_rgba(11,30,59,0.12)] flex items-start gap-3 relative overflow-hidden"
            >
              {/* Status Icon */}
              <div className="shrink-0 mt-0.5">
                {toast.type === "success" && (
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}
                {toast.type === "info" && (
                  <div className="w-8 h-8 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-200">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}
                {toast.type === "warning" && (
                  <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                )}
                {toast.type === "error" && (
                  <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* Text info */}
              <div className="flex-1 min-w-0 pr-2">
                <h4 className="text-xs font-bold text-[#0b1e3b] tracking-tight">{toast.title}</h4>
                {toast.message && (
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    {toast.message}
                  </p>
                )}
              </div>

              {/* Dismiss */}
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              {/* Progress Line */}
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 4, ease: "linear" }}
                className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-sky-500 to-emerald-500"
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
