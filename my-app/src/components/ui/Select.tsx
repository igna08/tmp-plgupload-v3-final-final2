// Select Component
import React from 'react';
import { ChevronDown } from 'lucide-react';

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
    block w-full pl-3 pr-10 py-2 border rounded-lg shadow-sm 
    focus:outline-none focus:ring-2 focus:ring-blue-500 
    focus:border-blue-500 sm:text-sm appearance-none 
    transition-colors
  `;

  const stateStyles = hasError
    ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500'
    : 'border-gray-300 hover:border-gray-400 text-gray-900';

  const disabledStyles = disabled
    ? 'bg-gray-50 cursor-not-allowed text-gray-500'
    : 'bg-white cursor-pointer';

  return (
    <div className="relative">
      <select
        className={`
          ${baseStyles}
          ${stateStyles}
          ${disabledStyles}
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
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
        <ChevronDown className={`h-4 w-4 ${disabled ? 'text-gray-400' : 'text-gray-500'}`} />
      </div>
    </div>
  );
};

export default Select;

