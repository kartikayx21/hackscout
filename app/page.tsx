'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowDownRight, ArrowUpRight, Menu, Search, SlidersHorizontal, X } from 'lucide-react'
import { AgentTerminal } from '@/components/AgentTerminal'
import { HackathonCard } from '@/components/HackathonCard'
import { TechStackDropdown } from '@/components/TechStackDropdown'
import { hackathons } from '@/data/hackathons'
import styles from './page.module.css'

type Filter = 'All' | 'Online' | 'Offline' | 'This Week' | 'Free Entry'
const filters: Filter[] = ['All', 'Online', 'Offline', 'This Week', 'Free Entry']

export default function Page() {
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<Filter>('All')
  const [selectedStacks, setSelectedStacks] = useState<string[]>([])
  const [menuOpen, setMenuOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      const isTyping = target?.matches('input, textarea, select, [contenteditable="true"]')
      if (event.key === '/' && !isTyping && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  const filteredHackathons = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const weekLimit = new Date(today)
    weekLimit.setDate(weekLimit.getDate() + 7)
    weekLimit.setHours(23, 59, 59, 999)

    return hackathons.filter((hackathon) => {
      const searchable = [hackathon.title, hackathon.organizer, hackathon.source, hackathon.location, ...hackathon.stack].join(' ').toLowerCase()
      const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery)
      const matchesFilter = activeFilter === 'All'
        || (activeFilter === 'Online' && hackathon.mode === 'Online')
        || (activeFilter === 'Offline' && hackathon.mode === 'Offline')
        || (activeFilter === 'This Week' && new Date(`${hackathon.startDate}T00:00:00`) <= weekLimit && new Date(`${hackathon.startDate}T00:00:00`) >= today)
        || (activeFilter === 'Free Entry' && hackathon.isFree)
      const matchesStacks = selectedStacks.length === 0 || selectedStacks.some((stack) => hackathon.stack.some((item) => item.toLowerCase() === stack.toLowerCase()))
      return matchesQuery && matchesFilter && matchesStacks
    })
  }, [activeFilter, query, selectedStacks])

  function clearFilters() {
    setQuery('')
    setActiveFilter('All')
    setSelectedStacks([])
  }

  return (
    <div className={styles.appShell}>
      <header className={styles.siteHeader}>
        <div className={styles.headerInner}>
          <a className={styles.brand} href="#top" aria-label="HackScout home">
            <svg className={styles.brandMark} width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <circle cx="14" cy="14" r="9.5" stroke="currentColor" strokeOpacity=".54" />
              <circle cx="14" cy="14" r="4" stroke="currentColor" />
              <path d="M14 1.5v6M14 20.5v6M1.5 14h6m13 0h6" stroke="currentColor" strokeLinecap="round" />
              <circle cx="14" cy="14" r="1.2" fill="currentColor" />
            </svg>
            <span>HackScout</span>
          </a>

          <nav className={`${styles.mainNav} ${menuOpen ? styles.mainNavOpen : ''}`} aria-label="Main navigation">
            <a href="#explore" onClick={() => setMenuOpen(false)}>EXPLORE</a>
            <a href="#sources" onClick={() => setMenuOpen(false)}>SOURCES</a>
            <a href="#agent-log" onClick={() => setMenuOpen(false)}>AGENT LOG</a>
          </nav>

          <div className={styles.headerRight}>
            <span className={styles.onlinePill}><span className={styles.liveDot} />AGENT ONLINE</span>
            <button className={styles.menuToggle} type="button" aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
              {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            </button>
          </div>
        </div>
      </header>

      <main id="top" className={styles.mainContent}>
        <section className={styles.hero} aria-labelledby="hero-heading">
          <div className={styles.heroCopy}>
            <div className={styles.eyebrow}><span className={styles.eyebrowRule} />AUTONOMOUS HACKATHON INTELLIGENCE</div>
            <h1 id="hero-heading">Discover Your<br /><span className={styles.headlineAccent}>Next Build.</span></h1>
            <p className={styles.heroDescription}>One agent scans the platforms, sorts the signal, and brings your next good problem into view.</p>
            <div className={styles.searchControls}>
              <div className={styles.searchBar}>
                <Search aria-hidden="true" />
                <input ref={searchRef} aria-label="Search hackathons" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search hackathons, e.g. ‘AI’, ‘Jaipur’, ‘Next.js’" />
                {query && <button className={styles.clearSearch} type="button" onClick={() => setQuery('')} aria-label="Clear search"><X aria-hidden="true" /></button>}
                <kbd>/</kbd>
              </div>
              <TechStackDropdown selected={selectedStacks} onChange={setSelectedStacks} />
            </div>
            <div className={styles.sourceLine} id="sources">
              <span>SCANNING</span><span>DEVFOLIO</span><i /> <span>UNSTOP</span><i /> <span>DEVPOST</span><i /> <span>MLH</span>
            </div>
          </div>
          <div id="agent-log" className={styles.heroTerminal}><AgentTerminal /></div>
        </section>

        <section className={styles.exploreSection} id="explore" aria-label="Explore hackathons">
          <div className={styles.sectionHeading}>
            <div>
              <span className={styles.sectionKicker}>THE SCOUT BOARD <span>—</span> 01</span>
              <h2>Worth building for.</h2>
            </div>
            <p className={styles.indexedNote}><span className={styles.tinyLiveDot} />128 EVENTS INDEXED ACROSS 4 SOURCES</p>
          </div>

          <div className={styles.filterRow}>
            <div className={styles.filterChips} role="group" aria-label="Filter events">
              {filters.map((filter) => (
                <button className={`${styles.filterChip} ${activeFilter === filter ? styles.filterChipActive : ''}`} key={filter} type="button" aria-pressed={activeFilter === filter} onClick={() => setActiveFilter(filter)}>
                  {filter === 'This Week' && <SlidersHorizontal aria-hidden="true" />}{filter}
                </button>
              ))}
            </div>
            <div className={styles.resultCount} aria-live="polite"><span>{String(filteredHackathons.length).padStart(2, '0')}</span> RESULTS</div>
          </div>

          <motion.div className={styles.eventGrid} layout transition={prefersReducedMotion ? { duration: 0.01 } : { type: 'spring', stiffness: 300, damping: 28 }}>
            <AnimatePresence mode="popLayout">
              {filteredHackathons.map((hackathon, index) => (
                <motion.div className={styles.cardSlot} key={hackathon.id} layout transition={prefersReducedMotion ? { duration: 0.01 } : { type: 'spring', stiffness: 300, damping: 28 }}>
                  <HackathonCard hackathon={hackathon} index={index} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {filteredHackathons.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyGlyph}><Search aria-hidden="true" /></div>
              <span className={styles.emptyKicker}>NO MATCHES FOUND</span>
              <h3>Nothing on this frequency.</h3>
              <p>Try a different search or loosen your stack filters.</p>
              <button className={styles.clearFiltersButton} type="button" onClick={clearFilters}>Clear filters <ArrowUpRight aria-hidden="true" /></button>
            </div>
          )}
        </section>

        <section className={styles.bottomNote} aria-label="Index update">
          <span className={styles.bottomLine} />
          <p><ArrowDownRight aria-hidden="true" /> The list moves as the agent finds new signals.</p>
          <span className={styles.bottomTimestamp}>NEXT SWEEP IN 11 MIN</span>
        </section>
      </main>

      <footer className={styles.siteFooter}>
        <span>HACKSCOUT <span className={styles.footerDot}>·</span> BUILT IN 3 HOURS <span className={styles.footerDot}>·</span> POWERED BY BROWSERUSE + GEMINI</span>
        <a href="#top" aria-label="Back to top">BACK TO TOP <ArrowUpRight aria-hidden="true" /></a>
      </footer>
    </div>
  )
}
