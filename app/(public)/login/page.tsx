'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { mergeGuestCart } from '@/app/actions/cart'
import { useCart } from '@/components/CartProvider'

type LoginStep = 'phone' | 'otp' | 'profile'

export default function LoginPage() {
  return <Suspense><LoginContent /></Suspense>
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') ?? '/products'
  const supabase = createClient()
  const { guestItems, clearGuestCart } = useCart()

  async function handlePostAuth() {
    if (guestItems.length > 0) {
      await mergeGuestCart(guestItems.map(i => ({ productId: i.productId, quantity: i.quantity })))
      clearGuestCart()
    }
    router.push(redirectTo)
    router.refresh()
  }
  const [step, setStep] = useState<LoginStep>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const normalizedPhone = phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`

    const { error } = await supabase.auth.signInWithOtp({ phone: normalizedPhone })
    if (error) {
      setError(error.message)
    } else {
      setPhone(normalizedPhone)
      setStep('otp')
    }
    setLoading(false)
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { session }, error } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: 'sms',
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (session) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_name')
        .eq('id', session.user.id)
        .single()

      if (!profile?.company_name) {
        setStep('profile')
      } else {
        await handlePostAuth()
      }
    }
    setLoading(false)
  }

  async function handleProfileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Session expired. Please try again.')
      setStep('phone')
      setLoading(false)
      return
    }

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      company_name: formData.get('company_name') as string,
      address: formData.get('address') as string,
      city: formData.get('city') as string,
      state: formData.get('state') as string,
      zip_code: formData.get('zip_code') as string,
      updated_at: new Date().toISOString(),
    })

    if (error) {
      setError(error.message)
    } else {
      router.push('/products')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--surface-alt)' }}>
      {/* Grid overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, #E31E24 0px, #E31E24 1px, transparent 1px, transparent 48px), repeating-linear-gradient(90deg, #E31E24 0px, #E31E24 1px, transparent 1px, transparent 48px)' }}
      />
      <div className="relative w-full max-w-sm">
        {/* Header accent */}
        <div className="h-1 w-full bg-[#E31E24] mb-0" />
        <div className="border border-[#cbd0dd]/30 border-t-0 p-8" style={{ backgroundColor: 'var(--surface-card)' }}>
          {/* Logo */}
          <div className="mb-8">
            <p className="text-2xl font-black tracking-tighter text-[#E31E24] uppercase mb-1" style={{ fontFamily: 'Space Grotesk' }}>HK</p>
            <h1 className="text-xl font-black uppercase tracking-tight" style={{ fontFamily: 'Space Grotesk', color: 'var(--on-surface)' }}>
              {step === 'phone' && 'Sign In'}
              {step === 'otp' && 'Enter Code'}
              {step === 'profile' && 'Complete Profile'}
            </h1>
            <p className="text-xs mt-1 uppercase tracking-wide" style={{ color: 'var(--on-surface-dim)', fontFamily: 'Space Grotesk' }}>
              {step === 'phone' && 'Wholesale Parts Portal'}
              {step === 'otp' && `Code sent to ${phone}`}
              {step === 'profile' && 'Required for placing orders'}
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          {step === 'phone' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <Input
                label="Phone Number"
                type="tel"
                placeholder="+1 555 123 4567"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
                autoFocus
              />
              <Button type="submit" loading={loading} className="w-full" size="lg">
                Send Verification Code
              </Button>
              <p className="text-center text-xs mt-2" style={{ color: 'var(--on-surface-dim)', fontFamily: 'Space Grotesk' }}>
                New here?{' '}
                <Link href="/signup" className="font-bold text-[#E31E24] hover:underline">Create an account</Link>
              </p>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <Input
                label="Verification Code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                required
                autoFocus
              />
              <Button type="submit" loading={loading} className="w-full" size="lg">
                Verify Code
              </Button>
              <button
                type="button"
                onClick={() => { setStep('phone'); setOtp(''); setError('') }}
                className="w-full text-xs font-bold uppercase tracking-widest text-[var(--on-surface-dim)] hover:text-[#E31E24] transition-colors"
                style={{ fontFamily: 'Space Grotesk' }}
              >
                Use a different number
              </button>
            </form>
          )}

          {step === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-3">
              <Input label="Company Name" name="company_name" required placeholder="Acme Trailers Inc." autoFocus />
              <Input label="Street Address" name="address" required placeholder="123 Main St" />
              <div className="grid grid-cols-2 gap-3">
                <Input label="City" name="city" required placeholder="Toronto" />
                <Input label="Province" name="state" required placeholder="ON" />
              </div>
              <Input label="Postal Code" name="zip_code" required placeholder="M5V 3A8" />
              <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
                Save & Continue
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
