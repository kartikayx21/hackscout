'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRight, CalendarDays, CalendarPlus, MapPin, Trophy, Users } from 'lucide-react'
import type { Hackathon } from '@/data/hackathons'
import styles from '@/app/page.module.css'

function formatDate(value: string | null) {
  if (!value) return 'TBA'
  const formatter = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' })
  const parsed = new Date(`${value}T12:00:00`)
  return Number.isNaN(parsed.getTime()) ? 'TBA' : formatter.format(parsed)
}

function formatDateRange(start: string | null, end: string | null) {
  if (!start && end) return `Ends ${formatDate(end)}`
  if (!start || !end) return 'TBA'
  return `${formatDate(start)} — ${formatDate(end)}`
}

function isDeadlineClosed(deadline: string | null) {
  if (!deadline) return false
  return new Date(`${deadline}T00:00:00`).getTime() < Date.now()
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

function formatCalendarDate(value: string) {
  return value.replaceAll('-', '')
}

function nextCalendarDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  const next = new Date(year, month - 1, day + 1)
  return [
    next.getFullYear(),
    String(next.getMonth() + 1).padStart(2, '0'),
    String(next.getDate()).padStart(2, '0'),
  ].join('')
}

function getCalendarHref(hackathon: Hackathon) {
  const start = hackathon.startDate ?? hackathon.registrationDeadline
  if (!start) return null
  const end = hackathon.startDate ? (hackathon.endDate ?? hackathon.startDate) : start
  const title = hackathon.startDate ? hackathon.title : `Registration closes: ${hackathon.title}`
  const details = [hackathon.organizer, hackathon.url].filter(Boolean).join('\n')
  const dates = `${formatCalendarDate(start)}/${nextCalendarDate(end)}`
  const params = [
    `action=TEMPLATE`,
    `text=${encodeURIComponent(title)}`,
    `dates=${dates}`,
    `details=${encodeURIComponent(details)}`,
    `location=${encodeURIComponent(hackathon.location ?? '')}`,
  ]
  return `https://calendar.google.com/calendar/render?${params.join('&')}`
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
  const isRegistrationClosed = isDeadlineClosed(hackathon.registrationDeadline)
  const uniqueTechStack = hackathon.techStack.filter((tag, index, techStack) => (
    techStack.findIndex((candidate) => candidate.toLowerCase() === tag.toLowerCase()) === index
  ))
  const visibleStack = uniqueTechStack.slice(0, 4)
  const remainingStack = uniqueTechStack.length - visibleStack.length
  const progressPercent = getElapsedPercent(hackathon.registrationDeadline, hackathon.startDate)
  const hasValidUrl = /^https?:\/\//.test(hackathon.url ?? '')
  const calendarHref = getCalendarHref(hackathon)

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
      {hackathon.organizer && <p className={styles.organizer}>{hackathon.organizer}</p>}

      <div className={styles.metaList}>
        <div className={styles.metaRow}><CalendarDays aria-hidden="true" /><span>{formatDateRange(hackathon.startDate, hackathon.endDate)}</span></div>
        <div className={styles.metaRow}><MapPin aria-hidden="true" /><span>{hackathon.location ?? 'TBA'}</span></div>
        <div className={styles.metaRow}><Trophy aria-hidden="true" /><span>Prize pool <strong>{formatPrize(hackathon)}</strong></span></div>
        <div className={styles.metaRow}><Users aria-hidden="true" /><span>Team size <strong>{hackathon.teamSize ?? 'TBA'}</strong></span></div>
      </div>

      <div className={styles.cardDivider} />
      <div className={styles.stackTags} aria-label="Technology stack">
        {visibleStack.map((tag, index) => <span className={`${styles.stackTag} ${getTagClass(tag)}`} key={`${tag}-${index}`}>{tag}</span>)}
        {remainingStack > 0 && <span className={`${styles.stackTag} ${styles.tagDefault}`}>+{remainingStack}</span>}
      </div>

      <div className={styles.cardFooter}>
        <div className={styles.deadlineGroup}>
          <span className={styles.deadlineText}>
            {daysRemaining === null ? 'REGISTRATION DEADLINE TBA' : isRegistrationClosed ? 'REGISTRATION CLOSED' : `REGISTRATION CLOSES IN ${daysRemaining} ${daysRemaining === 1 ? 'DAY' : 'DAYS'}`}
          </span>
          <div className={styles.progressTrack} aria-label={`${progressPercent}% of registration window elapsed`}>
            <span style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
        <div className={styles.cardActions}>
          {calendarHref && (
            <a className={styles.detailsButton} href={calendarHref} target="_blank" rel="noopener noreferrer" aria-label={`Add ${hackathon.title} to Google Calendar`}>
              <span>Add to Calendar</span><CalendarPlus aria-hidden="true" />
            </a>
          )}
          {hasValidUrl ? (
            <a className={styles.detailsButton} href={hackathon.url!} target="_blank" rel="noopener noreferrer" aria-label={`View details for ${hackathon.title}`}>
              <span>View Details</span><ArrowUpRight aria-hidden="true" />
            </a>
          ) : (
            <button type="button" className={styles.detailsButton} disabled aria-label={`Details unavailable for ${hackathon.title}`}>
              <span>Details Unavailable</span><ArrowUpRight aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </motion.article>
  )
}
