export function firebaseErrorMessage(error: unknown, subject: 'activities' | 'profile' | 'activity') {
  const code = isFirebaseError(error) ? error.code : ''
  if (code === 'permission-denied') {
    return subject === 'activities'
      ? 'Games couldn’t be loaded because access was denied. Refresh and try again, or contact the site owner.'
      : subject === 'profile'
        ? 'Your profile isn’t available to this account. Refresh and try again, or contact the site owner.'
        : 'The server denied this game change. Your changes were not saved. Please contact the site owner.'
  }
  if (code === 'unauthenticated') return 'Your session has expired. Refresh the page to reconnect.'
  if (code === 'unavailable' || code === 'auth/network-request-failed') return 'You appear to be offline. Check your connection and try again.'
  return subject === 'activities' ? 'Games couldn’t be loaded. Check your connection and try again.'
    : subject === 'profile' ? 'Your profile couldn’t be loaded. Please refresh and try again.'
      : 'The game couldn’t be updated. Please try again.'
}

export function isFirebaseError(error: unknown): error is { code: string } {
  return typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string'
}
