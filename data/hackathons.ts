export type HackathonMode = 'Online' | 'Offline' | 'Hybrid'

export interface Hackathon {
  id: string
  title: string
  organizer: string | null
  source: string
  url: string | null
  mode: HackathonMode | null
  location: string | null
  city: string | null
  state: string | null
  startDate: string | null
  endDate: string | null
  registrationDeadline: string | null
  prizeText: string | null
  prizeAmountINR: number | null
  teamSize: string | null
  techStack: string[]
  hasInternship: boolean | null
  perks: string[]
  isFree: boolean | null
  scrapedAt: string | null
}
