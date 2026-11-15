'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Check, ChevronDown, Layers3 } from 'lucide-react'
import styles from '@/app/page.module.css'

export type TechStackOption = { label: string; count: number }

export function TechStackDropdown({ options, selected, onChange }: { options: TechStackOption[]; selected: string[]; onChange: (next: string[]) => void }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [showAll, setShowAll] = useState(false)
  const prefersReducedMotion = useReducedMotion()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false)
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  function toggleOption(option: string) {
    onChange(selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option])
  }

  const normalizedQuery = query.trim().toLowerCase()
  const matchingOptions = options.filter((option) => option.label.toLowerCase().includes(normalizedQuery))
  const selectedOptions = matchingOptions.filter((option) => selected.includes(option.label))
  const unselectedOptions = matchingOptions.filter((option) => !selected.includes(option.label))
  const visibleOptions = showAll || normalizedQuery
    ? [...selectedOptions, ...unselectedOptions]
    : [...selectedOptions, ...unselectedOptions.slice(0, Math.max(0, 12 - selectedOptions.length))]
  const hasMoreOptions = !showAll && !normalizedQuery && unselectedOptions.length > Math.max(0, 12 - selectedOptions.length)

  return (
    <div className={styles.stackSelector} ref={containerRef}>
      <button
        className={`${styles.stackTrigger} ${open ? styles.stackTriggerOpen : ''}`}
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Filter by tech stack${selected.length ? `, ${selected.length} selected` : ''}`}
        onClick={() => setOpen((current) => !current)}
      >
        <Layers3 aria-hidden="true" />
        <span>Tech stack{selected.length > 0 ? ` · ${selected.length}` : ''}</span>
        <ChevronDown className={styles.chevron} aria-hidden="true" />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <button className={styles.overlayBackdrop} type="button" aria-label="Close tech stack filter" onClick={() => setOpen(false)} />
            <motion.div
              className={styles.stackPopover}
              role="listbox"
              aria-label="Filter by technology stack"
              aria-multiselectable="true"
              initial={{ opacity: 0, scale: 0.96, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -4 }}
              transition={prefersReducedMotion ? { duration: 0.01 } : { duration: 0.14 }}
            >
              <div className={styles.popoverHeader}>
                <div className={styles.popoverCaption}>TECH STACK</div>
                <button className={styles.mobileDone} type="button" onClick={() => setOpen(false)}>Done</button>
              </div>
              <input className={styles.stackSearch} type="search" placeholder="Search skills" aria-label="Search tech stack" value={query} onChange={(event) => {
                setQuery(event.target.value)
                setShowAll(false)
              }} />
              <div className={styles.stackOptions}>
              {visibleOptions.map((option) => {
                const checked = selected.includes(option.label)
                return (
                  <button
                    className={`${styles.stackOption} ${checked ? styles.stackOptionSelected : ''}`}
                    key={option.label}
                    type="button"
                    role="option"
                    aria-selected={checked}
                    onClick={() => toggleOption(option.label)}
                  >
                    <span className={`${styles.checkbox} ${checked ? styles.checkboxChecked : ''}`}>{checked && <Check aria-hidden="true" />}</span>
                    <span>{option.label}</span>
                    <span className={styles.stackOptionCount}>{option.count}</span>
                  </button>
                )
              })}
              {hasMoreOptions && <button className={styles.stackMore} type="button" onClick={() => setShowAll(true)}>SHOW MORE</button>}
              </div>
              <div className={styles.popoverFooter}>
                <span>{selected.length} SELECTED</span>
                <button type="button" onClick={() => onChange([])}>CLEAR ALL</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
