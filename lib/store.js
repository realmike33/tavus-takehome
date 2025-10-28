'use client'
import { create } from 'zustand'

export const useAppStore = create((set, get) => ({
  q: '',
  category: 'all',
  needsReferral: false,
  setFilters: f => set(f),

  results: [],
  bookmarks: new Set(),
  setResults: r => set({ results: r }),
  toggleBookmark: id => {
    const b = new Set(get().bookmarks)
    b.has(id) ? b.delete(id) : b.add(id)
    set({ bookmarks: b })
    if (typeof window !== 'undefined')
      localStorage.setItem('bwz_bookmarks', JSON.stringify([...b]))
  },

  askHistory: [],
  setAskEntry: entry => {
    const list = [entry, ...get().askHistory].slice(0, 10)
    set({ askHistory: list })
    if (typeof window !== 'undefined')
      localStorage.setItem('bwz_asks', JSON.stringify(list))
  },

  lang: 'en',
  setLang: lang => {
    set({ lang })
    if (typeof window !== 'undefined') localStorage.setItem('bwz_lang', lang)
  },
  reducedMotion: false,
  setReducedMotion: v => {
    set({ reducedMotion: v })
    if (typeof window !== 'undefined')
      localStorage.setItem('bwz_reduced_motion', JSON.stringify(v))
  },

  hydrate: () => {
    if (typeof window === 'undefined') return
    const b = JSON.parse(localStorage.getItem('bwz_bookmarks') || '[]')
    const a = JSON.parse(localStorage.getItem('bwz_asks') || '[]')
    const lang = localStorage.getItem('bwz_lang') || 'en'
    const rm = JSON.parse(localStorage.getItem('bwz_reduced_motion') || 'false')
    set({ bookmarks: new Set(b), askHistory: a, lang, reducedMotion: rm })
  },
}))
