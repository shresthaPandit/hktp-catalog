'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

type AuthStep = 'phone' | 'otp' | 'profile'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void  // Called after auth completes — resumes the original action (e.g., add to cart)
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const supabase = createClient()
  const [step, setStep] = useState<AuthStep>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Reset state when modal closes
  function handleClose() {
    setStep('phone')
    setPhone('')
    setOtp('')
    setError('')
    onClose()
  }

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
        onSuccess()  // Resume original action (e.g., add to cart)
        handleClose()
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
      setError('Session expired')
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
      onSuccess()  // Resume original action after profile complete
      handleClose()
    }
    setLoading(false)
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Sign in to continue"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="relative w-full max-w-sm bg-white rounded-xl shadow-xl p-8">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            &#x2715;
          </button>

          <h2 className="text-xl font-bold text-[#991B1B] mb-1">
            {step === 'phone' && 'Sign in to continue'}
            {step === 'otp' && 'Enter verification code'}
            {step === 'profile' && 'Complete your profile'}
          </h2>
          <p className="text-sm text-gray-500 mb-5">
            {step === 'phone' && 'Enter your phone number to add items to your cart'}
            {step === 'otp' && `Code sent to ${phone}`}
            {step === 'profile' && 'Required for placing orders'}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-[#EF4444]">
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
              <Button type="submit" loading={loading} className="w-full">
                Send Code
              </Button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <Input
                label="6-digit Code"
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
              <Button type="submit" loading={loading} className="w-full">
                Verify
              </Button>
              <button
                type="button"
                onClick={() => { setStep('phone'); setOtp(''); setError('') }}
                className="w-full text-sm text-gray-500 hover:text-[#991B1B]"
              >
                Change number
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
              <Button type="submit" loading={loading} className="w-full mt-2">
                Save & Continue
              </Button>
            </form>
          )}
        </div>
      </div>
    </>
  )
}
