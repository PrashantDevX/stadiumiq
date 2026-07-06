/**
 * In-memory incident log.
 *
 * Backs the operational-intelligence tools: volunteers/staff report issues
 * (crowding, medical, spills, lost child, accessibility blockers) and staff /
 * organizers read a live brief. A production build would persist to Firestore;
 * an in-memory store keeps the demo dependency-free and the server stateless
 * between deploys while still demonstrating the full report → brief loop.
 */

/** @typedef {'low'|'medium'|'high'|'critical'} Severity */

const VALID_SEVERITY = new Set(['low', 'medium', 'high', 'critical']);

/** Route each incident type to the right responding team. */
const ROUTING = {
  medical: 'Medical / first-aid team',
  crowd: 'Crowd-safety steward lead',
  security: 'Security control room',
  accessibility: 'Accessibility services desk',
  lost_person: 'Guest services & security',
  spill: 'Cleaning / facilities crew',
  other: 'Venue operations center',
};

class IncidentStore {
  constructor() {
    /** @type {object[]} */
    this._incidents = [];
    this._seq = 0;
  }

  /**
   * Record an incident and return the created record with its routing.
   * @param {object} input
   * @param {string} input.venueId
   * @param {string} input.type
   * @param {string} input.zone
   * @param {string} input.description
   * @param {Severity} [input.severity='medium']
   */
  add({ venueId, type, zone, description, severity = 'medium' }) {
    const normalizedType = ROUTING[type] ? type : 'other';
    const normalizedSeverity = VALID_SEVERITY.has(severity) ? severity : 'medium';
    this._seq += 1;

    const incident = {
      id: `INC-${String(this._seq).padStart(4, '0')}`,
      venueId,
      type: normalizedType,
      zone: zone || 'unspecified',
      description: description || '',
      severity: normalizedSeverity,
      routedTo: ROUTING[normalizedType],
      status: 'open',
      createdAt: new Date().toISOString(),
    };
    this._incidents.push(incident);
    return incident;
  }

  /** List incidents, most recent first, optionally filtered by venue. */
  list({ venueId } = {}) {
    const items = venueId
      ? this._incidents.filter((i) => i.venueId === venueId)
      : this._incidents.slice();
    return items.slice().reverse();
  }

  /** Aggregate counts for the operations brief. */
  summary({ venueId } = {}) {
    const items = this.list({ venueId });
    const open = items.filter((i) => i.status === 'open');
    const bySeverity = { low: 0, medium: 0, high: 0, critical: 0 };
    for (const i of open) bySeverity[i.severity] += 1;
    return { total: items.length, open: open.length, bySeverity };
  }

  /** Test helper. */
  _reset() {
    this._incidents = [];
    this._seq = 0;
  }
}

/** Shared singleton — one operational picture per running server. */
export const incidentStore = new IncidentStore();
export { IncidentStore };
