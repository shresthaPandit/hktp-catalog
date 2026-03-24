import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-xs font-bold uppercase tracking-widest text-[var(--on-surface-dim)]" style={{fontFamily: 'Space Grotesk'}}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'bg-[var(--surface-raised)] border border-[#cbd0dd] px-4 py-3 text-sm text-[var(--on-surface)]',
            'focus:outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]',
            'placeholder:text-[var(--on-surface-dim)] disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-red-400 focus:ring-red-400',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
