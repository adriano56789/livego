import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  isLoading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  fullWidth?: boolean;
}

export function Button({
  children,
  isLoading = false,
  variant = 'primary',
  fullWidth = true,
  className = '',
  disabled = false,
  ...props
}: ButtonProps) {
  const baseClasses = 'font-black py-4 rounded-2xl transition-all shadow-xl active:scale-95 disabled:opacity-50';
  const widthClass = fullWidth ? 'w-full' : '';
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-purple-900/30',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 shadow-gray-900/10',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-red-900/30',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${widthClass} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? 'PROCESSANDO...' : children}
    </button>
  );
}
