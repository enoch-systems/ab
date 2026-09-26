/**
 * Single source of truth for company contact details.
 *
 * The headquarters address is rendered in several places (the site footer and
 * the contact page), so it lives here rather than being duplicated as literals
 * that can drift apart. Update `COMPANY_ADDRESS` and every surface follows.
 */
export const COMPANY_ADDRESS = {
  /** Street line, as printed. */
  street: "8401 McClure Dr",
  /** City, and the two-letter state code. */
  city: "Fort Smith",
  regionCode: "AR",
  postalCode: "72916",
  country: "United States",
  countryCode: "US",
} as const;

/** "Fort Smith, AR 72916" — the city line used in the contact card. */
export const COMPANY_CITY_LINE = `${COMPANY_ADDRESS.city}, ${COMPANY_ADDRESS.regionCode} ${COMPANY_ADDRESS.postalCode}`

/** "8401 McClure Dr, Fort Smith, AR 72916, United States" — the full postal form. */
export const COMPANY_ADDRESS_LINE = [
  COMPANY_ADDRESS.street,
  `${COMPANY_ADDRESS.city}, ${COMPANY_ADDRESS.regionCode} ${COMPANY_ADDRESS.postalCode}`,
  COMPANY_ADDRESS.country,
].join(", ")

/**
 * Google Maps link for the headquarters.
 *
 * This is the short shareable URL, which keeps working if the pin is ever moved
 * inside Google Maps and always opens the directions app on mobile.
 */
export const COMPANY_MAPS_URL = "https://maps.app.goo.gl/hDV5F5mJnPdoFG8g8"

/**
 * A plain-text Maps query for the same place, kept for `tel:`-style fallbacks
 * and anywhere a full URL would be noisy (e.g. aria-labels in tooltips).
 */
export const COMPANY_MAPS_QUERY = encodeURIComponent(
  `${COMPANY_ADDRESS.street}, ${COMPANY_ADDRESS.city}, ${COMPANY_ADDRESS.regionCode} ${COMPANY_ADDRESS.postalCode}`
)
