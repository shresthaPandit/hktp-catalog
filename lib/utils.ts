import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number | null): string {
  if (price === null || price === undefined) return 'Contact for price'
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(price)
}

export function formatOrderNumber(orderNumber: string): string {
  return orderNumber // Already formatted as ORD-YYYY-NNNNN
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-orange-100 text-orange-800',
    contacted: 'bg-blue-100 text-blue-800',
    processing: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  }
  return colors[status] ?? 'bg-gray-100 text-gray-800'
}
