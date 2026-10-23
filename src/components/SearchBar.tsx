type SearchBarProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search sports, activities, or locations...',
}: SearchBarProps) {
  return (
    <label className="global-search">
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="8.8" cy="8.8" r="5.8" />
        <path d="m13.2 13.2 4 4" />
      </svg>
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <span className="search-shortcut" aria-hidden="true">⌘ K</span>
    </label>
  )
}
