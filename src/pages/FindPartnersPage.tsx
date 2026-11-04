import { useState } from 'react'
import PartnerCard from '../components/PartnerCard'
import SportFilters from '../components/SportFilters'
import SearchBar from '../components/SearchBar'
import EmptyState, { ActivitySkeletons } from '../components/EmptyState'
import { getActivityHosts } from '../utils/partners'
import type { Activity, Sport } from '../types'
import { useMemberProfiles } from '../context/MemberProfilesContext'
import { memberDisplayName } from '../utils/memberProfiles'

type Props = { activities: Activity[]; currentUid: string | null; now: number; loading: boolean; error: string }
export default function FindPartnersPage({ activities, currentUid, now, loading, error }: Props) {
  const [sport, setSport] = useState<'All' | Sport>('All')
  const [query, setQuery] = useState('')
  const [openOnly, setOpenOnly] = useState(false)
  const { profiles, openProfile } = useMemberProfiles()
  const hosts = getActivityHosts(activities, currentUid, now)
  const results = hosts.filter(host => (sport === 'All' || host.sports.includes(sport)) && (!openOnly || host.openGames > 0)
    && `${memberDisplayName(profiles[host.id]?.displayName, host.name)} ${host.sports.join(' ')}`.toLowerCase().includes(query.trim().toLowerCase()))
  return <section className="inner-page partners-page" id="main-content" tabIndex={-1}>
    <div className="page-heading"><span className="section-eyebrow">A SHARED SPORT. A NEW CONNECTION.</span><h1>Find your people.</h1><p>Meet campus players through the games they organize.</p></div>
    <SearchBar value={query} onChange={setQuery} placeholder="Search organizers or sports" />
    <SportFilters selected={sport} onSelect={setSport} />
    <div className="partner-results-header"><p className="activity-results-count">{loading ? 'Loading organizers…' : `${results.length} ${results.length === 1 ? 'organizer' : 'organizers'}`}</p><label className="available-spots-filter"><input type="checkbox" checked={openOnly} onChange={event => setOpenOnly(event.target.checked)} />With open games</label></div>
    {loading ? <ActivitySkeletons /> : error ? <EmptyState title="Organizers couldn’t be loaded">Please reconnect using the message above.</EmptyState> : results.length ? <div className="partner-grid">{results.map(host => <PartnerCard key={host.id} partner={host} onView={host => openProfile(host.id, host.name)} />)}</div>
      : <EmptyState title="A new connection is a game away" action={<button className="outline-button" onClick={() => { setSport('All'); setQuery(''); setOpenOnly(false) }}>Reset filters</button>}>Organizers appear here when they host a game. Try another sport or check back as the community grows.</EmptyState>}
    <p className="privacy-note">Organizers and sports are based on posted games. Open a game to see its schedule and contact the organizer.</p>
  </section>
}
