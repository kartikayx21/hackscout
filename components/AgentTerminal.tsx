'use client'

import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import styles from '@/app/page.module.css'

const logLines = [
  { text: '> launching browser session...', state: 'normal' },
  { text: '> devfolio.co .......... 34 events', state: 'normal' },
  { text: '> unstop.com ........... 41 events', state: 'normal' },
  { text: '> devpost.com .......... 28 events', state: 'normal' },
  { text: '> parsing tech stacks via gemini-flash', state: 'normal' },
  { text: '> 128 events indexed · dashboard synced', state: 'success' },
]

export function AgentTerminal() {
  const [visibleLines, setVisibleLines] = useState(1)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    if (prefersReducedMotion) {
      setVisibleLines(logLines.length)
      return
    }
    const timer = window.setInterval(() => {
      setVisibleLines((current) => current >= logLines.length ? 0 : current + 1)
    }, 880)
    return () => window.clearInterval(timer)
  }, [prefersReducedMotion])

  return (
    <aside className={styles.terminalPanel} aria-label="Agent activity log">
      <div className={styles.terminalHeader}>
        <div className={styles.terminalHeading}>
          <span className={styles.terminalSignal} />
          <span>AGENT STATUS</span>
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
        <span>LAST SWEEP</span><span>04 MIN AGO</span>
      </div>
    </aside>
  )
}
