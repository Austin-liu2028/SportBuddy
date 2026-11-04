export const DISPLAY_NAME_MAX_LENGTH = 60

export function getOrganizerName(value: string): string {
  const name = value.trim()
  if (!name || name.toLowerCase() === 'player') {
    throw new Error('Enter your name so other players know who is organizing.')
  }
  if (name.length > DISPLAY_NAME_MAX_LENGTH) {
    throw new Error(`Your name must be ${DISPLAY_NAME_MAX_LENGTH} characters or fewer.`)
  }
  return name
}
