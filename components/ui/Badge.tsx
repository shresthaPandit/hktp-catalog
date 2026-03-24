import { cn } from '@/lib/utils'

interface BadgeProps {
  variant?: 'success' | 'danger' | 'warning' | 'info' | 'neutral'
  children: React.ReactNode
  className?: string
}

export function Badge({ variant = 'neutral', children, className }: BadgeProps) {
  const variants = {
    success: 'bg-[#052e16]/60 text-[#4ade80] border border-[#166534]/40',
    danger:  'bg-[#450a0a]/60 text-[#f87171] border border-[#991b1b]/40',
    warning: 'bg-[#431407]/60 text-[#fb923c] border border-[#9a3412]/40',
    info:    'bg-[#172554]/60 text-[#60a5fa] border border-[#1e40af]/40',
    neutral: 'bg-[var(--surface-raised)] text-[var(--on-surface-dim)] border border-[#cbd0dd]/30',
  }
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide',
      variants[variant],
      className
    )}>
      {children}
    </span>
  )
}
