import { twMerge } from 'tailwind-merge';

interface ScriptBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    children: React.ReactNode;
}

export const ScriptBadge = ({ children, className, ...props }: ScriptBadgeProps) => {
    return (
        <span
            className={twMerge(
                'inline-block font-script text-xl px-4 py-1 bg-yellow-300 border-2 border-brand-black rotate-[-2deg] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
                className
            )}
            {...props}
        >
            {children}
        </span>
    );
};
