// Textarea Component
import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

const Textarea: React.FC<TextareaProps> = ({
  className,
  disabled,
  hasError,
  rows = 4,
  ...props
}) => {
  const baseStyles = `
    block w-full px-3 py-2 border rounded-lg shadow-sm 
    placeholder-gray-400 focus:outline-none focus:ring-2 
    focus:ring-blue-500 focus:border-blue-500 sm:text-sm 
    transition-colors resize-none
  `;

  const stateStyles = hasError
    ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
    : 'border-gray-300 hover:border-gray-400';

  const disabledStyles = disabled
    ? 'bg-gray-50 cursor-not-allowed'
    : 'bg-white';

  return (
    <textarea
      rows={rows}
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

export default Textarea;

