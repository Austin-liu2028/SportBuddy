import type { Activity } from '../types'

type ActivityModalProps = {
  activity: Activity
  joined: boolean
  onClose: () => void
  onJoin: () => void
}

export default function ActivityModal({
  activity,
  joined,
  onClose,
  onJoin,
}: ActivityModalProps) {
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
          <div><span>Date &amp; time</span><strong>{activity.date}, {activity.time}</strong></div>
          <div><span>Location</span><strong>{activity.location}</strong></div>
          <div><span>Skill level</span><strong>{activity.skill}</strong></div>
          <div><span>Distance</span><strong>{activity.distance === 'Nearby' ? 'Near campus' : `${activity.distance} away`}</strong></div>
        </div>
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
          <button className="find-button" onClick={onJoin} disabled={joined || activity.players >= activity.capacity}>
            {joined ? "You're in!" : activity.players >= activity.capacity ? 'Game is full' : 'Join Game'}
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
