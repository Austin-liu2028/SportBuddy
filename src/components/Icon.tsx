type IconName = 'search' | 'menu' | 'close' | 'plus' | 'arrow' | 'calendar' | 'pin' | 'users' | 'check' | 'clock' | 'ball' | 'racket' | 'run' | 'cycle' | 'wave' | 'gym' | 'chevron'

const paths: Record<IconName, React.ReactNode> = {
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></>,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
  chevron: <path d="m6 9 6 6 6-6" />,
  calendar: <><rect x="4" y="5" width="16" height="16" rx="3" /><path d="M8 3v4m8-4v4M4 10h16m-12 4h2m4 0h2m-8 3h2" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
  users: <><circle cx="9" cy="8" r="3" /><path d="M3 21v-2a6 6 0 0 1 12 0v2m1-16a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 4v2" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  ball: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3v18M5.6 5.6a9 9 0 0 1 0 12.8m12.8-12.8a9 9 0 0 0 0 12.8" /></>,
  racket: <><ellipse cx="14" cy="9" rx="6" ry="7" transform="rotate(35 14 9)" /><path d="m10 15-6 7m6-16 7 7m-7-3 6-6" /></>,
  run: <><circle cx="16" cy="4" r="2" /><path d="m6 10 5-3 4 3 5 1m-8-3-3 7 5 2 1 5M9 15l-3 6H2" /></>,
  cycle: <><circle cx="5" cy="17" r="4" /><circle cx="19" cy="17" r="4" /><path d="m5 17 5-9 5 9H5m10-12h3l3 12M8 8h5" /></>,
  wave: <><path d="M2 14c3-4 4 4 8 0s5 4 9 0m-17 5c3-4 4 4 8 0s5 4 9 0M5 8l5-4 5 5 4 1" /><circle cx="18" cy="5" r="2" /></>,
  gym: <><path d="M7 12h10M4 7v10m3-12v14M17 5v14m3-12v10" /></>,
}

export default function Icon({ name, className = '' }: { name: IconName; className?: string }) {
  return <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

export function SportIcon({ sport }: { sport: string }) {
  const name: IconName = /tennis|badminton|pickleball|squash|racquetball/i.test(sport) ? 'racket'
    : /running|yoga|climbing/i.test(sport) ? 'run' : /cycling/i.test(sport) ? 'cycle'
      : /swimming/i.test(sport) ? 'wave' : /gym/i.test(sport) ? 'gym' : 'ball'
  return <span className={`sport-icon sport-tone-${name}`}><Icon name={name} /></span>
}
