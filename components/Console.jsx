'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useAppStore } from '@/lib/store'
import Daily from '@daily-co/daily-js'
import {
  DailyProvider,
  useParticipantIds,
  DailyVideo,
  DailyAudio,
} from '@daily-co/daily-react'
import data from '@/data/resources.alameda.json'

function VideoDock() {
  const ids = useParticipantIds({ filter: 'joined' })
  return (
    <div className="w-full h-[480px] rounded-2xl overflow-hidden border border-white/10 bg-black/50 backdrop-blur">
      <div className="w-full h-full">
        <div key={ids[1]} className="w-full h-full">
          <DailyVideo
            automirror={false}
            sessionId={ids[1]}
            className="w-full h-full object-cover"
          />
          <DailyAudio sessionId={ids[1]} />
        </div>
      </div>
    </div>
  )
}

function detectType(text) {
  const t = (text || '').toLowerCase()
  if (/(food|pantry|grocer|meals|produce|calfresh|bank)/i.test(t)) return 'Food Bank'
  if (/(shelter|housing|bed|navigation|transitional|family shelter)/i.test(t))
    return 'Housing/Shelter'
  if (/(clinic|health|medical|care|vaccin|primary|wellness|dental)/i.test(t))
    return 'Clinic'
  return null
}

export default function Console() {
  const { q, setFilters, results, setResults } = useAppStore()
  const [all, setAll] = useState([])
  const [session, setSession] = useState(null)
  const [loadingCall, setLoadingCall] = useState(false)
  const [err, setErr] = useState('')
  const [highlightedIds, setHighlightedIds] = useState(new Set())
  const [lastPhrase, setLastPhrase] = useState('')
  const [activeType, setActiveType] = useState(null)
  const [callObject, setCallObject] = useState(null)
  const mountedRef = useRef(false)
  const cardRefs = useRef({})
  const [page, setPage] = useState(1)
  const pageSize = 12

  const [agentPicks, setAgentPicks] = useState([])
  const [showAgentOnly, setShowAgentOnly] = useState(false)
  const filteredRef = useRef([])

  useEffect(() => {
    const parsed = data.map(r => {
      const id = r.id || crypto.randomUUID()
      const cat = r.category || ''
      const desc = r.description || ''
      const name = r.name || ''
      const services = r.services_offered || ''
      const docs = r.documents_required || ''
      const intake = r.intake_process || ''
      const elig = r.eligibility || ''
      const derivedNeedsReferral = /referral/i.test([docs, intake, elig].join(' '))
      return {
        id,
        name,
        category: cat,
        description: desc,
        address1: r.address1 || '',
        address2: r.address2 || '',
        city: r.city || '',
        state: r.state || '',
        zip: r.zip || '',
        latitude: r.latitude ? Number(r.latitude) : null,
        longitude: r.longitude ? Number(r.longitude) : null,
        phone: r.phone || '',
        email: r.email || '',
        website: r.website || '',
        hours: r.hours || '',
        intake_process: intake,
        eligibility: elig,
        documents_required: docs,
        languages: r.languages || '',
        accessibility: r.accessibility || '',
        transit: r.transit || '',
        appointment_required: r.appointment_required || '',
        walk_in_ok: r.walk_in_ok || '',
        cost: r.cost || '',
        insurance: r.insurance || '',
        capacity: r.capacity || '',
        services_offered: services,
        notes: r.notes || '',
        last_updated: r.last_updated || '',
        needsReferral: derivedNeedsReferral,
      }
    })
    setAll(parsed)
  }, [])

  const filteredBase = useMemo(() => {
    const kw = q.trim().toLowerCase()
    let base = all.filter(r => {
      if (activeType && r.category !== activeType) return false
      if (!kw) return true
      const blob =
        `${r.name} ${r.description} ${r.category} ${r.services_offered} ${r.address1} ${r.city} ${r.zip}`.toLowerCase()
      return kw.split(/\s+/).every(w => blob.includes(w))
    })
    if (showAgentOnly && agentPicks.length) {
      const pickSet = new Set(agentPicks)
      base = base.filter(r => pickSet.has(r.id))
    }
    return base
  }, [q, all, activeType, showAgentOnly, agentPicks])

  useEffect(() => {
    filteredRef.current = filteredBase
  }, [filteredBase])

  useEffect(() => {
    setResults(filteredBase)
  }, [filteredBase, setResults])

  const totalPages = Math.max(1, Math.ceil(filteredBase.length / pageSize))
  useEffect(() => {
    if (page > totalPages) setPage(1)
  }, [totalPages, page])

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredBase.slice(start, start + pageSize)
  }, [filteredBase, page])

  function matchResourcesByPhrase(phrase, pool) {
    const p = (phrase || '').toLowerCase().trim()
    if (!p) return []
    const scored = pool.map(r => {
      const blob =
        `${r.name} ${r.description} ${r.category} ${r.services_offered}`.toLowerCase()
      let score = 0
      if (blob.includes(p)) score += 6
      p.split(/\s+/).forEach(w => {
        if (!w) return
        if (blob.includes(w)) score += 1
      })
      if (
        /food|grocer|pantry|bank/.test(p) &&
        /food/i.test(r.category + ' ' + r.services_offered)
      )
        score += 2
      if (/shelter|housing|bed/.test(p) && /housing|shelter/i.test(r.category)) score += 2
      if (/clinic|health|medical|care/.test(p) && /clinic|health/i.test(r.category))
        score += 2
      return { id: r.id, score }
    })
    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(s => s.id)
  }

  function firstMatchId(phrase, pool) {
    const ids = matchResourcesByPhrase(phrase, pool)
    return ids[0]
  }

  function tallyCategory(phrases) {
    const counts = {}
    for (const p of phrases) {
      const cat = detectType(p)
      if (!cat) continue
      counts[cat] = (counts[cat] || 0) + 1
    }
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
    return top ? top[0] : null
  }

  function setHighlightsByPhrase(phrase) {
    const ids = matchResourcesByPhrase(phrase, filteredBase)
    setHighlightedIds(new Set(ids))
    if (ids.length) focusHighlighted(ids[0])
  }

  function setHighlightsByName(name) {
    const n = (name || '').toLowerCase()
    const ids = filteredBase
      .filter(r => r.name.toLowerCase().includes(n))
      .map(r => r.id)
      .slice(0, 5)
    setHighlightedIds(new Set(ids))
    if (ids.length) focusHighlighted(ids[0])
  }

  function focusHighlighted(id) {
    const idx = filteredBase.findIndex(r => r.id === id)
    if (idx >= 0) {
      const targetPage = Math.floor(idx / pageSize) + 1
      if (targetPage !== page) setPage(targetPage)
      setTimeout(() => {
        if (cardRefs.current[id]) {
          cardRefs.current[id].scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 50)
    }
  }

  function wireDailyEvents(co) {
    co.on('app-message', ev => {
      const d = ev?.data || {}
      let phrases = []
      if (d.type === 'highlight_resource' && d.name) phrases = [d.name]
      if (d.event_type === 'conversation.utterance' && d.properties?.speech)
        phrases = [d.properties.speech]
      if (d.type === 'tavus.topic' && d.topic) phrases = [d.topic]
      if (d.type === 'tavus.keywords' && Array.isArray(d.keywords)) phrases = d.keywords
      if (!phrases.length) return

      const inferred = tallyCategory(phrases)
      if (inferred) {
        setActiveType(inferred)
        setPage(1)
      }

      const pool = filteredRef.current
      const picks = []
      for (const p of phrases) {
        const id = firstMatchId(p, pool)
        if (id && !picks.includes(id)) picks.push(id)
        if (picks.length >= 3) break
      }
      if (picks.length) {
        setAgentPicks(picks)
        setHighlightedIds(new Set(picks))
        setLastPhrase(phrases[0] || '')
        focusHighlighted(picks[0])
      }
    })
  }

  useEffect(() => {
    if (!session) return
    if (mountedRef.current) return
    mountedRef.current = true
    const co = Daily.createCallObject()
    setCallObject(co)
    wireDailyEvents(co)
    const url = session.conversation_url || session.meeting_url || session.url || ''
    co.join({ url }).catch(() => {})
    return () => {
      mountedRef.current = false
      co.leave().finally(() => co.destroy())
      setCallObject(null)
    }
  }, [session])

  useEffect(() => {
    if (!lastPhrase) return
    setHighlightsByPhrase(lastPhrase)
  }, [lastPhrase, filteredBase])

  async function startConversation() {
    setErr('')
    setLoadingCall(true)
    try {
      const res = await fetch('/api/tavus/conversation', { method: 'POST' })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'Failed to start conversation')
      setSession(j)
      setHighlightedIds(new Set())
      setLastPhrase('')
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoadingCall(false)
    }
  }

  function closeConversation() {
    setLoadingCall(false)
    setErr('')
    setLastPhrase('')
    setSession(null)
    setHighlightedIds(new Set())
    setAgentPicks([])
    setShowAgentOnly(false)
  }

  return (
    <DailyProvider callObject={callObject}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="pt-6 pb-4">
          <div className="flex items-center gap-2">
            <input
              className="rounded-xl bg-white/10 px-4 py-2 flex-1 outline-none"
              placeholder="Search..."
              value={q}
              onChange={e => {
                setFilters({ q: e.target.value })
                setPage(1)
              }}
            />
            <button
              onClick={startConversation}
              disabled={loadingCall || !!session}
              className="px-4 py-2 rounded-xl bg-brand text-ink font-semibold"
            >
              {loadingCall ? 'Starting...' : session ? 'Connected' : 'Use Video'}
            </button>
            {!!session && (
              <button
                onClick={closeConversation}
                disabled={loadingCall}
                className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                  loadingCall
                    ? 'bg-white/10 text-white/50 cursor-not-allowed'
                    : 'bg-red-500/90 hover:bg-red-500 text-white shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                {loadingCall ? 'Closing...' : 'Close Video'}
              </button>
            )}
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="text-white/60">Filter:</span>
            <button
              className={
                'px-2 py-1 rounded-lg ' + (!activeType ? 'bg-white/20' : 'bg-white/10')
              }
              onClick={() => {
                setActiveType(null)
                setPage(1)
              }}
            >
              All
            </button>
            <button
              className={
                'px-2 py-1 rounded-lg ' +
                (activeType === 'Food Bank' ? 'bg-white/20' : 'bg-white/10')
              }
              onClick={() => {
                setActiveType('Food Bank')
                setPage(1)
              }}
            >
              Food
            </button>
            <button
              className={
                'px-2 py-1 rounded-lg ' +
                (activeType === 'Housing/Shelter' ? 'bg-white/20' : 'bg-white/10')
              }
              onClick={() => {
                setActiveType('Housing/Shelter')
                setPage(1)
              }}
            >
              Housing/Shelter
            </button>
            <button
              className={
                'px-2 py-1 rounded-lg ' +
                (activeType === 'Clinic' ? 'bg-white/20' : 'bg-white/10')
              }
              onClick={() => {
                setActiveType('Clinic')
                setPage(1)
              }}
            >
              Clinics
            </button>
            {err && <span className="text-red-400 ml-2">{err}</span>}
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-4 items-start">
          <div>
            <div className="grid gap-3">
              {paginated.map(r => {
                const isHighlighted = highlightedIds.has(r.id)
                return (
                  <div
                    key={r.id}
                    ref={el => (cardRefs.current[r.id] = el)}
                    data-result-id={r.id}
                    className={
                      'rounded-2xl p-4 bg-white/5 border transition-all ' +
                      (isHighlighted
                        ? 'border-[#2ED2C9] ring-2 ring-[#2ED2C9]/50 scale-[1.01]'
                        : 'border-white/10')
                    }
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-base font-semibold">{r.name}</div>
                        <div className="mt-1 text-xs text-white/60">{r.category}</div>
                      </div>
                      <a
                        href={r.website || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20"
                      >
                        Website
                      </a>
                    </div>
                    <p className="mt-2 text-sm text-white/80">{r.description}</p>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      <div className="flex flex-col">
                        <span className="text-white/60">Address</span>
                        <span>{[r.address1, r.address2].filter(Boolean).join(', ')}</span>
                        <span>{[r.city, r.state, r.zip].filter(Boolean).join(', ')}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-white/60">Hours</span>
                        <span>{r.hours || 'See website'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-white/60">Contact</span>
                        <span>{r.phone || 'N/A'}</span>
                        <span className="truncate">{r.email || ''}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-white/60">Services</span>
                        <span className="truncate">{r.services_offered || '—'}</span>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-[10px]">
                      {r.cost ? (
                        <span className="px-2 py-1 rounded bg-white/10">{r.cost}</span>
                      ) : null}
                      {r.languages ? (
                        <span className="px-2 py-1 rounded bg-white/10">
                          {r.languages}
                        </span>
                      ) : null}
                      {r.appointment_required ? (
                        <span className="px-2 py-1 rounded bg-white/10">
                          Appt: {r.appointment_required}
                        </span>
                      ) : null}
                      {r.walk_in_ok ? (
                        <span className="px-2 py-1 rounded bg-white/10">
                          Walk-in: {r.walk_in_ok}
                        </span>
                      ) : null}
                      {r.capacity ? (
                        <span className="px-2 py-1 rounded bg-white/10">
                          {r.capacity}
                        </span>
                      ) : null}
                      {r.transit ? (
                        <span className="px-2 py-1 rounded bg-white/10">{r.transit}</span>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-white/60">
                Showing {(page - 1) * pageSize + 1}-
                {Math.min(page * pageSize, filteredBase.length)} of {filteredBase.length}
                {activeType ? ` • ${activeType}` : ''}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-2 rounded-lg bg-white/10 disabled:opacity-40"
                >
                  Prev
                </button>
                <span className="px-2 py-2 text-sm">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-2 rounded-lg bg-white/10 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          <div className="lg:sticky lg:top-28">
            {session ? (
              <VideoDock />
            ) : (
              <div className="w-full h-[480px] rounded-2xl border border-white/10 bg-white/5 grid place-items-center text-white/60">
                Start Video to talk with Tavus
              </div>
            )}
          </div>
        </div>
      </div>
    </DailyProvider>
  )
}
