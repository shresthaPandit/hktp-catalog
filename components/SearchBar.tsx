'use client'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'
import { useState, useEffect } from 'react'

interface SearchBarProps {
  placeholder?: string
  defaultValue?: string
}

export function SearchBar({ placeholder = 'Search...', defaultValue = '' }: SearchBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(defaultValue)

  // Sync with URL when navigating (e.g. clear filters)
  useEffect(() => {
    setValue(searchParams.get('q') ?? '')
  }, [searchParams])

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', '1')
    if (term.trim()) {
      params.set('q', term.trim())
    } else {
      params.delete('q')
    }
    router.replace(`${pathname}?${params.toString()}`)
  }, 350)

  return (
    <div className="relative group">
      {/* Search icon */}
      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#E31E24] pointer-events-none z-10 transition-transform duration-200 group-focus-within:scale-110">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </div>
      <input
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          setValue(e.target.value)
          handleSearch(e.target.value)
        }}
        className="w-full h-14 pl-14 pr-6 text-base font-medium bg-transparent outline-none transition-all duration-300 uppercase tracking-wide placeholder:normal-case placeholder:tracking-normal placeholder:font-normal"
        style={{
          backgroundColor: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(96,62,57,0.4)',
          borderLeft: '3px solid #E31E24',
          color: 'var(--on-surface)',
          fontFamily: 'Space Grotesk',
        }}
        onFocus={e => {
          e.currentTarget.style.backgroundColor = 'rgba(255,85,64,0.04)'
          e.currentTarget.style.borderColor = '#E31E24'
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,85,64,0.12), inset 0 0 20px rgba(255,85,64,0.03)'
        }}
        onBlur={e => {
          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'
          e.currentTarget.style.borderColor = 'rgba(96,62,57,0.4)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      />
      {/* Animated bottom line */}
      <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-[#E31E24] group-focus-within:w-full transition-all duration-500" />
      {/* Clear button */}
      {value && (
        <button
          onClick={() => {
            setValue('')
            handleSearch('')
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--on-surface-dim)] hover:text-[#E31E24] transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      )}
    </div>
  )
}
