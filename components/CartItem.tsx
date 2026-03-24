'use client'
import { CartWithProductRow } from '@/app/actions/cart'
import { formatPrice } from '@/lib/utils'

interface CartItemProps {
  item: CartWithProductRow
  onRemove: (id: number) => void
  onQuantityChange: (id: number, qty: number) => void
  isPending?: boolean
}

export function CartItem({ item, onRemove, onQuantityChange, isPending }: CartItemProps) {
  return (
    <div className={`flex items-start gap-3 py-3 px-4 border-b border-gray-100 last:border-0 ${isPending ? 'opacity-50' : ''}`}>
      {/* Thumbnail */}
      <img
        src={item.primary_image_url ?? '/placeholder.png'}
        alt={item.name}
        className="w-14 h-14 object-contain rounded border border-gray-200 flex-shrink-0"
      />

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
        <p
          className="text-xs text-gray-500 mt-0.5"
          style={{ fontFamily: 'JetBrains Mono, monospace' }}
        >
          {item.sku}
        </p>

        {/* Quantity stepper */}
        <div className="flex items-center gap-1 mt-2 border border-gray-300 rounded-md w-fit">
          <button
            onClick={() => onQuantityChange(item.cart_item_id, item.quantity - 1)}
            disabled={isPending}
            className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-l-md transition-colors disabled:cursor-not-allowed"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="px-2 text-sm font-medium text-gray-900 min-w-[2rem] text-center">
            {item.quantity}
          </span>
          <button
            onClick={() => onQuantityChange(item.cart_item_id, item.quantity + 1)}
            disabled={isPending}
            className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-r-md transition-colors disabled:cursor-not-allowed"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>

      {/* Right side: subtotal + remove */}
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <span className="text-sm font-semibold text-[#E31E24]">
          {item.subtotal != null ? formatPrice(item.subtotal) : '—'}
        </span>
        <button
          onClick={() => onRemove(item.cart_item_id)}
          disabled={isPending}
          className="text-gray-400 hover:text-[#EF4444] transition-colors disabled:cursor-not-allowed"
          aria-label="Remove item"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
