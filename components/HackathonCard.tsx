'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRight, CalendarDays, MapPin, Trophy, Users } from 'lucide-react'
import type { Hackathon } from '@/data/hackathons'
import styles from '@/app/page.module.css'

function formatDateRange(start: string, end: string) {
  const formatter = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' })
  return `${formatter.format(new Date(`${start}T12:00:00`))} — ${formatter.format(new Date(`${end}T12:00:00`))}`
}

function getDaysUntil(deadline: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(`${deadline}T00:00:00`)
  return Math.max(0, Math.ceil((target.getTime() - today.getTime()) / 86_400_000))
}

function getElapsedPercent(deadline: string, startDate: string) {
  const start = new Date(`${startDate}T00:00:00`).getTime()
  const end = new Date(`${deadline}T00:00:00`).getTime()
  const now = Date.now()
  if (now >= end) return 100
  if (now <= start) return 24
  return Math.min(92, Math.max(24, Math.round(((now - start) / (end - start)) * 100)))
}

function getTagClass(tag: string) {
  const normalized = tag.toLowerCase()
  if (/ai|ml|python|browseruse/.test(normalized)) return styles.tagAi
  if (/web|react|next|node/.test(normalized)) return styles.tagWeb
  if (/flutter|mobile|dart/.test(normalized)) return styles.tagMobile
  if (/data|firebase|iot/.test(normalized)) return styles.tagData
  if (/blockchain|web3|solidity/.test(normalized)) return styles.tagBlockchain
  return styles.tagDefault
}

export function HackathonCard({ hackathon, index = 0 }: { hackathon: Hackathon; index?: number }) {
  const prefersReducedMotion = useReducedMotion()
  const daysRemaining = getDaysUntil(hackathon.registrationDeadline)
  const visibleStack = hackathon.stack.slice(0, 4)
  const remainingStack = hackathon.stack.length - visibleStack.length

  return (
    <motion.article
      className={styles.eventCard}
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10, scale: 0.98 }}
      transition={prefersReducedMotion ? { duration: 0.01 } : { type: 'spring', stiffness: 300, damping: 24, delay: index * 0.06 }}
      whileHover={prefersReducedMotion ? undefined : { y: -6 }}
      onMouseMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect()
        event.currentTarget.style.setProperty('--mx', `${event.clientX - bounds.left}px`)
        event.currentTarget.style.setProperty('--my', `${event.clientY - bounds.top}px`)
      }}
    >
      <div className={styles.cardTopline}>
        <span className={styles.sourceLabel}>{hackathon.source}</span>
        <span className={`${styles.modeBadge} ${hackathon.mode === 'Online' ? styles.modeOnline : hackathon.mode === 'Hybrid' ? styles.modeHybrid : ''}`}>
          <span className={styles.modeDot} />
          {hackathon.mode}
        </span>
      </div>

      <h2 className={styles.cardTitle}>{hackathon.title}</h2>
      <p className={styles.organizer}>{hackathon.organizer}</p>

      <div className={styles.metaList}>
        <div className={styles.metaRow}><CalendarDays aria-hidden="true" /><span>{formatDateRange(hackathon.startDate, hackathon.endDate)}</span></div>
        <div className={styles.metaRow}><MapPin aria-hidden="true" /><span>{hackathon.location}</span></div>
        <div className={styles.metaRow}><Trophy aria-hidden="true" /><span>Prize pool <strong>{hackathon.prizePool}</strong></span></div>
        <div className={styles.metaRow}><Users aria-hidden="true" /><span>Team size <strong>{hackathon.teamSize}</strong></span></div>
      </div>

      <div className={styles.cardDivider} />
      <div className={styles.stackTags} aria-label="Technology stack">
        {visibleStack.map((tag) => <span className={`${styles.stackTag} ${getTagClass(tag)}`} key={tag}>{tag}</span>)}
        {remainingStack > 0 && <span className={`${styles.stackTag} ${styles.tagDefault}`}>+{remainingStack}</span>}
      </div>

      <div className={styles.cardFooter}>
        <div className={styles.deadlineGroup}>
          <span className={styles.deadlineText}>
            {daysRemaining === 0 ? 'REGISTRATION CLOSED' : `REGISTRATION CLOSES IN ${daysRemaining} ${daysRemaining === 1 ? 'DAY' : 'DAYS'}`}
          </span>
          <div className={styles.progressTrack} aria-label={`${getElapsedPercent(hackathon.registrationDeadline, hackathon.startDate)}% of registration window elapsed`}>
            <span style={{ width: `${getElapsedPercent(hackathon.registrationDeadline, hackathon.startDate)}%` }} />
          </div>
        </div>
        <a className={styles.detailsButton} href={hackathon.url} target="_blank" rel="noreferrer" aria-label={`View details for ${hackathon.title}`}>
          <span>View Details</span><ArrowUpRight aria-hidden="true" />
        </a>
      </div>
    </motion.article>
  )
}
