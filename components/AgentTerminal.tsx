'use client'

import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { Hackathon } from '@/data/hackathons'
import styles from '@/app/page.module.css'

type LogLine = { text: string; state: 'normal' | 'success' }

export function AgentTerminal({ hackathons }: { hackathons: Hackathon[] }) {
  const [visibleLines, setVisibleLines] = useState(1)
  const prefersReducedMotion = useReducedMotion()
  const sourceCounts = hackathons.reduce<Record<string, number>>((counts, hackathon) => {
    counts[hackathon.source] = (counts[hackathon.source] ?? 0) + 1
    return counts
  }, {})
  const logLines: LogLine[] = [
    { text: '> fetching public sources...', state: 'normal' },
    ...Object.entries(sourceCounts).map(([source, count]) => ({
      text: `> ${source.toLowerCase()} .......... ${count} events`,
      state: 'normal' as const,
    })),
    { text: `> ${hackathons.length} events indexed · dashboard synced`, state: 'success' },
  ]
  const scrapedAt = hackathons.find((hackathon) => hackathon.scrapedAt)?.scrapedAt
  const lastSweep = scrapedAt ? new Date(scrapedAt).toLocaleString() : 'TBA'

  useEffect(() => {
    if (prefersReducedMotion) {
      setVisibleLines(logLines.length)
      return
    }
    const timer = window.setInterval(() => {
      setVisibleLines((current) => current >= logLines.length ? 0 : current + 1)
    }, 880)
    return () => window.clearInterval(timer)
  }, [logLines.length, prefersReducedMotion])

  return (
    <aside className={styles.terminalPanel} aria-label="Pipeline status">
      <div className={styles.terminalHeader}>
        <div className={styles.terminalHeading}>
          <span className={styles.terminalSignal} />
          <span>PIPELINE STATUS</span>
        </div>
        <span className={styles.terminalRegion}>REGION: AP-SOUTH-1</span>
      </div>
      <div className={styles.terminalBody} aria-live="polite" aria-atomic="true">
        {logLines.slice(0, visibleLines).map((line, index) => (
          <motion.p
            className={`${styles.logLine} ${line.state === 'success' ? styles.logSuccess : ''}`}
            key={`${visibleLines}-${index}`}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={prefersReducedMotion ? { duration: 0.01 } : { duration: 0.22 }}
          >
            {line.text}
          </motion.p>
        ))}
        <span className={styles.terminalCaret} aria-hidden="true" />
      </div>
      <div className={styles.terminalFooter}>
        <span>LAST SWEEP</span><span>{lastSweep}</span>
      </div>
    </aside>
  )
}
