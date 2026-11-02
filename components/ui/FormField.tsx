import { cn } from "@/lib/utils";
import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

const baseInputClasses =
  "w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-soft/40 focus:outline-none focus:ring-2 focus:ring-teal-700/30 focus:border-teal-700 transition-colors";

function FieldWrapper({
  label,
  hint,
  required,
  children,
}: {
  label?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-ink">
          {label}
          {required && <span className="text-clay-600 ml-0.5">*</span>}
        </span>
      )}
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-soft/60">{hint}</span>}
    </label>
  );
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

export function TextField({ label, hint, required, className, ...props }: TextFieldProps) {
  return (
    <FieldWrapper label={label} hint={hint} required={required}>
      <input className={cn(baseInputClasses, className)} required={required} {...props} />
    </FieldWrapper>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  options: { label: string; value: string }[];
  placeholder?: string;
}

export function SelectField({
  label,
  hint,
  required,
  options,
  placeholder,
  className,
  ...props
}: SelectFieldProps) {
  return (
    <FieldWrapper label={label} hint={hint} required={required}>
      <select
        className={cn(baseInputClasses, "appearance-none bg-no-repeat pr-9", className)}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2326332F' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
          backgroundPosition: "right 0.75rem center",
        }}
        required={required}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
}

export function TextAreaField({ label, hint, required, className, ...props }: TextAreaProps) {
  return (
    <FieldWrapper label={label} hint={hint} required={required}>
      <textarea
        className={cn(baseInputClasses, "min-h-[100px] resize-y", className)}
        required={required}
        {...props}
      />
    </FieldWrapper>
  );
}
