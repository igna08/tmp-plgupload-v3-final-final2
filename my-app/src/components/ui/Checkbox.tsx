import React from 'react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  // 'checked' and 'onChange' are part of InputHTMLAttributes
}

const Checkbox: React.FC<CheckboxProps> = ({
  className,
  label,
  checked,
  disabled,
  id, // Ensure id is passed for label association
  ...props
}) => {
  const checkboxId = id || `checkbox-${React.useId()}`; // Generate id if not provided

  return (
    <div className={`flex items-center ${className || ''} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
      <input
        type="checkbox"
        id={checkboxId}
        checked={checked}
        disabled={disabled}
        className={`
          h-4 w-4 rounded border-neutralMedium text-shopifyGreen shadow-sm
          focus:ring-2 focus:ring-shopifyGreen focus:ring-opacity-50 focus:ring-offset-0
          disabled:bg-neutralLight disabled:border-neutralLight disabled:cursor-not-allowed
          transition-colors duration-150 ease-in-out
          ${checked && !disabled ? 'bg-shopifyGreen border-shopifyGreen' : 'bg-white'}
        `}
        {...props}
      />
      {label && (
        <label
          htmlFor={checkboxId}
          className={`ml-2 text-sm ${disabled ? 'text-neutralTextSecondary' : 'text-neutralDark'}`}
        >
          {label}
        </label>
      )}
    </div>
  );
};

export default Checkbox;
