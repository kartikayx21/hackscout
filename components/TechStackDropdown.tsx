'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Check, ChevronDown, Layers3 } from 'lucide-react'
import styles from '@/app/page.module.css'

const stackOptions = ['Next.js', 'React', 'Python', 'AI/ML', 'Blockchain', 'Flutter', 'Node', 'Web3']

export function TechStackDropdown({ selected, onChange }: { selected: string[]; onChange: (next: string[]) => void }) {
  const [open, setOpen] = useState(false)
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
            <div className={styles.popoverCaption}>SELECT TECH STACK</div>
            {stackOptions.map((option) => {
              const checked = selected.includes(option)
              return (
                <button
                  className={`${styles.stackOption} ${checked ? styles.stackOptionSelected : ''}`}
                  key={option}
                  type="button"
                  role="option"
                  aria-selected={checked}
                  onClick={() => toggleOption(option)}
                >
                  <span className={`${styles.checkbox} ${checked ? styles.checkboxChecked : ''}`}>{checked && <Check aria-hidden="true" />}</span>
                  <span>{option}</span>
                </button>
              )
            })}
            <div className={styles.popoverFooter}>
              <span>{selected.length} SELECTED</span>
              <button type="button" onClick={() => onChange([])}>CLEAR ALL</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
