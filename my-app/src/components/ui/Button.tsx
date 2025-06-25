

// Button Component
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  children,
  className,
  disabled,
  ...props
}) => {
  const baseStyles = `
    inline-flex items-center justify-center font-medium rounded-lg 
    focus:outline-none focus:ring-2 focus:ring-offset-2 
    transition-colors disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const sizeStyles = {
    small: 'px-3 py-1.5 text-xs',
    medium: 'px-4 py-2 text-sm',
    large: 'px-6 py-3 text-base',
  };

  const variantStyles = {
    primary: `
      text-white bg-blue-600 border border-transparent 
      hover:bg-blue-700 focus:ring-blue-500
    `,
    secondary: `
      text-gray-700 bg-white border border-gray-300 
      hover:bg-gray-50 focus:ring-blue-500
    `,
    destructive: `
      text-white bg-red-600 border border-transparent 
      hover:bg-red-700 focus:ring-red-500
    `,
    ghost: `
      text-gray-700 bg-transparent border border-transparent 
      hover:bg-gray-100 focus:ring-blue-500
    `,
  };

  return (
    <button
      type="button"
      className={`
        ${baseStyles}
        ${sizeStyles[size]}
        ${variantStyles[variant]}
        ${className || ''}
      `}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
