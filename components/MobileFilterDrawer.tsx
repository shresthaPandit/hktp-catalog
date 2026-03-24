'use client'
import { useState } from 'react'
import { FilterSidebar } from './FilterSidebar'

interface Props {
  categories: string[]
  brands: string[]
  activeCategory: string | null
  activeBrand: string | null
  activeInStock: boolean
  totalCount: number
}

export function MobileFilterDrawer({ categories, brands, activeCategory, activeBrand, activeInStock, totalCount }: Props) {
  const [open, setOpen] = useState(false)
  const hasActive = !!(activeCategory || activeBrand || activeInStock)

  return (
    <>
      {/* Trigger button — visible on mobile only */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 lg:hidden metallic-gradient px-4 py-2 text-xs font-bold uppercase tracking-widest text-white"
        style={{fontFamily: 'Space Grotesk'}}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="12" y1="18" x2="20" y2="18"/>
        </svg>
        Filters
        {hasActive && <span className="bg-white text-[#E31E24] rounded-full w-4 h-4 text-[10px] flex items-center justify-center font-black">!</span>}
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div className={`fixed top-0 left-0 z-50 h-full w-80 bg-[var(--surface)] border-r border-[#cbd0dd] transform transition-transform duration-300 lg:hidden overflow-y-auto ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-6 border-b border-[#cbd0dd]/30">
          <span className="text-sm font-bold uppercase tracking-widest text-[var(--on-surface)]" style={{fontFamily: 'Space Grotesk'}}>Filters</span>
          <button onClick={() => setOpen(false)} className="text-[var(--on-surface-dim)] hover:text-[var(--on-surface)] p-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="p-6">
          <FilterSidebar
            categories={categories}
            brands={brands}
            activeCategory={activeCategory}
            activeBrand={activeBrand}
            activeInStock={activeInStock}
          />
        </div>
        {/* Close after selecting */}
        <div className="p-6 border-t border-[#cbd0dd]/30">
          <button
            onClick={() => setOpen(false)}
            className="w-full border border-[#cbd0dd] py-3 text-xs font-bold uppercase tracking-widest text-[var(--on-surface-dim)] hover:bg-[var(--surface-raised)] transition-all"
            style={{fontFamily: 'Space Grotesk'}}
          >
            Show {totalCount.toLocaleString()} Results
          </button>
        </div>
      </div>
    </>
  )
}
