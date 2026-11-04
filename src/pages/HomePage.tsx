import ActivityCard from '../components/ActivityCard'
import SearchBar from '../components/SearchBar'
import type { Activity, Route } from '../types'
import { getActivityStatus, getActivityTimestampRange } from '../utils/activityStatus'

type HomePageProps = {
  activities: Activity[]
  joinedIds: string[]
  now: number
  query: string
  setQuery: (query: string) => void
  onSearch: () => void
  onOpenActivity: (activity: Activity) => void
  onCreateActivity: () => void
  navigate: (path: Route) => void
}

export default function HomePage({
  activities,
  joinedIds,
  now,
  query,
  setQuery,
  onSearch,
  onOpenActivity,
  onCreateActivity,
  navigate,
}: HomePageProps) {
  const upcoming = activities
    .filter((activity) => (
      getActivityStatus(activity, now) === 'upcoming' &&
      getActivityTimestampRange(activity) !== null
    ))
    .toSorted((first, second) => {
      const firstHasSpots = first.players < first.capacity
      const secondHasSpots = second.players < second.capacity
      if (firstHasSpots !== secondHasSpots) return firstHasSpots ? -1 : 1

      const firstStart = getActivityTimestampRange(first)?.[0].getTime() ?? Number.POSITIVE_INFINITY
      const secondStart = getActivityTimestampRange(second)?.[0].getTime() ?? Number.POSITIVE_INFINITY
      return firstStart - secondStart
    })
    .slice(0, 4)

  return (
    <>
      <section className="welcome-banner">
        <div className="welcome-copy">
          <span className="welcome-eyebrow">YOUR CAMPUS, IN MOTION</span>
          <h1>Good games. Great people.</h1>
          <p>Find your people, get outside, and make today a little more active.</p>
          <div className="hero-actions">
            <button className="secondary-cta" onClick={() => navigate('/partners')}>
              Find a Partner
              <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M10 5l5 5-5 5" /></svg>
            </button>
            <button className="create-hero-cta" onClick={onCreateActivity}>
              <span aria-hidden="true">＋</span> Create Activity
            </button>
          </div>
        </div>
        <div className="welcome-art" aria-hidden="true">
          <div className="art-ring ring-back" />
          <div className="art-ring ring-front" />
          <div className="art-person person-one"><span /></div>
          <div className="art-person person-two"><span /></div>
          <div className="art-person person-three"><span /></div>
          <span className="art-star star-left">✦</span>
          <span className="art-star star-right">✳</span>
        </div>
      </section>

      <SearchBar
        value={query}
        onChange={setQuery}
        onSubmit={onSearch}
        placeholder="Search activities or locations..."
      />

      <section className="activities-section" id="activities" aria-labelledby="activities-title">
        <div className="section-heading">
          <div>
            <span className="section-eyebrow">FIND YOUR NEXT GAME</span>
            <h2 id="activities-title">Upcoming Activities</h2>
            <p>See what’s coming up and find a game that fits.</p>
          </div>
          <button className="view-all-button" onClick={() => navigate('/activities')}>See All Activities <span aria-hidden="true">→</span></button>
        </div>
        {upcoming.length ? (
          <div className="activity-grid">
            {upcoming.map((activity) => (
              <ActivityCard
                activity={activity}
                joined={joinedIds.includes(activity.id)}
                now={now}
                showDistance={false}
                key={activity.id}
                onOpen={onOpenActivity}
              />
            ))}
          </div>
        ) : (
          <div className="empty-activities">
            <span aria-hidden="true">✦</span>
            <h3>No upcoming activities</h3>
            <p>Explore all activities to find ongoing games and past activity details.</p>
            <button onClick={() => navigate('/activities')}>See All Activities</button>
          </div>
        )}
      </section>
    </>
  )
}
