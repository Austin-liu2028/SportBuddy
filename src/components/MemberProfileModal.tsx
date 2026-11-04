import type { Activity } from '../types'
import { useMemberProfiles } from '../context/MemberProfilesContext'
import { useDialog } from '../hooks/useDialog'
import { compareActivityDates } from '../utils/activityDiscovery'
import { getActivityStatus } from '../utils/activityStatus'
import MemberAvatar from './MemberAvatar'
import ActivityCard from './ActivityCard'
import Icon from './Icon'
import { memberDisplayName } from '../utils/memberProfiles'

type Props = { uid: string; fallbackName: string; activities: Activity[]; joinedIds: string[]; now: number; onClose: () => void; onOpenActivity: (activity: Activity) => void }

export default function MemberProfileModal({ uid, fallbackName, activities, joinedIds, now, onClose, onOpenActivity }: Props) {
  const { profiles, loading, error, retry } = useMemberProfiles()
  const member = profiles[uid]
  const name = memberDisplayName(member?.displayName, fallbackName)
  const dialog = useDialog(true, onClose)
  const hosted = activities.filter(activity => activity.ownerUid === uid).sort((a, b) => compareActivityDates(a, b, now))
  const postedSports = [...new Set(hosted.map(activity => activity.sport))]
  const preferredSports = member?.sports.split(',').map(value => value.trim()).filter(Boolean) ?? []
  const openGames = hosted.filter(activity => ['upcoming', 'ongoing'].includes(getActivityStatus(activity, now)) && activity.players < activity.capacity)
  return <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
    <section ref={dialog} className="modal-card member-profile-modal" role="dialog" aria-modal="true" aria-labelledby="member-profile-title">
      <button className="modal-close" aria-label="Close member profile" onClick={onClose}>×</button>
      <span className="section-eyebrow">MEET YOUR NEXT TEAMMATE</span>
      <div className="member-profile-identity"><MemberAvatar name={name} photoURL={member?.photoURL} className="member-avatar-large" /><div><h2 id="member-profile-title">{name}</h2><p>{hosted.length} {hosted.length === 1 ? 'game' : 'games'} organized · {openGames.length} with open spots</p></div></div>
      {loading && !member && <p className="member-profile-note" role="status">Loading profile…</p>}
      {error && !member && <div className="notice" role="status"><span>{error}</span><button className="retry-button" onClick={retry}>Retry</button></div>}
      {!loading && !error && !member && <p className="member-profile-note">This organizer hasn’t shared more profile details yet. Get to know them through their games below.</p>}
      <div className="member-profile-details">
        <section><h3><Icon name="ball" />{preferredSports.length ? 'Favorite sports' : 'Sports they organize'}</h3><div className="profile-tags">{(preferredSports.length ? preferredSports : postedSports).map(sport => <span key={sport}>{sport}</span>)}</div></section>
        <section><h3><Icon name="users" />Skill levels</h3><p>{member?.skills || 'Not shared yet'}</p></section>
        <section><h3><Icon name="calendar" />Availability</h3><p>{member?.availability || 'Not shared yet'}</p></section>
      </div>
      <div className="member-games-heading"><h3>Games with {name}</h3><p>Open a game for its details and organizer contact information.</p></div>
      {hosted.length ? <div className="host-games-list">{hosted.map(activity => <ActivityCard key={activity.id} activity={activity} joined={joinedIds.includes(activity.id)} now={now} onOpen={onOpenActivity} />)}</div> : <p className="member-profile-note">No posted games yet.</p>}
    </section>
  </div>
}
