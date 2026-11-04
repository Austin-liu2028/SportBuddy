import { useState } from 'react'
import ActivityCard from '../components/ActivityCard'
import SearchBar from '../components/SearchBar'
import SportFilters from '../components/SportFilters'
import DateFilters from '../components/DateFilters'
import EmptyState, { ActivitySkeletons } from '../components/EmptyState'
import Icon from '../components/Icon'
import type { Activity, Route, Sport } from '../types'
import { getActivityStatus } from '../utils/activityStatus'
import { compareActivityDates, matchesActivityDate, matchesActivitySearch, type DateFilter } from '../utils/activityDiscovery'

type HomePageProps = {
  activities: Activity[]; joinedIds: string[]; now: number; query: string; setQuery: (query: string) => void
  onOpenActivity: (activity: Activity) => void; onCreateActivity: () => void; navigate: (path: Route) => void
  loading: boolean; error: string
}

export default function HomePage({ activities, joinedIds, now, query, setQuery, onOpenActivity, onCreateActivity, navigate, loading, error }: HomePageProps) {
  const [sport, setSport] = useState<'All' | Sport>('All')
  const [date, setDate] = useState<DateFilter>('All')
  const upcoming = activities.filter(activity => {
    const status = getActivityStatus(activity, now)
    return (status === 'upcoming' || status === 'ongoing') && (sport === 'All' || activity.sport === sport)
      && matchesActivitySearch(activity, query) && matchesActivityDate(activity, date, now)
  }).sort((a, b) => compareActivityDates(a, b, now))
  function reset() { setSport('All'); setDate('All'); setQuery('') }
  return <div className="home-page" id="main-content" tabIndex={-1}>
    <section className="home-intro">
      <div><span className="section-eyebrow"><span className="live-dot" /> THE CAMPUS IS YOUR PLAYGROUND</span><h1>Find your next game<span>.</span></h1><p>Discover people to play with on campus.</p></div>
      <button className="outline-button home-partner-link" onClick={() => navigate('/partners')}><Icon name="users" />Find Partners<Icon name="arrow" /></button>
    </section>
    <section className="discovery-tools" aria-label="Find a game">
      <SearchBar value={query} onChange={setQuery} placeholder="Search games, sports, or locations" />
      <SportFilters selected={sport} onSelect={setSport} />
      <DateFilters value={date} onChange={setDate} />
    </section>
    <section className="activities-section" aria-labelledby="activities-title">
      <div className="section-heading"><div><span className="section-eyebrow">MAKE TIME TO PLAY</span><h2 id="activities-title">Games coming up <span className="inline-count">{loading || error ? '—' : upcoming.length}</span></h2></div><button className="view-all-button" onClick={() => navigate('/activities')}>View all<Icon name="arrow" /></button></div>
      {loading ? <ActivitySkeletons /> : error ? <EmptyState title="Games couldn’t be loaded">Use the message above to reconnect and try again.</EmptyState> : upcoming.length ? <div className="activity-grid">{upcoming.slice(0, 6).map(activity => <ActivityCard key={activity.id} activity={activity} joined={joinedIds.includes(activity.id)} now={now} onOpen={onOpenActivity} />)}</div>
        : <EmptyState title={activities.length ? 'No games match your plans' : 'Start something good'} action={<div className="empty-actions"><button className="outline-button" onClick={reset}>Reset filters</button><button className="find-button" onClick={onCreateActivity}>Create a game</button></div>}>{activities.length ? 'Try another sport or day, or bring people together with a game of your own.' : 'No upcoming games yet. Pick a sport, choose a time, and get the first game going.'}</EmptyState>}
    </section>
    <aside className="community-callout"><span className="community-icon"><Icon name="users" /></span><div><h2>Good games start with good company.</h2><p>Meet the people bringing campus together, one game at a time.</p></div><button className="view-all-button" onClick={() => navigate('/partners')}>Find your people<Icon name="arrow" /></button></aside>
  </div>
}
