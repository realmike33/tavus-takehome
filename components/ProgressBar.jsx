'use client'
import { useEffect, useState } from 'react'

export default function ProgressBar() {
  const [p, setP] = useState(0)
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement
      const scrolled = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100
      setP(scrolled)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <div className="fixed top-0 left-0 right-0 h-1 bg-white/10 z-50">
      <div className="h-1 bg-brand transition-[width]" style={{ width: `${p}%` }} />
    </div>
  )
}
