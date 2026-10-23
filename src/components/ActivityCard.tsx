import type { Activity, Sport } from '../types'

function ActivityIcon({ sport }: { sport: Sport }) {
  const icon = sport === 'Basketball' ? '◉' : sport === 'Running' ? '↗' : sport === 'Swimming' ? '≈' : sport === 'Gym' ? '✣' : sport === 'Cycling' ? '◌' : sport === 'Soccer' || sport === 'Ultimate Frisbee' || sport === 'Flag Football' ? '⬡' : '✳'
  return <span className={`sport-icon sport-icon-${sport.toLowerCase().replaceAll(' ', '-')}`} aria-hidden="true">{icon}</span>
}

type ActivityCardProps = {
  activity: Activity
  joined: boolean
  onOpen: (activity: Activity) => void
}

export default function ActivityCard({ activity, joined, onOpen }: ActivityCardProps) {
  const full = activity.players >= activity.capacity
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
        <span className="distance-pill">
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13 6.7c0 3.4-5 7.4-5 7.4S3 10.1 3 6.7a5 5 0 1 1 10 0Z" /><circle cx="8" cy="6.5" r="1.6" /></svg>
          {activity.distance === 'Nearby' ? 'Near campus' : `${activity.distance} away`}
        </span>
      </div>
      <div className="activity-title-row">
        <h3>{activity.title}</h3>
        <span className="sport-name">{activity.sport}</span>
      </div>
      <div className="activity-details">
        <p><span aria-hidden="true">◷</span>{activity.date}, {activity.time}</p>
        <p><span aria-hidden="true">⌖</span>{activity.location}</p>
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
          {joined ? 'Joined' : full ? 'Full' : 'Join Game'}
        </button>
      </div>
    </article>
  )
}
