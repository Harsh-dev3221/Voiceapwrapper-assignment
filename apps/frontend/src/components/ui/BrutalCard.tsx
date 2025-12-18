import { twMerge } from 'tailwind-merge';

interface BrutalCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

export const BrutalCard = ({ children, className, ...props }: BrutalCardProps) => {
    return (
        <div
            className={twMerge(
                'brutal-card',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};
