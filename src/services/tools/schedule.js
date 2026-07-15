/**
 * Match-schedule tool — lets every persona ask "when / where is the next
 * match", "what's happening at this venue", or "when is the final".
 */
import { getVenue } from '../venueService.js';
import { getMatches, TOURNAMENT } from '../../data/matches.js';

export const getMatchSchedule = {
  name: 'get_match_schedule',
  declaration: {
    name: 'get_match_schedule',
    description:
      'Return the FIFA World Cup 2026 knockout schedule — optionally for one venue. Use for questions about match dates, the final, semi-finals or what is played at a stadium.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        venue: {
          type: 'string',
          description: 'Venue id or city to filter by. Optional; defaults to the whole calendar.',
        },
      },
    },
  },
  handler(args, context) {
    const venue = args.venue || context.venueId ? getVenue(args.venue ?? context.venueId) : null;
    const matches = getMatches({ venueId: venue?.id }).map((m) => ({
      date: m.date,
      round: m.round,
      venue: getVenue(m.venueId)?.name ?? m.venueId,
      fixture: `${m.home} vs ${m.away}`,
    }));

    return {
      tournament: `${TOURNAMENT.name} — ${TOURNAMENT.teams} teams, ${TOURNAMENT.matches} matches across ${TOURNAMENT.hosts.join(', ')}`,
      filteredBy: venue?.name ?? 'all venues',
      finale: `The final is on ${TOURNAMENT.finalDate} at MetLife Stadium, New York / New Jersey.`,
      matches,
      note: 'Knockout pairings depend on live results; kick-off hours vary by broadcast window.',
    };
  },
};

export const scheduleTools = [getMatchSchedule];
