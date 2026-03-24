'use client'
import React, { useEffect, useState } from 'react'
import { useCart } from '@/components/CartProvider'
import { getCart } from '@/app/actions/cart'

export function CartBadge({ color = '#374151' }: { color?: string }) {
  const { open } = useCart()
  const [count, setCount] = useState(0)

  useEffect(() => {
    getCart().then((items) => {
      setCount(items.reduce((sum, i) => sum + i.quantity, 0))
    })
  }, [])

  return (
    <button
      onClick={open}
      className="relative p-2 transition-colors nav-link" style={{ color }}
      aria-label="Open cart"
    >
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-[#EF4444] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  )
}
