import type { Activity, Sport } from '../types'
import { activityStatusLabels, getActivityStatus } from '../utils/activityStatus'

function ActivityIcon({ sport }: { sport: Sport }) {
  const icon = sport === 'Basketball' ? '◉' : sport === 'Running' ? '↗' : sport === 'Swimming' ? '≈' : sport === 'Gym' ? '✣' : sport === 'Cycling' ? '◌' : sport === 'Soccer' || sport === 'Ultimate Frisbee' || sport === 'Flag Football' ? '⬡' : '✳'
  return <span className={`sport-icon sport-icon-${sport.toLowerCase().replaceAll(' ', '-')}`} aria-hidden="true">{icon}</span>
}

type ActivityCardProps = {
  activity: Activity
  joined: boolean
  now: number
  showDistance?: boolean
  onOpen: (activity: Activity) => void
}

export default function ActivityCard({
  activity,
  joined,
  now,
  showDistance = true,
  onOpen,
}: ActivityCardProps) {
  const full = activity.players >= activity.capacity
  const status = getActivityStatus(activity, now)
  return (
    <article
      className="activity-card"
      tabIndex={0}
      aria-label={`View details for ${activity.title}`}
      onClick={() => onOpen(activity)}
      onKeyDown={(event) => {
        if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault()
          onOpen(activity)
        }
      }}
    >
      <div className="activity-card-top">
        <ActivityIcon sport={activity.sport} />
        {showDistance && (
          <span className="distance-pill">
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13 6.7c0 3.4-5 7.4-5 7.4S3 10.1 3 6.7a5 5 0 1 1 10 0Z" /><circle cx="8" cy="6.5" r="1.6" /></svg>
            {activity.distance === 'Nearby' ? 'Near campus' : `${activity.distance} away`}
          </span>
        )}
      </div>
      <div className="activity-title-row">
        <h3>{activity.title}</h3>
        <span className="sport-name">{activity.sport}</span>
      </div>
      <div className="activity-status-row">
        <span className={`activity-status activity-status-${status}`}>
          {activityStatusLabels[status]}
        </span>
      </div>
      <div className="activity-details">
        <p className="activity-schedule">
          <span className="activity-detail-icon" aria-hidden="true">
            <svg viewBox="0 0 20 20"><rect x="3" y="4.5" width="14" height="13" rx="2" /><path d="M6.5 2.5v4M13.5 2.5v4M3 8h14" /></svg>
          </span>
          <span className="activity-detail-icon" aria-hidden="true">
            <svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="7" /><path d="M10 6v4l2.5 1.5" /></svg>
          </span>
          <span className="activity-detail-text">{activity.date}, {activity.time}</span>
        </p>
        <p className="activity-location">
          <span className="activity-detail-icon" aria-hidden="true">
            <svg viewBox="0 0 20 20"><path d="M16 8.3c0 4.2-6 9.2-6 9.2S4 12.5 4 8.3a6 6 0 1 1 12 0Z" /><circle cx="10" cy="8" r="2" /></svg>
          </span>
          <span className="activity-detail-text">{activity.location}</span>
        </p>
      </div>
      <div className="activity-bottom">
        <div className="activity-tags">
          <span className="skill-tag">{activity.skill}</span>
          <span className="player-count"><span aria-hidden="true">♙</span>{activity.players} / {activity.capacity} players</span>
        </div>
        <button
          className={joined ? 'join-button join-button-done' : 'join-button'}
          onClick={(event) => {
            event.stopPropagation()
            onOpen(activity)
          }}
        >
          {joined
            ? 'Joined'
            : status === 'ended'
              ? 'Ended'
              : status === 'unavailable'
                ? 'Unavailable'
                : full
                  ? 'Full'
                  : 'Join Game'}
        </button>
      </div>
    </article>
  )
}
