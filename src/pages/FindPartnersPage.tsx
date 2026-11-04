import { useState } from 'react'
import PartnerCard from '../components/PartnerCard'
import ActivityCard from '../components/ActivityCard'
import SportFilters from '../components/SportFilters'
import SearchBar from '../components/SearchBar'
import EmptyState, { ActivitySkeletons } from '../components/EmptyState'
import { getActivityHosts } from '../utils/partners'
import type { Activity, Sport } from '../types'
import { useDialog } from '../hooks/useDialog'

type Props = { activities: Activity[]; currentUid: string | null; joinedIds: string[]; now: number; loading: boolean; error: string; onOpenActivity: (activity: Activity) => void }
export default function FindPartnersPage({ activities, currentUid, joinedIds, now, loading, error, onOpenActivity }: Props) {
  const [sport, setSport] = useState<'All' | Sport>('All')
  const [query, setQuery] = useState('')
  const [openOnly, setOpenOnly] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const hosts = getActivityHosts(activities, currentUid, now)
  const results = hosts.filter(host => (sport === 'All' || host.sports.includes(sport)) && (!openOnly || host.openGames > 0)
    && `${host.name} ${host.sports.join(' ')}`.toLowerCase().includes(query.trim().toLowerCase()))
  const selected = hosts.find(host => host.id === selectedId)
  const dialog = useDialog(Boolean(selected), () => setSelectedId(null))
  return <section className="inner-page partners-page" id="main-content" tabIndex={-1}>
    <div className="page-heading"><span className="section-eyebrow">A SHARED SPORT. A NEW CONNECTION.</span><h1>Find your people.</h1><p>Meet campus players through the games they organize.</p></div>
    <SearchBar value={query} onChange={setQuery} placeholder="Search organizers or sports" />
    <SportFilters selected={sport} onSelect={setSport} />
    <div className="partner-results-header"><p className="activity-results-count">{loading ? 'Loading organizers…' : `${results.length} ${results.length === 1 ? 'organizer' : 'organizers'}`}</p><label className="available-spots-filter"><input type="checkbox" checked={openOnly} onChange={event => setOpenOnly(event.target.checked)} />With open games</label></div>
    {loading ? <ActivitySkeletons /> : error ? <EmptyState title="Organizers couldn’t be loaded">Please reconnect using the message above.</EmptyState> : results.length ? <div className="partner-grid">{results.map(host => <PartnerCard key={host.id} partner={host} onView={host => setSelectedId(host.id)} />)}</div>
      : <EmptyState title="A new connection is a game away" action={<button className="outline-button" onClick={() => { setSport('All'); setQuery(''); setOpenOnly(false) }}>Reset filters</button>}>Organizers appear here when they host a game. Try another sport or check back as the community grows.</EmptyState>}
    <p className="privacy-note">Organizers and sports are based on posted games. Open a game to see its schedule and contact the organizer.</p>
    {selected && <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setSelectedId(null) }}><section ref={dialog} className="modal-card host-games-modal" role="dialog" aria-modal="true" aria-labelledby="host-games-title"><button className="modal-close" onClick={() => setSelectedId(null)} aria-label="Close organizer games">×</button><span className="section-eyebrow">MEET THROUGH A GAME</span><h2 id="host-games-title">Games with {selected.name}</h2><p className="modal-organizer">Open a game to see details and contact the organizer.</p><div className="host-games-list">{selected.activities.map(activity => <ActivityCard key={activity.id} activity={activity} joined={joinedIds.includes(activity.id)} now={now} onOpen={activity => { setSelectedId(null); onOpenActivity(activity) }} />)}</div></section></div>}
  </section>
}
