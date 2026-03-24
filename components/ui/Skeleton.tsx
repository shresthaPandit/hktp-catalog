import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'card' | 'image'
}

export function Skeleton({ className, variant = 'text' }: SkeletonProps) {
  const variants = {
    text: 'h-4 rounded',
    card: 'h-48 rounded-lg',
    image: 'aspect-square rounded-md',
  }
  return (
    <div className={cn('animate-pulse bg-gray-200', variants[variant], className)} />
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 p-4 space-y-3">
      <Skeleton variant="image" className="w-full" />
      <Skeleton variant="text" className="w-3/4" />
      <Skeleton variant="text" className="w-1/2" />
      <Skeleton variant="text" className="w-1/4" />
    </div>
  )
}
