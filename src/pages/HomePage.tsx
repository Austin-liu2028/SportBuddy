import ActivityCard from '../components/ActivityCard'
import SportFilters from '../components/SportFilters'
import type { Activity, Route, Sport } from '../types'

type HomePageProps = {
  activities: Activity[]
  joinedIds: string[]
  query: string
  setQuery: (query: string) => void
  sport: 'All' | Sport
  setSport: (sport: 'All' | Sport) => void
  onOpenActivity: (activity: Activity) => void
  onCreateActivity: () => void
  navigate: (path: Route) => void
}

export default function HomePage({
  activities,
  joinedIds,
  query,
  setQuery,
  sport,
  setSport,
  onOpenActivity,
  onCreateActivity,
  navigate,
}: HomePageProps) {
  const search = query.trim().toLowerCase()
  const visible = activities.filter((activity) => (
    (sport === 'All' || activity.sport === sport) &&
    `${activity.title} ${activity.sport} ${activity.location} ${activity.skill}`.toLowerCase().includes(search)
  ))

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

      <section className="activities-section" id="activities" aria-labelledby="activities-title">
        <div className="section-heading">
          <div>
            <span className="section-eyebrow">THE NEIGHBORHOOD COURT</span>
            <h2 id="activities-title">Activities Near You</h2>
            <p>Join a game that's looking for players.</p>
          </div>
          <button className="view-all-button" onClick={() => navigate('/activities')}>Explore all <span aria-hidden="true">→</span></button>
        </div>
        <SportFilters selected={sport} onSelect={setSport} />
        {visible.length ? (
          <div className="activity-grid">
            {visible.map((activity) => (
              <ActivityCard
                activity={activity}
                joined={joinedIds.includes(activity.id)}
                key={activity.id}
                onOpen={onOpenActivity}
              />
            ))}
          </div>
        ) : (
          <div className="empty-activities">
            <span aria-hidden="true">✦</span>
            <h3>No activities found</h3>
            <p>Try a different sport or search term to find your next game.</p>
            <button onClick={() => { setSport('All'); setQuery('') }}>Clear filters</button>
          </div>
        )}
      </section>
    </>
  )
}
