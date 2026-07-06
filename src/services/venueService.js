/**
 * Venue service — the single source of truth for resolved venue data.
 *
 * Venues store only what differs from DEFAULT_OPERATIONS; this service merges
 * the two so callers always receive a complete operational profile. Keeping the
 * merge here (rather than in every tool) keeps the tools focused on decisions.
 */
import { VENUES, VENUES_BY_ID, DEFAULT_OPERATIONS } from '../data/venues.js';

/** Shallow-merge each top-level operations section (gates, accessibility, …). */
function mergeOperations(override = {}) {
  const merged = {};
  for (const key of Object.keys(DEFAULT_OPERATIONS)) {
    const base = DEFAULT_OPERATIONS[key];
    const patch = override[key];
    merged[key] = Array.isArray(base)
      ? patch ?? base
      : { ...base, ...(patch ?? {}) };
  }
  return merged;
}

/**
 * Resolve a venue by id or by (case-insensitive) city/name match.
 * @returns {object|null} the venue with fully-merged `operations`, or null.
 */
export function getVenue(idOrCity) {
  if (!idOrCity) return null;
  const key = String(idOrCity).trim().toLowerCase();

  let venue = VENUES_BY_ID[key];
  if (!venue) {
    venue = VENUES.find(
      (v) =>
        v.city.toLowerCase().includes(key) ||
        v.name.toLowerCase().includes(key) ||
        key.includes(v.city.toLowerCase()),
    );
  }
  if (!venue) return null;

  return { ...venue, operations: mergeOperations(venue.operations) };
}

/** Lightweight list for populating selectors and the operations brief. */
export function listVenues() {
  return VENUES.map(({ id, name, city, country, capacity, timezone }) => ({
    id,
    name,
    city,
    country,
    capacity,
    timezone,
  }));
}
