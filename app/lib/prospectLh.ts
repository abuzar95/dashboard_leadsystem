/** Matches extension LH picker + backend validateLhAssignment */
export function lhIntentCategoryMatches(
  niche: string | null | undefined,
  intentCategory: string | null | undefined
): boolean {
  if (!niche || !intentCategory) return false
  if (intentCategory === 'Both' || niche === 'Both') return true
  return niche === intentCategory
}

export interface LhUserOption {
  id: string
  name: string | null
  email: string
  linkedin_profile?: { niche: string | null } | null
}

export function describeLhIntentMismatch(
  intentCategory: string,
  niche: string | null | undefined,
  lhLabel: string
): string {
  const nicheLabel = niche || 'not set'
  return (
    `Cannot assign ${lhLabel}: their LinkedIn profile niche is "${nicheLabel}" ` +
    `but this prospect's intent category is "${intentCategory}". ` +
    `Choose an LH user whose niche matches Individual, Business, or Both (when either side is Both).`
  )
}

export function getLhAssignmentValidationError(
  intentCategory: string | null | undefined,
  lhUserId: string | null | undefined,
  lhUsers: LhUserOption[]
): string | null {
  if (!lhUserId) return null
  if (!intentCategory) {
    return 'Set an intent category (Individual, Business, or Both) before assigning an LH user.'
  }
  const lh = lhUsers.find((u) => u.id === lhUserId)
  if (!lh) {
    return 'The selected LH user could not be found. Refresh the page and try again.'
  }
  const niche = lh.linkedin_profile?.niche
  if (!niche) {
    const label = lh.name || lh.email
    return (
      `Cannot assign ${label}: their account has no LinkedIn profile niche. ` +
      `An admin must link an LH user to a LinkedIn profile with niche Individual, Business, or Both.`
    )
  }
  if (!lhIntentCategoryMatches(niche, intentCategory)) {
    return describeLhIntentMismatch(intentCategory, niche, lh.name || lh.email)
  }
  return null
}
