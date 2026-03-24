'use client'
import { useState } from 'react'
import Image from 'next/image'

interface ProductImageGalleryProps {
  images: string[]
  primaryImage: string | null
  productName: string
}

export function ProductImageGallery({ images, primaryImage, productName }: ProductImageGalleryProps) {
  const allImages = primaryImage
    ? [primaryImage, ...images.filter(img => img !== primaryImage)]
    : images

  const [activeImage, setActiveImage] = useState(allImages[0] ?? null)

  if (!activeImage && allImages.length === 0) {
    return (
      <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
        <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Large primary image */}
      <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
        {activeImage && (
          <Image
            src={activeImage}
            alt={productName}
            width={600}
            height={600}
            className="w-full h-full object-contain"
            unoptimized
            priority
          />
        )}
      </div>

      {/* Thumbnail row */}
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {allImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveImage(img)}
              className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden transition-colors ${
                activeImage === img ? 'border-[#991B1B]' : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <Image
                src={img}
                alt={`${productName} thumbnail ${idx + 1}`}
                width={64}
                height={64}
                className="w-full h-full object-contain"
                unoptimized
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
