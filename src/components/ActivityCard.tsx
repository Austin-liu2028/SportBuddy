import type { Activity } from '../types'
import { activityStatusLabels, getActivityStatus, getActivityTimestampRange } from '../utils/activityStatus'
import Icon, { SportIcon } from './Icon'
import MemberAvatar from './MemberAvatar'
import { useMemberProfiles } from '../context/MemberProfilesContext'
import { memberDisplayName } from '../utils/memberProfiles'

type ActivityCardProps = { activity: Activity; joined: boolean; now: number; showDistance?: boolean; onOpen: (activity: Activity) => void }

export default function ActivityCard({ activity, joined, now, onOpen }: ActivityCardProps) {
  const { profiles, openProfile } = useMemberProfiles()
  const member = activity.ownerUid ? profiles[activity.ownerUid] : undefined
  const name = memberDisplayName(member?.displayName, activity.organizer)
  const full = activity.players >= activity.capacity
  const status = getActivityStatus(activity, now)
  const available = (status === 'upcoming' || status === 'ongoing') && !full
  const spots = Math.max(0, activity.capacity - activity.players)
  const range = getActivityTimestampRange(activity)
  const date = range?.[0].toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) ?? activity.date
  const time = range?.[0].toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) ?? activity.time
  return <article className={`activity-card${joined ? ' activity-card-joined' : ''}`}>
    <div className="activity-card-top"><div className="sport-label"><SportIcon sport={activity.sport} /><span>{activity.sport}</span></div>
      <span className={`activity-status activity-status-${joined ? 'joined' : full && (status === 'upcoming' || status === 'ongoing') ? 'full' : status}`}>
        {joined ? <><Icon name="check" />Joined{status === 'ended' ? ' · Ended' : ''}</> : full && (status === 'upcoming' || status === 'ongoing') ? 'Full' : status === 'upcoming' ? `${spots} ${spots === 1 ? 'spot' : 'spots'} left` : activityStatusLabels[status]}
      </span>
    </div>
    <h3><button className="card-title-button" onClick={() => onOpen(activity)}>{activity.title}</button></h3>
    <div className="activity-details">
      <p className="activity-date-time"><Icon name="calendar" /><span>{date}<span className="detail-separator"> · </span>{time}</span></p>
      <p><Icon name="pin" /><span>{activity.location}</span></p>
    </div>
    <div className="activity-tags"><span className="skill-tag">{activity.skill}</span><span className="player-count"><Icon name="users" />{activity.players}/{activity.capacity} players</span></div>
    <div className="activity-bottom">
      {activity.ownerUid ? <button className="activity-host host-profile-button" onClick={() => openProfile(activity.ownerUid!, name)} aria-label={`View ${name}’s profile`}><MemberAvatar name={name} photoURL={member?.photoURL} /><span><span className="host-caption">Hosted by</span><strong>{name}</strong></span></button>
        : <span className="activity-host"><MemberAvatar name={name} /><span><span className="host-caption">Hosted by</span><strong>{name}</strong></span></span>}
      <button className={`join-button${joined ? ' join-button-done' : !available ? ' join-button-muted' : ''}`} onClick={() => onOpen(activity)} aria-label={`${joined || !available ? 'View' : 'Join'} ${activity.title}`}>
      {joined ? 'View game' : available ? 'Join Game' : 'View details'}<Icon name="arrow" />
    </button></div>
  </article>
}
