'use client'
import Console from '@/components/Console'
import ProgressBar from '@/components/ProgressBar'

export default function Page() {
  return (
    <main className="snap-container">
      <ProgressBar />

      <section id="hero" className="section grid place-items-center px-6">
        <div className="max-w-3xl text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold">
            Alameda County AI Resource Guide
          </h1>
          <p className="text-white/70">
            Chat with Tavus or type to explore local services
          </p>
          <a
            href="#live"
            className="inline-block px-6 py-3 rounded-xl bg-brand text-ink font-semibold"
          >
            Start
          </a>
        </div>
      </section>

      <section id="live" className="section px-6">
        <Console />
      </section>
    </main>
  )
}
