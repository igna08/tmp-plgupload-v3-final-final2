import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'icon';
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
  const baseStyles = "font-semibold rounded-radiusMedium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 ease-in-out";

  const sizeStyles = {
    small: "px-3 py-1.5 text-xs", // Shopify typically uses 12-14px for small text
    medium: "px-4 py-2 text-sm", // Shopify typically uses 14-16px for base text
    large: "px-6 py-3 text-base", // Shopify typically uses 16-18px for large text
  };

  const variantStyles = {
    primary: `bg-shopifyGreen text-white hover:bg-green-700 active:scale-95 disabled:bg-neutralLight disabled:text-neutralTextSecondary focus:ring-shopifyGreen`,
    secondary: `bg-white text-shopifyGreen border border-shopifyGreen hover:bg-green-50 hover:text-green-700 active:scale-95 disabled:bg-white disabled:text-neutralMedium disabled:border-neutralMedium focus:ring-shopifyGreen`,
    destructive: `bg-accentRed text-white hover:bg-red-700 active:scale-95 disabled:bg-neutralLight disabled:text-neutralTextSecondary focus:ring-accentRed`,
    icon: `bg-transparent text-neutralDark hover:bg-neutralLighter active:scale-95 disabled:text-neutralMedium p-2 rounded-full focus:ring-shopifyGreen`, // Specific padding for icon
  };

  // Adjust padding for icon variant if size is also specified
  let currentSizeStyles = sizeStyles[size];
  if (variant === 'icon') {
    currentSizeStyles = { // Shopify icon buttons are often fixed size ~32px or ~44px
      small: "p-1.5", // approx 28-30px
      medium: "p-2",  // approx 32-36px
      large: "p-3",   // approx 40-44px
    }[size];
  }


  return (
    <button
      type="button"
      className={`
        ${baseStyles}
        ${currentSizeStyles}
        ${variantStyles[variant]}
        ${disabled ? 'cursor-not-allowed opacity-70' : ''}
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
