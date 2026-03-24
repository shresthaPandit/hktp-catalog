'use client'
import { useEffect, useState } from 'react'

const TESTIMONIALS = [
  {
    quote: "HK Trailer Parts has been our go-to supplier for three years. Pricing is unbeatable and parts arrive exactly as described. Never had a fitment issue.",
    name: "Mike Deluca",
    company: "Deluca Transport Ltd.",
    role: "Fleet Manager",
    initials: "MD",
    color: "#c0392b",
  },
  {
    quote: "Submitted an inquiry at 9pm and had a quote by 8am the next morning. That response time keeps our trucks on the road. Highly recommend.",
    name: "Sandra Kowalski",
    company: "Prairie Freight Co.",
    role: "Operations Director",
    initials: "SK",
    color: "#1a6b9a",
  },
  {
    quote: "We source everything from trailer lights to axle hardware through HK. The catalog is massive and their team knows the product inside and out.",
    name: "Jason Tran",
    company: "Pacific Haul Inc.",
    role: "Procurement Lead",
    initials: "JT",
    color: "#1e7e5a",
  },
  {
    quote: "As a repair shop we need parts fast and correct. HK delivers on both. The wholesale pricing lets us stay competitive with our customers.",
    name: "Brenda Mills",
    company: "AllPro Trailer Service",
    role: "Owner",
    initials: "BM",
    color: "#7b4fa0",
  },
]

export function HeroTestimonials() {
  const [active, setActive] = useState(0)
  const [animating, setAnimating] = useState(false)

  function goTo(i: number) {
    if (i === active || animating) return
    setAnimating(true)
    setTimeout(() => {
      setActive(i)
      setAnimating(false)
    }, 280)
  }

  useEffect(() => {
    const id = setInterval(() => {
      goTo((active + 1) % TESTIMONIALS.length)
    }, 5000)
    return () => clearInterval(id)
  }, [active, animating])

  const t = TESTIMONIALS[active]

  return (
    <div className="flex flex-col h-full justify-center" style={{ gap: 28 }}>

      {/* Header label */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#E31E24', fontFamily: 'Space Grotesk' }}>
          Client Reviews
        </p>
        <h3 className="text-xl font-black text-white uppercase tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>
          Trusted by Businesses<br/>
          <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 400, fontSize: '0.95rem', textTransform: 'none', letterSpacing: 0 }}>across Canada</span>
        </h3>
      </div>

      {/* Main testimonial card */}
      <div style={{ position: 'relative' }}>

        {/* Shadow cards behind */}
        <div style={{
          position: 'absolute', inset: 0,
          transform: 'translateY(12px) scale(0.93)',
          borderRadius: 14,
          backgroundColor: 'rgba(227,30,36,0.08)',
          border: '1px solid rgba(227,30,36,0.15)',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          transform: 'translateY(6px) scale(0.96)',
          borderRadius: 14,
          backgroundColor: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
        }} />

        {/* Active card */}
        <div
          style={{
            position: 'relative',
            borderRadius: 14,
            overflow: 'hidden',
            backgroundColor: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.13)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            transition: 'opacity 0.28s ease, transform 0.28s ease',
            opacity: animating ? 0 : 1,
            transform: animating ? 'translateY(10px)' : 'translateY(0)',
          }}
        >
          {/* Red left accent bar */}
          <div style={{
            position: 'absolute', top: 0, left: 0, bottom: 0, width: 4,
            backgroundColor: '#E31E24',
            borderRadius: '14px 0 0 14px',
          }} />

          <div style={{ padding: '28px 28px 24px 32px' }}>
            {/* Stars */}
            <div style={{ display: 'flex', gap: 3, marginBottom: 16 }}>
              {[0,1,2,3,4].map(i => (
                <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill="#E31E24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              ))}
            </div>

            {/* Quote */}
            <p style={{
              color: 'rgba(255,255,255,0.88)',
              fontSize: '0.92rem',
              lineHeight: 1.75,
              marginBottom: 22,
              fontStyle: 'italic',
            }}>
              &ldquo;{t.quote}&rdquo;
            </p>

            {/* Divider */}
            <div style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginBottom: 18 }} />

            {/* Author */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                backgroundColor: t.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem', fontWeight: 900, color: '#fff',
                fontFamily: 'Space Grotesk', flexShrink: 0,
                boxShadow: `0 0 0 2px rgba(255,255,255,0.1)`,
              }}>
                {t.initials}
              </div>
              <div>
                <div style={{ color: '#ffffff', fontSize: '0.85rem', fontWeight: 700, fontFamily: 'Space Grotesk', lineHeight: 1.2 }}>
                  {t.name}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.72rem', fontFamily: 'Space Grotesk', marginTop: 2 }}>
                  {t.role} &nbsp;·&nbsp; {t.company}
                </div>
              </div>

              {/* Verified badge — right aligned */}
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#E31E24" strokeWidth="2.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem', fontFamily: 'Space Grotesk', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Verified
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mini preview cards row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {TESTIMONIALS.filter((_, i) => i !== active).slice(0, 2).map((item, idx) => {
          const realIdx = TESTIMONIALS.indexOf(item)
          return (
            <button
              key={realIdx}
              onClick={() => goTo(realIdx)}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10,
                padding: '12px 14px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.2s, border-color 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  backgroundColor: item.color, opacity: 0.85,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.6rem', fontWeight: 900, color: '#fff', fontFamily: 'Space Grotesk',
                }}>
                  {item.initials}
                </div>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.72rem', fontWeight: 700, fontFamily: 'Space Grotesk' }}>
                  {item.name}
                </span>
              </div>
              <p style={{
                color: 'rgba(255,255,255,0.35)',
                fontSize: '0.68rem',
                lineHeight: 1.5,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {item.quote}
              </p>
            </button>
          )
        })}
      </div>

      {/* Dot nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
        {TESTIMONIALS.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            style={{
              width: i === active ? 22 : 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: i === active ? '#E31E24' : 'rgba(255,255,255,0.2)',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              transition: 'width 0.3s ease, background-color 0.3s ease',
            }}
            aria-label={`Testimonial ${i + 1}`}
          />
        ))}
      </div>

    </div>
  )
}
