import type { ActivityHost } from '../utils/partners'
import Icon from './Icon'
import MemberAvatar from './MemberAvatar'
import { useMemberProfiles } from '../context/MemberProfilesContext'
import { memberDisplayName } from '../utils/memberProfiles'

export default function PartnerCard({ partner, onView }: { partner: ActivityHost; onView: (partner: ActivityHost) => void }) {
  const { profiles } = useMemberProfiles()
  const member = profiles[partner.id]
  const name = memberDisplayName(member?.displayName, partner.name)
  return <article className="partner-card">
    <h3><button className="partner-profile-button" onClick={() => onView(partner)} aria-label={`View ${name}’s profile`}><MemberAvatar name={name} photoURL={member?.photoURL} className="member-avatar-medium" /><span><strong>{name}</strong><span className="partner-subtitle">Campus game organizer</span></span></button></h3>
    <div className="profile-tags">{partner.sports.map(sport => <span key={sport}>{sport}</span>)}</div>
    <p className="partner-availability"><Icon name="calendar" />{partner.openGames ? `${partner.openGames} ${partner.openGames === 1 ? 'game' : 'games'} with open spots` : 'No open games right now'}</p>
    <button className="outline-button" onClick={() => onView(partner)}>View profile<Icon name="arrow" /></button>
  </article>
}
