import { twMerge } from 'tailwind-merge';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    className?: string;
}

export const Modal = ({ isOpen, onClose, title, children, className }: ModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div
                className={twMerge(
                    "relative bg-white border-4 border-brand-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden flex flex-col",
                    className
                )}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b-4 border-brand-black bg-brand-yellow">
                    <h2 className="text-2xl font-display font-black uppercase tracking-tight">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 bg-white border-2 border-brand-black hover:bg-red-100 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none"
                    >
                        <X size={20} strokeWidth={3} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1">
                    {children}
                </div>
            </div>
        </div>
    );
};
