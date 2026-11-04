import type { ActivityHost } from '../utils/partners'
import Icon from './Icon'

export default function PartnerCard({ partner, onView }: { partner: ActivityHost; onView: (partner: ActivityHost) => void }) {
  const initials = partner.name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase()
  return <article className="partner-card">
    <div className="partner-card-heading"><div className="avatar">{initials}</div><div><h3>{partner.name}</h3><p>Campus game organizer</p></div></div>
    <div className="profile-tags">{partner.sports.map(sport => <span key={sport}>{sport}</span>)}</div>
    <p className="partner-availability"><Icon name="calendar" />{partner.openGames ? `${partner.openGames} ${partner.openGames === 1 ? 'game' : 'games'} with open spots` : 'No open games right now'}</p>
    <button className="outline-button" onClick={() => onView(partner)}>View games<Icon name="arrow" /></button>
  </article>
}
