import React from 'react';

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  hasError?: boolean;
}

const Select: React.FC<SelectProps> = ({
  className,
  options,
  disabled,
  hasError,
  ...props
}) => {
  const baseStyles = `
    w-full pl-3 pr-10 py-2 bg-white text-neutralDark
    border rounded-radiusSmall shadow-sm
    focus:outline-none focus:ring-2 focus:ring-opacity-50
    appearance-none cursor-pointer
    transition-colors duration-150 ease-in-out
  `; // appearance-none to hide default browser arrow

  const normalStateStyles = "border-neutralMedium focus:border-shopifyGreen focus:ring-shopifyGreen";
  const errorStateStyles = "border-accentRed focus:border-accentRed focus:ring-accentRed";
  const disabledStateStyles = "bg-neutralLighter border-neutralLight text-neutralTextSecondary cursor-not-allowed opacity-70";

  return (
    <div className="relative w-full">
      <select
        className={`
          ${baseStyles}
          ${disabled ? disabledStateStyles : (hasError ? errorStateStyles : normalStateStyles)}
          ${className || ''}
        `}
        disabled={disabled}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-neutralTextSecondary">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
        </svg>
      </div>
    </div>
  );
};

export default Select;
