import React, { useState, useEffect } from 'react';
import { formatNumberWithCommas, parseNumberWithCommas } from '../../utils/utils';

const NumberInput = ({
  value,
  onChange,
  placeholder,
  className = '',
  min,
  max,
  step = '0.01',
  disabled = false,
  ...props
}) => {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    setDisplayValue(formatNumberWithCommas(value));
  }, [value]);

  const handleChange = (e) => {
    const inputValue = e.target.value;
    // Remove any non-numeric characters except decimal point and comma
    const cleanValue = inputValue.replace(/[^0-9.,]/g, '');
    setDisplayValue(cleanValue);

    // Parse the value and call onChange with the numeric value
    const numericValue = parseNumberWithCommas(cleanValue);
    onChange(numericValue);
  };

  const handleBlur = () => {
    // Format the display value with commas when input loses focus
    const numericValue = parseNumberWithCommas(displayValue);
    setDisplayValue(formatNumberWithCommas(numericValue));
  };

  return (
    <input
      type="text"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={`form-input ${className}`}
      disabled={disabled}
      min={min}
      max={max}
      step={step}
      {...props}
    />
  );
};

export default NumberInput;
