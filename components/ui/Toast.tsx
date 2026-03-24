'use client'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  message: string
  type: ToastType
}

let toastCallbacks: Array<(toast: Toast) => void> = []

export function showToast(message: string, type: ToastType = 'info') {
  const toast: Toast = { id: Date.now().toString(), message, type }
  toastCallbacks.forEach(cb => cb(toast))
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const handler = (toast: Toast) => {
      setToasts(prev => [...prev, toast])
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id))
      }, 4000)
    }
    toastCallbacks.push(handler)
    return () => {
      toastCallbacks = toastCallbacks.filter(cb => cb !== handler)
    }
  }, [])

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(toast => (
        <div key={toast.id} className={cn(
          'px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium max-w-sm',
          toast.type === 'success' && 'bg-[#10B981]',
          toast.type === 'error' && 'bg-[#EF4444]',
          toast.type === 'warning' && 'bg-[#F59E0B] text-gray-900',
          toast.type === 'info' && 'bg-[#E31E24]',
        )}>
          {toast.message}
        </div>
      ))}
    </div>
  )
}
