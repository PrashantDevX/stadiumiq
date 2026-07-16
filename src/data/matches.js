/**
 * FIFA World Cup 2026 match calendar — knockout-stage anchors.
 *
 * Dates and venue assignments follow FIFA's published tournament calendar
 * (48 teams, 104 matches, June 11 – July 19 2026). Team pairings for knockout
 * rounds depend on live results, so they are shown as bracket placeholders —
 * documented as an assumption in the README. Kick-off hours vary by broadcast
 * window and are shown as "TBC".
 */

export const TOURNAMENT = Object.freeze({
  name: 'FIFA World Cup 2026',
  hosts: ['USA', 'Canada', 'Mexico'],
  teams: 48,
  matches: 104,
  opens: '2026-06-11',
  finalDate: '2026-07-19',
  finalVenueId: 'metlife',
});

/** @typedef {{id:string, date:string, round:string, venueId:string, home:string, away:string}} Match */

export const MATCHES = Object.freeze([
  {
    id: 'm1',
    date: '2026-06-11',
    round: 'Opening match — Group stage',
    venueId: 'azteca',
    home: 'Mexico',
    away: 'Group A opponent',
  },
  {
    id: 'qf1',
    date: '2026-07-09',
    round: 'Quarter-final 1',
    venueId: 'gillette',
    home: 'R16 winner',
    away: 'R16 winner',
  },
  {
    id: 'qf2',
    date: '2026-07-10',
    round: 'Quarter-final 2',
    venueId: 'sofi',
    home: 'R16 winner',
    away: 'R16 winner',
  },
  {
    id: 'qf3',
    date: '2026-07-11',
    round: 'Quarter-final 3',
    venueId: 'arrowhead',
    home: 'R16 winner',
    away: 'R16 winner',
  },
  {
    id: 'qf4',
    date: '2026-07-11',
    round: 'Quarter-final 4',
    venueId: 'hardrock',
    home: 'R16 winner',
    away: 'R16 winner',
  },
  {
    id: 'sf1',
    date: '2026-07-14',
    round: 'Semi-final 1',
    venueId: 'att',
    home: 'QF1 winner',
    away: 'QF2 winner',
  },
  {
    id: 'sf2',
    date: '2026-07-15',
    round: 'Semi-final 2',
    venueId: 'mercedes',
    home: 'QF3 winner',
    away: 'QF4 winner',
  },
  {
    id: 'm103',
    date: '2026-07-18',
    round: 'Third-place match',
    venueId: 'hardrock',
    home: 'SF1 runner-up',
    away: 'SF2 runner-up',
  },
  {
    id: 'm104',
    date: '2026-07-19',
    round: '🏆 FINAL',
    venueId: 'metlife',
    home: 'SF1 winner',
    away: 'SF2 winner',
  },
]);

/** Matches at a given venue, or the full calendar. */
export function getMatches({ venueId } = {}) {
  return venueId ? MATCHES.filter((m) => m.venueId === venueId) : [...MATCHES];
}

/** Matches on or after a given ISO date (yyyy-mm-dd). */
export function getUpcomingMatches(fromDate) {
  return MATCHES.filter((m) => m.date >= fromDate);
}
