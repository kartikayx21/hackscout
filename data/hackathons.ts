export type HackathonMode = 'Online' | 'Offline' | 'Hybrid'

export interface Hackathon {
  id: string
  title: string
  organizer: string
  source: string
  mode: HackathonMode
  startDate: string
  endDate: string
  location: string
  prizePool: string
  teamSize: string
  stack: string[]
  registrationDeadline: string
  isFree: boolean
  url: string
}

export const hackathons: Hackathon[] = [
  {
    id: 'web-data-unlocked',
    title: 'Web Data UNLOCKED',
    organizer: 'Hosted by BrowserUse',
    source: 'DEVFOLIO',
    mode: 'Online',
    startDate: '2026-11-04',
    endDate: '2026-11-06',
    location: 'Online',
    prizePool: '₹2,50,000',
    teamSize: '1–4',
    stack: ['BrowserUse', 'Python', 'AI/ML', 'Next.js'],
    registrationDeadline: '2026-11-01',
    isFree: true,
    url: 'https://devfolio.co/hackathons',
  },
  {
    id: 'lnm-hacks-9',
    title: 'LNM Hacks 9.0',
    organizer: 'Hosted by LNMIIT',
    source: 'DEVFOLIO',
    mode: 'Offline',
    startDate: '2026-11-14',
    endDate: '2026-11-16',
    location: 'Jaipur, India',
    prizePool: '₹3,00,000',
    teamSize: '2–4',
    stack: ['React', 'Node', 'AI/ML', 'Web'],
    registrationDeadline: '2026-11-08',
    isFree: true,
    url: 'https://devfolio.co/hackathons',
  },
  {
    id: 'amity-whack',
    title: 'Amity WHACK',
    organizer: 'Hosted by Amity University',
    source: 'UNSTOP',
    mode: 'Hybrid',
    startDate: '2026-11-21',
    endDate: '2026-11-23',
    location: 'Noida, India',
    prizePool: '₹1,50,000',
    teamSize: '2–5',
    stack: ['AI/ML', 'React', 'Python', 'Data'],
    registrationDeadline: '2026-11-15',
    isFree: false,
    url: 'https://unstop.com/hackathons',
  },
  {
    id: 'skit-techfest',
    title: 'SKIT TechFest Hackathon',
    organizer: 'Hosted by SKIT Jaipur',
    source: 'UNSTOP',
    mode: 'Offline',
    startDate: '2026-11-28',
    endDate: '2026-11-29',
    location: 'Jaipur, India',
    prizePool: '₹1,00,000',
    teamSize: '2–4',
    stack: ['Flutter', 'Python', 'IoT', 'Mobile'],
    registrationDeadline: '2026-11-20',
    isFree: true,
    url: 'https://unstop.com/hackathons',
  },
  {
    id: 'global-build-week',
    title: 'Devfolio Global Build Week',
    organizer: 'Hosted by Devfolio',
    source: 'DEVFOLIO',
    mode: 'Online',
    startDate: '2026-12-04',
    endDate: '2026-12-07',
    location: 'Online · Global',
    prizePool: '$10,000',
    teamSize: '1–5',
    stack: ['Next.js', 'React', 'AI/ML', 'Node'],
    registrationDeadline: '2026-11-28',
    isFree: true,
    url: 'https://devfolio.co/hackathons',
  },
  {
    id: 'mlh-fall-hack-day',
    title: 'MLH Fall Hack Day',
    organizer: 'Hosted by Major League Hacking',
    source: 'MLH',
    mode: 'Online',
    startDate: '2026-11-03',
    endDate: '2026-11-04',
    location: 'Online · Global',
    prizePool: '$5,000',
    teamSize: '1–4',
    stack: ['Python', 'Web', 'AI/ML', 'React'],
    registrationDeadline: '2026-11-03',
    isFree: true,
    url: 'https://mlh.io/seasons/2026/events',
  },
  {
    id: 'chain-reaction',
    title: 'Chain Reaction: Onchain Futures',
    organizer: 'Hosted by ETHGlobal',
    source: 'DEVPOST',
    mode: 'Hybrid',
    startDate: '2026-12-05',
    endDate: '2026-12-07',
    location: 'Bengaluru, India',
    prizePool: '$15,000',
    teamSize: '1–4',
    stack: ['Blockchain', 'Web3', 'Solidity', 'React'],
    registrationDeadline: '2026-11-27',
    isFree: true,
    url: 'https://devpost.com/hackathons',
  },
  {
    id: 'flutter-forward',
    title: 'Flutter Forward Jam',
    organizer: 'Hosted by GDG Cloud Jaipur',
    source: 'UNSTOP',
    mode: 'Offline',
    startDate: '2026-12-12',
    endDate: '2026-12-13',
    location: 'Jaipur, India',
    prizePool: '₹75,000',
    teamSize: '1–3',
    stack: ['Flutter', 'Mobile', 'Firebase', 'Dart'],
    registrationDeadline: '2026-12-04',
    isFree: false,
    url: 'https://unstop.com/hackathons',
  },
]
