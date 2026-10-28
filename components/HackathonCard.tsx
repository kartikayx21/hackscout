'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRight, CalendarDays, MapPin, Trophy, Users } from 'lucide-react'
import type { Hackathon } from '@/data/hackathons'
import styles from '@/app/page.module.css'

function formatDate(value: string | null) {
  if (!value) return 'TBA'
  const formatter = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' })
  const parsed = new Date(`${value}T12:00:00`)
  return Number.isNaN(parsed.getTime()) ? 'TBA' : formatter.format(parsed)
}

function formatDateRange(start: string | null, end: string | null) {
  if (!start || !end) return 'TBA'
  return `${formatDate(start)} — ${formatDate(end)}`
}

function getDaysUntil(deadline: string | null) {
  if (!deadline) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(`${deadline}T00:00:00`)
  return Math.max(0, Math.ceil((target.getTime() - today.getTime()) / 86_400_000))
}

function getElapsedPercent(deadline: string | null, startDate: string | null) {
  if (!deadline || !startDate) return 0
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

function formatPrize(hackathon: Hackathon) {
  if (hackathon.prizeAmountINR !== null) return hackathon.prizeText ?? 'TBA'
  if (!hackathon.prizeText) return 'TBA'
  return hackathon.prizeText.length > 25 ? `${hackathon.prizeText.slice(0, 22)}...` : hackathon.prizeText
}

export function HackathonCard({ hackathon, index = 0 }: { hackathon: Hackathon; index?: number }) {
  const prefersReducedMotion = useReducedMotion()
  const daysRemaining = getDaysUntil(hackathon.registrationDeadline)
  const visibleStack = hackathon.techStack.slice(0, 4)
  const remainingStack = hackathon.techStack.length - visibleStack.length
  const progressPercent = getElapsedPercent(hackathon.registrationDeadline, hackathon.startDate)

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
          {hackathon.mode ?? 'TBA'}
        </span>
      </div>

      <h2 className={styles.cardTitle}>{hackathon.title}</h2>
      <p className={styles.organizer}>{hackathon.organizer ?? 'Organizer TBA'}</p>

      <div className={styles.metaList}>
        <div className={styles.metaRow}><CalendarDays aria-hidden="true" /><span>{formatDateRange(hackathon.startDate, hackathon.endDate)}</span></div>
        <div className={styles.metaRow}><MapPin aria-hidden="true" /><span>{hackathon.location ?? 'TBA'}</span></div>
        <div className={styles.metaRow}><Trophy aria-hidden="true" /><span>Prize pool <strong>{formatPrize(hackathon)}</strong></span></div>
        <div className={styles.metaRow}><Users aria-hidden="true" /><span>Team size <strong>{hackathon.teamSize ?? 'TBA'}</strong></span></div>
      </div>

      <div className={styles.cardDivider} />
      <div className={styles.stackTags} aria-label="Technology stack">
        {visibleStack.map((tag) => <span className={`${styles.stackTag} ${getTagClass(tag)}`} key={tag}>{tag}</span>)}
        {remainingStack > 0 && <span className={`${styles.stackTag} ${styles.tagDefault}`}>+{remainingStack}</span>}
      </div>

      <div className={styles.cardFooter}>
        <div className={styles.deadlineGroup}>
          <span className={styles.deadlineText}>
            {daysRemaining === null ? 'REGISTRATION DEADLINE TBA' : daysRemaining === 0 ? 'REGISTRATION CLOSED' : `REGISTRATION CLOSES IN ${daysRemaining} ${daysRemaining === 1 ? 'DAY' : 'DAYS'}`}
          </span>
          <div className={styles.progressTrack} aria-label={`${progressPercent}% of registration window elapsed`}>
            <span style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
        <a className={styles.detailsButton} href={hackathon.url ?? '#'} target="_blank" rel="noreferrer" aria-label={`View details for ${hackathon.title}`} aria-disabled={!hackathon.url}>
          <span>View Details</span><ArrowUpRight aria-hidden="true" />
        </a>
      </div>
    </motion.article>
  )
}
