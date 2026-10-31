import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../lib/utils'

type FormFieldProps = {
  label: string
  error?: string
  hint?: ReactNode
  className?: string
  inputClassName?: string
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'id'>

export function FormField({ label, error, hint, className, inputClassName, ...inputProps }: FormFieldProps) {
  const generatedId = useId()
  const errorId = `${generatedId}-error`
  const hintId = `${generatedId}-hint`
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={generatedId} className="block text-sm font-medium text-slate-700">{label}</label>
      <input
        id={generatedId}
        className={cn('h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4', error ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100', inputClassName)}
        aria-invalid={Boolean(error)}
        aria-describedby={[error ? errorId : '', hint ? hintId : ''].filter(Boolean).join(' ') || undefined}
        {...inputProps}
      />
      {error ? <p id={errorId} className="text-xs text-rose-600">{error}</p> : null}
      {hint ? <div id={hintId} className="text-xs text-slate-500">{hint}</div> : null}
    </div>
  )
}
