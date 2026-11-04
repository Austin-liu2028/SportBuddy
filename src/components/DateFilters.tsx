import { dateFilters, type DateFilter } from '../utils/activityDiscovery'

export default function DateFilters({ value, onChange }: { value: DateFilter; onChange: (value: DateFilter) => void }) {
  return <div className="date-filters" role="group" aria-label="Filter by date">{dateFilters.map(date => <button className={`date-chip${date === value ? ' date-active' : ''}`} key={date} aria-pressed={date === value} onClick={() => onChange(date)}>{date === 'All' ? 'Any day' : date}</button>)}</div>
}
