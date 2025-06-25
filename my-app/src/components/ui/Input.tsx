

// Input Component (bonus - to match the pattern)
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

const Input: React.FC<InputProps> = ({
  className,
  disabled,
  hasError,
  type = 'text',
  ...props
}) => {
  const baseStyles = `
    block w-full px-3 py-2 border rounded-lg shadow-sm 
    placeholder-gray-400 focus:outline-none focus:ring-2 
    focus:ring-blue-500 focus:border-blue-500 sm:text-sm 
    transition-colors
  `;

  const stateStyles = hasError
    ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
    : 'border-gray-300 hover:border-gray-400';

  const disabledStyles = disabled
    ? 'bg-gray-50 cursor-not-allowed'
    : 'bg-white';

  return (
    <input
      type={type}
      className={`
        ${baseStyles}
        ${stateStyles}
        ${disabledStyles}
        ${className || ''}
      `}
      disabled={disabled}
      {...props}
    />
  );
};

export default Input;