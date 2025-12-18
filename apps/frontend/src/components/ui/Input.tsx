import React from 'react';
import { twMerge } from 'tailwind-merge';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, ...props }, ref) => {
        return (
            <div className="flex flex-col gap-2">
                {label && (
                    <label className="font-display font-bold uppercase tracking-wider text-sm">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    className={twMerge(
                        'brutal-input',
                        className
                    )}
                    {...props}
                />
            </div>
        );
    }
);
