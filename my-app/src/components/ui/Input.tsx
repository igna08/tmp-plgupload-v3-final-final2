import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
  // label?: string; // Optional label, can be added later if needed for a form group component
}

const Input: React.FC<InputProps> = ({
  className,
  type = 'text',
  disabled,
  hasError,
  ...props
}) => {
  const baseStyles = `
    w-full px-3 py-2 bg-white text-neutralDark
    border rounded-radiusSmall shadow-sm
    placeholder-neutralTextSecondary
    focus:outline-none focus:ring-2 focus:ring-opacity-50
    transition-colors duration-150 ease-in-out
  `;

  const normalStateStyles = "border-neutralMedium focus:border-shopifyGreen focus:ring-shopifyGreen";
  const errorStateStyles = "border-accentRed focus:border-accentRed focus:ring-accentRed";
  const disabledStateStyles = "bg-neutralLighter border-neutralLight text-neutralTextSecondary cursor-not-allowed";

  return (
    <input
      type={type}
      className={`
        ${baseStyles}
        ${disabled ? disabledStateStyles : (hasError ? errorStateStyles : normalStateStyles)}
        ${className || ''}
      `}
      disabled={disabled}
      {...props}
    />
  );
};

export default Input;
