import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import type { Activity, UserProfile } from '../types'
import { activityStatusLabels, getActivityStatus } from '../utils/activityStatus'
import { getParticipantNames } from '../utils/participantNames'

type ActivityModalProps = {
  activity: Activity
  joined: boolean
  organizer: boolean
  submitting: boolean
  now: number
  currentUser?: Pick<UserProfile, 'uid' | 'displayName'>
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
  onClose,
  onJoin,
  onLeave,
}: ActivityModalProps) {

const status = getActivityStatus(activity, now)
const cannotJoin = status === 'ended' || status === 'unavailable'

const [nameResolution, setNameResolution] = useState<{
  activity: Activity
  currentUser: typeof currentUser
  names: Record<string, string>
  failed: boolean
} | null>(null)
const currentResolution = nameResolution?.activity === activity && nameResolution.currentUser === currentUser
  ? nameResolution : null

const contactValue = activity.contact.method === 'Phone'
  ? formatPhoneNumber(activity.contact.value)
  : activity.contact.value


  useEffect(() => {
    let cancelled = false
    const knownNames: Record<string, string> = {}
    if (currentUser?.uid && currentUser.displayName.trim()) {
      knownNames[currentUser.uid] = currentUser.displayName.trim()
    }
    const participantUids = activity.participantUids ?? []
    const uidsToResolve = participantUids.filter((uid) => uid !== activity.ownerUid && !knownNames[uid])
    if (
      uidsToResolve.length === 0 ||
      getParticipantNames(activity, knownNames).unresolvedCount === 0
    ) {
      return () => { cancelled = true }
    }

    Promise.allSettled(uidsToResolve.map((uid) => getDoc(doc(db, 'users', uid))))
      .then((results) => {
        const names: Record<string, string> = { ...knownNames }
        let failed = false
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            failed = true
            console.error(`Unable to load participant profile ${uidsToResolve[index]}:`, result.reason)
            return
          }

          const displayName = result.value.data()?.displayName
          if (typeof displayName === 'string' && displayName.trim()) {
            names[uidsToResolve[index]] = displayName.trim()
          } else {
            failed = true
            console.warn(`Participant profile ${uidsToResolve[index]} has no display name.`)
          }
        })

        if (!cancelled) {
          setNameResolution({ activity, currentUser, names, failed })
        }
      })

    return () => { cancelled = true }
  }, [activity, currentUser])

  const knownNames = { ...currentResolution?.names }
  if (currentUser?.uid && currentUser.displayName.trim()) {
    knownNames[currentUser.uid] = currentUser.displayName.trim()
  }
  const { names: displayedParticipantNames, unresolvedCount: unresolvedParticipantCount } =
    getParticipantNames(activity, knownNames)

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
            <p>{displayedParticipantNames.join(' · ') || 'Participant names unavailable'}</p>
            {currentResolution?.failed && unresolvedParticipantCount > 0 && (
              <p role="status">
                Names for {unresolvedParticipantCount} {unresolvedParticipantCount === 1 ? 'participant' : 'participants'} could not be loaded.
              </p>
            )}
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
