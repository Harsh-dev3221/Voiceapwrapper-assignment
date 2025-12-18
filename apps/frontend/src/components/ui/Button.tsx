import { twMerge } from 'tailwind-merge';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'outline';
}

export const Button = ({ children, className, variant = 'primary', ...props }: ButtonProps) => {
    const baseStyles = 'brutal-btn inline-flex items-center gap-2 justify-center cursor-pointer';

    const variants = {
        primary: 'bg-brand-yellow text-brand-black',
        secondary: 'bg-white text-brand-black',
        outline: 'bg-transparent border-2 border-brand-black shadow-none hover:bg-gray-100',
    };

    return (
        <button
            className={twMerge(
                baseStyles,
                variants[variant],
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
};
