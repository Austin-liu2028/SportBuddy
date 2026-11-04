import type { Activity } from '../types'
import { activityStatusLabels, getActivityStatus } from '../utils/activityStatus'

type ActivityModalProps = {
  activity: Activity
  joined: boolean
  organizer: boolean
  submitting: boolean
  now: number
  onClose: () => void
  onJoin: () => void
  onLeave: () => void
}

export default function ActivityModal({
  activity,
  joined,
  organizer,
  submitting,
  now,
  onClose,
  onJoin,
  onLeave,
}: ActivityModalProps) {
  const status = getActivityStatus(activity, now)
  const cannotJoin = status === 'ended' || status === 'unavailable'
  const contactValue = activity.contact.method === 'Phone'
    ? formatPhoneNumber(activity.contact.value)
    : activity.contact.value

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className="modal-card activity-modal" role="dialog" aria-modal="true" aria-labelledby="activity-modal-title">
        <button className="modal-close" onClick={onClose} aria-label="Close activity details">×</button>
        <span className="section-eyebrow">{activity.sport.toUpperCase()} GAME</span>
        <h2 id="activity-modal-title">{activity.title}</h2>
        <p className="modal-organizer">Organized by <strong>{activity.organizer}</strong></p>
        <div className="modal-detail-grid">
          <div className="activity-modal-schedule"><span>Date &amp; time</span><strong>{activity.date}, {activity.time}</strong></div>
          <div>
            <span>Activity status</span>
            <strong className={`activity-status-text activity-status-text-${status}`}>
              {activityStatusLabels[status]}
            </strong>
          </div>
          <div className="activity-modal-location"><span>Location</span><strong>{activity.location}</strong></div>
          <div><span>Skill level</span><strong>{activity.skill}</strong></div>
          <div><span>Distance</span><strong>{activity.distance === 'Nearby' ? 'Near campus' : `${activity.distance} away`}</strong></div>
        </div>
        {status === 'unavailable' && (
          <p className="activity-status-note">
            The full activity date and time range are unavailable, so joining is disabled.
          </p>
        )}
        <div className="modal-player-summary">
          <div><span>Players</span><strong>{activity.players} / {activity.capacity}</strong></div>
          <div className="participant-list">
            <span>Participants</span>
            <p>{activity.participants.join(' · ')}</p>
          </div>
        </div>
        <p className="activity-description">{activity.description}</p>
        <section className="contact-organizer" aria-labelledby="contact-organizer-title">
          <h3 id="contact-organizer-title">Contact Organizer</h3>
          <p><strong>{activity.contact.method}:</strong> {contactValue}</p>
        </section>
        <div className="modal-actions">
          <button
            className={!joined && cannotJoin ? 'find-button activity-action-disabled' : 'find-button'}
            onClick={joined ? onLeave : onJoin}
            disabled={organizer || submitting || (!joined && (activity.players >= activity.capacity || cannotJoin))}
          >
            {organizer
              ? 'Organizer'
              : joined
                ? submitting ? 'Leaving...' : 'Leave Game'
                : status === 'ended'
                  ? 'Activity has ended'
                  : status === 'unavailable'
                    ? 'Schedule unavailable'
                    : activity.players >= activity.capacity
                      ? 'Game is full'
                      : submitting ? 'Joining...' : 'Join Game'}
          </button>
        </div>
      </section>
    </div>
  )
}

function formatPhoneNumber(phone: string) {
  const digits = phone.replace(/\D/g, '')
  const nationalNumber = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits
  if (nationalNumber.length === 10) {
    return `(${nationalNumber.slice(0, 3)}) ${nationalNumber.slice(3, 6)}-${nationalNumber.slice(6)}`
  }
  return phone
}
