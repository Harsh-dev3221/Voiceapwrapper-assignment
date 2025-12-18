import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
}

interface ToastContextType {
    showToast: (type: ToastType, title: string, message?: string) => void;
    showError: (error: any) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context;
};

const toastConfig: Record<ToastType, { icon: any; bg: string; border: string }> = {
    success: { icon: CheckCircle, bg: 'bg-green-50', border: 'border-green-500' },
    error: { icon: AlertCircle, bg: 'bg-red-50', border: 'border-red-500' },
    warning: { icon: AlertTriangle, bg: 'bg-yellow-50', border: 'border-yellow-500' },
    info: { icon: Info, bg: 'bg-blue-50', border: 'border-blue-500' },
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const showToast = useCallback((type: ToastType, title: string, message?: string) => {
        const id = `${Date.now()}-${Math.random()}`;
        setToasts(prev => [...prev, { id, type, title, message }]);

        // Auto-remove after 5s
        setTimeout(() => removeToast(id), 5000);
    }, [removeToast]);

    const showError = useCallback((error: any) => {
        let title = 'Something went wrong';
        let message = '';

        if (error?.graphQLErrors?.length > 0) {
            const gqlError = error.graphQLErrors[0];
            title = 'Error';
            message = gqlError.message;

            // Friendly messages for common errors
            if (message.includes('Only owners can')) {
                title = 'Permission Denied';
                message = 'You need to be an organization owner to perform this action.';
            } else if (message.includes("don't have access")) {
                title = 'Access Denied';
                message = 'You do not have permission to access this resource.';
            } else if (message.includes('Not authenticated')) {
                title = 'Session Expired';
                message = 'Please log in again to continue.';
            }
        } else if (error?.networkError) {
            title = 'Connection Failed';
            message = 'Unable to connect to server. Please check your internet connection.';
        } else if (typeof error === 'string') {
            message = error;
        } else if (error?.message) {
            message = error.message;
        }

        showToast('error', title, message);
    }, [showToast]);

    return (
        <ToastContext.Provider value={{ showToast, showError }}>
            {children}

            {/* Toast Container */}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md">
                {toasts.map(toast => {
                    const config = toastConfig[toast.type];
                    const Icon = config.icon;

                    return (
                        <div
                            key={toast.id}
                            className={`${config.bg} border-2 ${config.border} p-4 shadow-brutal flex gap-3 animate-slide-up`}
                        >
                            <Icon size={20} className="flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <p className="font-display font-bold text-sm uppercase">{toast.title}</p>
                                {toast.message && (
                                    <p className="text-sm text-gray-600 mt-1">{toast.message}</p>
                                )}
                            </div>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="flex-shrink-0 hover:opacity-70"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
};
