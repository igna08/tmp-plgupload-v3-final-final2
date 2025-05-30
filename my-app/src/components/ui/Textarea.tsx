import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

const Textarea: React.FC<TextareaProps> = ({
  className,
  disabled,
  hasError,
  rows = 4, // Default rows
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
    <textarea
      rows={rows}
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

export default Textarea;
