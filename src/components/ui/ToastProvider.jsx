import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);

const stylesByType = {
    success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
    error: 'border-rose-500/40 bg-rose-500/10 text-rose-300',
    info: 'border-vps-gold/40 bg-vps-gold/10 text-vps-gold',
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts((current) => current.filter((item) => item.id !== id));
    }, []);

    const pushToast = useCallback((message, type = 'info', duration = 2800) => {
        const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const toast = {
            id,
            message: String(message || '').trim(),
            type,
        };

        setToasts((current) => [...current, toast]);

        if (duration > 0) {
            window.setTimeout(() => removeToast(id), duration);
        }

        return id;
    }, [removeToast]);

    const value = useMemo(() => ({ pushToast, removeToast }), [pushToast, removeToast]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="pointer-events-none fixed right-4 top-4 z-[120] flex w-full max-w-sm flex-col gap-2">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto rounded-xl border px-4 py-3 text-sm shadow-xl backdrop-blur-sm ${stylesByType[toast.type] || stylesByType.info}`}
                        role="status"
                        aria-live="polite"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <p>{toast.message}</p>
                            <button
                                type="button"
                                onClick={() => removeToast(toast.id)}
                                className="text-xs opacity-70 transition-opacity hover:opacity-100"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};
