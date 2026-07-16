/**
 * Shared UI state — one plain object plus a tiny pub/sub so views stay
 * decoupled without a framework.
 */
export const state = {
  meta: null, // /api/meta payload (venues, roles, languages, services)
  history: [], // chat history [{role, content}]
  selectedVenueId: null,
  minutesToKickoff: 60, // selected match phase; shared with each assistant request
  isEgress: false,
};

const listeners = new Map();

/** Subscribe to a named event. Returns an unsubscribe function. */
export function on(event, fn) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(fn);
  return () => listeners.get(event)?.delete(fn);
}

/** Emit a named event to all subscribers. */
export function emit(event, payload) {
  for (const fn of listeners.get(event) ?? []) fn(payload);
}
