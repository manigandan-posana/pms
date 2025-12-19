import React from 'react';

type ToggleProps = {
  /** Icon to show when toggle is ON */
  iconOn?: React.ReactNode;
  /** Icon to show when toggle is OFF */
  iconOff?: React.ReactNode;
  /** Controlled checked value (optional) */
  checked?: boolean;
  /** Change handler (optional) */
  onChange?: (checked: boolean) => void;
  /** Label text (optional) */
  label?: string;
  /** Extra classes for wrapper div (optional) */
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'checked'>;

const Toggle: React.FC<ToggleProps> = ({
  iconOn,
  iconOff,
  checked,
  onChange,
  label,
  className = '',
  disabled,
  ...inputProps
}) => {
  const isControlled = typeof checked === 'boolean';
  const [internalChecked, setInternalChecked] = React.useState(false);

  const value = isControlled ? checked : internalChecked;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) {
      setInternalChecked(e.target.checked);
    }
    onChange?.(e.target.checked);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label
        className={`relative inline-flex select-none items-center ${
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
        }`}
      >
        <input
          type="checkbox"
          className="sr-only peer"
          checked={value}
          onChange={handleChange}
          disabled={disabled}
          {...inputProps}
        />

        {/* Track + knob */}
        <div
          className="
            group peer ring-0 bg-gray-100 border-2 border-[#0a7326] rounded-full
            outline-none relative w-14 h-8 shadow-md
            transition-all duration-300 ease-out
            peer-focus:outline-none
            peer-checked:bg-[#0a7326] peer-checked:border-[#0a7326]

            after:content-[''] after:rounded-full after:absolute after:bg-[#0a7326]
            after:outline-none after:h-6 after:w-6 after:top-0.5 after:left-0.5
            after:transition-all after:duration-300 after:ease-out
            peer-checked:after:translate-x-6 peer-checked:after:bg-white
            peer-hover:after:scale-95
          "
        >
          {/* OFF icon (left) - Page specific icon */}
          <span
            className="
              pointer-events-none absolute inset-y-0 left-0.5
              flex items-center justify-center w-6 h-6
              transition-opacity duration-200 ease-out
              peer-checked:opacity-0 text-white
            "
          >
            {iconOff}
          </span>

          {/* ON icon (right) - History icon */}
          <span
            className="
              pointer-events-none absolute inset-y-0 right-0.5
              flex items-center justify-center w-6 h-6
              transition-opacity duration-200 ease-out
              opacity-0 peer-checked:opacity-100 text-[#0a7326]
            "
          >
            {iconOn}
          </span>
        </div>
      </label>
      {label && <span className="text-xs font-medium text-slate-700">{label}</span>}
    </div>
  );
};

export default Toggle;
