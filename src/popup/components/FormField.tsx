import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

interface Props {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  type?: 'text' | 'email';
  placeholder?: string;
  children?: ReactNode;
  className?: string;
  focusRequest?: number;
  maxLength?: number;
  required?: boolean;
}

export function FormField({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  type = 'text',
  placeholder,
  children,
  className = '',
  focusRequest,
  maxLength,
  required = true,
}: Props) {
  const ref = useRef<HTMLInputElement | HTMLSelectElement>(null);
  useEffect(() => {
    if (focusRequest !== undefined) ref.current?.focus();
  }, [focusRequest]);
  const common = {
    id,
    value,
    onBlur,
    required,
    className: `field-control ${className}`,
    'aria-invalid': error ? (true as const) : undefined,
    'aria-describedby': error ? `${id}-error` : undefined,
  };
  return (
    <div className="form-field">
      <div className="field-label">
        <label htmlFor={id}>{label}</label>
        {error && (
          <span className="field-error" id={`${id}-error`} title={error}>
            {error}
          </span>
        )}
      </div>
      {children ? (
        <select
          {...common}
          ref={(node) => {
            ref.current = node;
          }}
          onChange={(event) => onChange(event.target.value)}
        >
          {children}
        </select>
      ) : (
        <input
          {...common}
          ref={(node) => {
            ref.current = node;
          }}
          type={type}
          placeholder={placeholder}
          maxLength={maxLength}
          autoComplete="off"
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </div>
  );
}
