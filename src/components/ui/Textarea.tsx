import React, { forwardRef } from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  fullWidth?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    label, 
    helperText, 
    error, 
    fullWidth = false,
    className = '',
    ...props 
  }, ref) => {
    return (
      <div className={`mb-4 ${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label className="block text-sm font-medium text-gray-200 mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          <textarea
            ref={ref}
            className={`
              bg-gaming-card text-white rounded-md shadow-sm
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
              disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed
              ${error ? 'border-accent-600 focus:ring-accent-600' : 'border-gray-600'} 
              px-4 py-2 w-full ${className}
            `}
            rows={4}
            {...props}
          />
        </div>
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-400">{helperText}</p>
        )}
        {error && (
          <p className="mt-1 text-sm text-accent-500">{error}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;