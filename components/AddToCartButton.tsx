'use client'
import { useTransition } from 'react'
import { addToCart } from '@/app/actions/cart'
import { useCart } from '@/components/CartProvider'
import { Button } from '@/components/ui/Button'

interface AddToCartButtonProps {
  productId: number
  isAuthenticated: boolean
  quantity?: number
  sku: string
  name: string
  price?: number | null
  primary_image_url?: string | null
  in_stock?: boolean
}

export function AddToCartButton({
  productId, isAuthenticated, quantity = 1,
  sku, name, price = null, primary_image_url = null, in_stock = true,
}: AddToCartButtonProps) {
  const { open, addGuestItem } = useCart()
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    if (!isAuthenticated) {
      addGuestItem({ productId, sku, name, price, primary_image_url, in_stock, quantity })
      open()
      return
    }
    startTransition(async () => {
      await addToCart(productId, quantity)
      open()
    })
  }

  return (
    <Button size="lg" className="flex-1" onClick={handleClick} loading={isPending}>
      Add to Cart
    </Button>
  )
}
