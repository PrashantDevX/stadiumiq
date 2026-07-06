/**
 * Transportation & sustainability-aware travel tool.
 *
 * Recommends how to get to/from the venue and nudges toward the lowest-emission
 * option that fits the user's stated mode — sustainability by design.
 */
import { getVenue } from '../venueService.js';

const MODE_LABELS = {
  rail: 'public rail / metro',
  shuttle: 'official shuttle',
  rideshare: 'rideshare',
  parking: 'driving & parking',
};

export const planTransport = {
  name: 'plan_transport',
  declaration: {
    name: 'plan_transport',
    description:
      'Recommend how to travel to or from a venue. Compares rail, shuttle, rideshare and parking, favouring low-emission options, and returns a sustainability nudge. Use for "how do I get there", parking or transit questions.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        origin: { type: 'string', description: 'Where the user is travelling from (optional).' },
        mode: {
          type: 'string',
          enum: ['rail', 'shuttle', 'rideshare', 'parking', 'any'],
          description: 'Preferred travel mode, or "any" to let StadiumIQ choose the best.',
        },
        direction: {
          type: 'string',
          enum: ['arrive', 'depart'],
          description: 'Whether the user is arriving or leaving.',
        },
      },
    },
  },
  handler(args, context) {
    const venue = getVenue(args.venue ?? context.venueId);
    if (!venue) return { error: 'venue_not_found', message: 'I could not find that venue.' };

    const t = venue.transport ?? {};
    const requested = args.mode && args.mode !== 'any' ? args.mode : t.recommended ?? 'rail';
    const direction = args.direction ?? 'arrive';

    const options = ['rail', 'shuttle', 'rideshare', 'parking']
      .filter((m) => t[m])
      .map((m) => ({ mode: m, label: MODE_LABELS[m], detail: t[m], recommended: m === (t.recommended ?? 'rail') }));

    const chosen = options.find((o) => o.mode === requested) ?? options[0];
    const greener = requested === 'parking' || requested === 'rideshare';

    return {
      venue: venue.name,
      direction,
      chosenOption: chosen ?? null,
      allOptions: options,
      sustainabilityNudge: greener
        ? `${venue.operations.sustainability.transit_incentive} Taking ${MODE_LABELS[t.recommended ?? 'rail']} instead cuts emissions and skips parking queues.`
        : venue.operations.sustainability.transit_incentive,
      departTip:
        direction === 'depart'
          ? 'Expect a post-match surge — waiting 20–30 minutes or walking one stop down the line is usually faster than queueing immediately.'
          : null,
    };
  },
};

export const transportTools = [planTransport];
