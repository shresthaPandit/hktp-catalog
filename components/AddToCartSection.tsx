'use client'
import { useState } from 'react'
import { AddToCartButton } from '@/components/AddToCartButton'

interface AddToCartSectionProps {
  productId: number
  isAuthenticated: boolean
  sku: string
  name: string
  price?: number | null
  primary_image_url?: string | null
  in_stock?: boolean
}

export function AddToCartSection({ productId, isAuthenticated, sku, name, price, primary_image_url, in_stock }: AddToCartSectionProps) {
  const [quantity, setQuantity] = useState(1)

  return (
    <div className="flex items-center gap-3 pt-2">
      <div className="flex items-center border border-gray-300 rounded-md">
        <button
          type="button"
          className="px-3 py-2 text-gray-600 hover:bg-gray-50 transition-colors"
          aria-label="Decrease quantity"
          onClick={() => setQuantity(q => Math.max(1, q - 1))}
        >
          &minus;
        </button>
        <span className="px-4 py-2 text-sm font-medium min-w-[3rem] text-center">{quantity}</span>
        <button
          type="button"
          className="px-3 py-2 text-gray-600 hover:bg-gray-50 transition-colors"
          aria-label="Increase quantity"
          onClick={() => setQuantity(q => q + 1)}
        >
          +
        </button>
      </div>
      <AddToCartButton
        productId={productId} isAuthenticated={isAuthenticated} quantity={quantity}
        sku={sku} name={name} price={price} primary_image_url={primary_image_url} in_stock={in_stock}
      />
    </div>
  )
}
