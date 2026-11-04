import type { Activity, UserProfile } from '../types'
import { activityStatusLabels, getActivityStatus } from '../utils/activityStatus'
import { getParticipantNames } from '../utils/participantNames'
import { useDialog } from '../hooks/useDialog'

type ActivityModalProps = {
  activity: Activity
  joined: boolean
  organizer: boolean
  submitting: boolean
  now: number
  currentUser?: Pick<UserProfile, 'uid' | 'displayName'>
  error?: string
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
  currentUser,
  error,
  onClose,
  onJoin,
  onLeave,
}: ActivityModalProps) {
  const dialog = useDialog(true, onClose, submitting)

const status = getActivityStatus(activity, now)
const cannotJoin = status === 'ended' || status === 'unavailable'

const contactValue = activity.contact.method === 'Phone'
  ? formatPhoneNumber(activity.contact.value)
  : activity.contact.value

  // Other members' user documents are private. Activity snapshots and the
  // current account provide names without making forbidden profile reads.
  const knownNames: Record<string, string> = {}
  if (currentUser?.uid && currentUser.displayName.trim()) {
    knownNames[currentUser.uid] = currentUser.displayName.trim()
  }
  const { names: displayedParticipantNames, unresolvedCount: unresolvedParticipantCount } =
    getParticipantNames(activity, knownNames)

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (!submitting && event.target === event.currentTarget) onClose()
    }}>
      <section ref={dialog} className="modal-card activity-modal" role="dialog" aria-modal="true" aria-labelledby="activity-modal-title">
        <button className="modal-close" onClick={onClose} disabled={submitting} aria-label="Close activity details">×</button>
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
            <p>{[...displayedParticipantNames, ...(unresolvedParticipantCount ? [`${unresolvedParticipantCount} ${unresolvedParticipantCount === 1 ? 'additional participant' : 'additional participants'}`] : [])].join(' · ') || 'No participant names available'}</p>
            {unresolvedParticipantCount > 0 && <p className="participant-note">Some names aren’t available for this older game.</p>}
          </div>
        </div>
        <p className="activity-description">{activity.description}</p>
        <section className="contact-organizer" aria-labelledby="contact-organizer-title">
          <h3 id="contact-organizer-title">Contact Organizer</h3>
          <p><strong>{activity.contact.method}:</strong> {contactValue}</p>
        </section>
        <div className="modal-actions">
          {error && <p className="form-error" role="alert">{error}</p>}
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
