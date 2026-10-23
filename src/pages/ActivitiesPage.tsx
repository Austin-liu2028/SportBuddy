import { useMemo, useState } from 'react'
import ActivityCard from '../components/ActivityCard'
import CreateActivityModal from '../components/CreateActivityModal'
import SearchBar from '../components/SearchBar'
import SportFilters from '../components/SportFilters'
import type { Activity, Sport } from '../types'

type ActivitiesPageProps = {
  activities: Activity[]
  joinedIds: string[]
  organizerName: string
  profileReady: boolean
  onOpenActivity: (activity: Activity) => void
  onCreate: (activity: Activity) => void
}

export default function ActivitiesPage({
  activities,
  joinedIds,
  organizerName,
  profileReady,
  onOpenActivity,
  onCreate,
}: ActivitiesPageProps) {
  const [tab, setTab] = useState<'join' | 'yours'>('join')
  const [sport, setSport] = useState<'All' | Sport>('All')
  const [date, setDate] = useState('Any date')
  const [skill, setSkill] = useState('Any level')
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)

  const filtered = useMemo(() => activities.filter((activity) => {
    if (tab === 'yours' && !joinedIds.includes(activity.id)) return false
    if (sport !== 'All' && activity.sport !== sport) return false
    if (date !== 'Any date' && activity.date !== date) return false
    if (skill !== 'Any level' && activity.skill !== skill) return false
    const search = `${activity.title} ${activity.sport} ${activity.location}`.toLowerCase()
    return search.includes(query.trim().toLowerCase())
  }), [activities, joinedIds, tab, sport, date, skill, query])

  function createActivity(activity: Activity) {
    onCreate(activity)
    setCreating(false)
    setTab('yours')
  }

  return (
    <section className="inner-page activities-page">
      <div className="activities-page-heading">
        <div className="page-heading">
          <span className="section-eyebrow">FIND YOUR NEXT GAME</span>
          <h1>Explore Activities</h1>
          <p>Discover games and get moving with your campus community.</p>
        </div>
        <button className="create-activity-button" onClick={() => setCreating(true)} disabled={!profileReady}>＋ Create Activity</button>
      </div>

      <SearchBar value={query} onChange={setQuery} placeholder="Search activities or locations..." />

      <div className="activity-tabs" role="tablist" aria-label="Activity list">
        <button role="tab" aria-selected={tab === 'join'} className={tab === 'join' ? 'activity-tab tab-selected' : 'activity-tab'} onClick={() => setTab('join')}>Join Activities</button>
        <button role="tab" aria-selected={tab === 'yours'} className={tab === 'yours' ? 'activity-tab tab-selected' : 'activity-tab'} onClick={() => setTab('yours')}>Your Activities <span>{joinedIds.length}</span></button>
      </div>

      <SportFilters selected={sport} onSelect={setSport} />
      <div className="secondary-filters">
        <label>Date<select value={date} onChange={(event) => setDate(event.target.value)}><option>Any date</option><option>Today</option><option>Tomorrow</option><option>Saturday</option><option>Sunday</option></select></label>
        <label>Skill level<select value={skill} onChange={(event) => setSkill(event.target.value)}><option>Any level</option><option>Beginner friendly</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option><option>All levels</option></select></label>
      </div>

      {filtered.length ? (
        <div className="activity-grid">
          {filtered.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              joined={joinedIds.includes(activity.id)}
              onOpen={onOpenActivity}
            />
          ))}
        </div>
      ) : (
        <div className="empty-activities">
          <span aria-hidden="true">✦</span>
          <h3>{tab === 'yours' ? 'No activities yet' : 'No activities match your filters'}</h3>
          <p>{tab === 'yours' ? 'Join a game or create a new activity to see it here.' : 'Try adjusting your search or filters.'}</p>
          {tab === 'yours' && <button onClick={() => setTab('join')}>Browse activities</button>}
        </div>
      )}

      {creating && <CreateActivityModal organizerName={organizerName} onClose={() => setCreating(false)} onCreate={createActivity} />}
    </section>
  )
}
