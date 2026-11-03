import React from 'react';

/**
 * Reusable FormField component for consistent layout, labels, and error messages
 */
const FormField = ({
  label,
  required = false,
  error,
  hint,
  children,
  className = '',
}) => {
  return (
    <div className={`report-field ${className}`}>
      {label && (
        <label>
          {label}
          {required && <span className="req">*</span>}
        </label>
      )}
      {children}
      {error && <span className="field-error-msg">{error}</span>}
      {hint && !error && <span className="field-hint-msg">{hint}</span>}
    </div>
  );
};

export default FormField;
