import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    const variants = {
      primary:   'metallic-gradient text-white hover:brightness-110',
      secondary: 'bg-[var(--surface-raised)] text-[var(--on-surface)] hover:bg-[var(--border-dim)]',
      outline:   'border border-[#cbd0dd] text-[var(--on-surface-dim)] hover:bg-[#E31E24] hover:text-white hover:border-[#E31E24]',
      ghost:     'text-[#E31E24] hover:bg-[var(--surface-raised)]',
      danger:    'bg-red-600 text-white hover:bg-red-700',
    }
    const sizes = {
      sm: 'px-4 py-2 text-xs',
      md: 'px-6 py-3 text-sm',
      lg: 'px-10 py-4 text-sm',
    }
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-bold uppercase tracking-widest transition-all active:scale-95',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E31E24]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          className
        )}
        style={{fontFamily: 'Space Grotesk'}}
        {...props}
      >
        {loading && (
          <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
