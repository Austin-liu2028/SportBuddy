export function getOrganizerName(value: string): string {
  const name = value.trim()
  if (!name || name.toLowerCase() === 'player') {
    throw new Error('Enter your name so other players know who is organizing.')
  }
  if (name.length > 80) {
    throw new Error('Your name must be 80 characters or fewer.')
  }
  return name
}
