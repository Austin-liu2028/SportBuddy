import type { Sport } from '../types'
import { sportOptions } from '../data/activities'

type SportFiltersProps = {
  selected: 'All' | Sport
  onSelect: (sport: 'All' | Sport) => void
}

export default function SportFilters({ selected, onSelect }: SportFiltersProps) {
  const options: Array<'All' | Sport> = ['All', ...sportOptions]

  return (
    <div className="sport-filters" role="group" aria-label="Filter by sport">
      {options.map((sport) => (
        <button
          className={selected === sport ? 'sport-chip chip-active' : 'sport-chip'}
          key={sport}
          onClick={() => onSelect(sport)}
          aria-pressed={selected === sport}
        >
          {sport}
        </button>
      ))}
    </div>
  )
}
