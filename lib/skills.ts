const skillAliases: Record<string, string> = {
  ai: 'AI/ML',
  'artificial intelligence': 'AI/ML',
  'machine learning': 'AI/ML',
  ml: 'AI/ML',
  'machine learning/ai': 'AI/ML',
  'database management systems': 'Databases',
  dbms: 'Databases',
  databases: 'Databases',
  'data structures': 'DSA',
  'data structures and algorithms': 'DSA',
  dsa: 'DSA',
  algorithms: 'DSA',
  web3: 'Blockchain/Web3',
  blockchain: 'Blockchain/Web3',
  'blockchain technology': 'Blockchain/Web3',
  'decentralized finance': 'Blockchain/Web3',
  'ui/ux design': 'UI/UX Design',
  'ui design': 'UI/UX Design',
  'design systems': 'UI/UX Design',
}

function stripRepeatedAbbreviation(value: string) {
  const match = value.match(/^(.+?)\s*\(([^()]+)\)$/)
  if (!match) return value
  const initials = match[1].split(' ').filter(Boolean).map((word) => word[0]).join('')
  return initials.toLowerCase() === match[2].replace(/[^a-z0-9]/gi, '').toLowerCase() ? match[1] : value
}

export function normalizeSkill(tag: string) {
  const collapsed = tag.trim().replace(/\s+/g, ' ')
  const withoutRepeatedAbbreviation = stripRepeatedAbbreviation(collapsed)
  return skillAliases[withoutRepeatedAbbreviation.toLowerCase()] ?? withoutRepeatedAbbreviation
}

export function skillKey(tag: string) {
  return normalizeSkill(tag).toLowerCase()
}