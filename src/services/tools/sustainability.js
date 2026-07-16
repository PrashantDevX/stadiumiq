/**
 * Sustainability tool — recycling, reusable cups, water refill and low-carbon
 * travel guidance for a greener tournament.
 */
import { getVenue } from '../venueService.js';

export const getSustainabilityTips = {
  name: 'get_sustainability_tips',
  declaration: {
    name: 'get_sustainability_tips',
    description:
      "Return the venue's sustainability facilities and practical tips (recycling, reusable cups, water refill, low-emission travel). Use for eco / green / recycling / waste questions.",
    parametersJsonSchema: {
      type: 'object',
      properties: {},
    },
  },
  handler(args, context) {
    const venue = getVenue(args.venue ?? context.venueId);
    if (!venue) return { error: 'venue_not_found', message: 'I could not find that venue.' };

    const s = venue.operations.sustainability;
    return {
      venue: venue.name,
      recycling: s.recycling,
      reusableCups: s.reusable_cups,
      waterRefill: s.water_refill,
      transitIncentive: s.transit_incentive,
      tips: s.tips,
    };
  },
};

export const sustainabilityTools = [getSustainabilityTips];
