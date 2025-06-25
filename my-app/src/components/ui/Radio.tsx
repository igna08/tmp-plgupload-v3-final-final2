

// Radio Component
import React from 'react';

interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Radio: React.FC<RadioProps> = ({
  className,
  label,
  checked,
  disabled,
  id,
  name,
  value,
  ...props
}) => {
  const radioId = id || `radio-${React.useId()}`;

  return (
    <div className={`flex items-center ${className || ''}`}>
      <input
        type="radio"
        id={radioId}
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        className={`
          h-4 w-4 text-blue-600 border-gray-300 shadow-sm
          focus:ring-2 focus:ring-blue-500 focus:ring-offset-0
          disabled:bg-gray-100 disabled:border-gray-300 
          disabled:cursor-not-allowed transition-colors
          ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
        `}
        {...props}
      />
      {label && (
        <label
          htmlFor={radioId}
          className={`ml-2 text-sm transition-colors ${
            disabled 
              ? 'text-gray-400 cursor-not-allowed' 
              : 'text-gray-700 cursor-pointer hover:text-gray-900'
          }`}
        >
          {label}
        </label>
      )}
    </div>
  );
};

export default Radio;
