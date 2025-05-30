import React from 'react';

interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  // 'name', 'value', 'checked', 'onChange' are part of InputHTMLAttributes
}

const Radio: React.FC<RadioProps> = ({
  className,
  label,
  checked,
  disabled,
  id, // Ensure id is passed for label association
  name,
  value,
  ...props
}) => {
  const radioId = id || `radio-${React.useId()}`; // Generate id if not provided

  return (
    <div className={`flex items-center ${className || ''} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
      <input
        type="radio"
        id={radioId}
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        className={`
          h-4 w-4 rounded-full border-neutralMedium text-shopifyGreen shadow-sm
          focus:ring-2 focus:ring-shopifyGreen focus:ring-opacity-50 focus:ring-offset-0
          disabled:bg-neutralLight disabled:border-neutralLight disabled:cursor-not-allowed
          transition-colors duration-150 ease-in-out
          ${checked && !disabled ? 'bg-shopifyGreen border-shopifyGreen' : 'bg-white'}
        `}
        // Tailwind's default radio is a blue color. To make it green, you might need a custom form plugin or more specific styling if text-shopifyGreen doesn't override the check mark color.
        // For a simple green dot, some custom CSS might be needed if text-color doesn't apply to the inner dot for all browsers.
        // The current approach relies on text-shopifyGreen to color the check/dot.
        {...props}
      />
      {label && (
        <label
          htmlFor={radioId}
          className={`ml-2 text-sm ${disabled ? 'text-neutralTextSecondary' : 'text-neutralDark'}`}
        >
          {label}
        </label>
      )}
    </div>
  );
};

export default Radio;
