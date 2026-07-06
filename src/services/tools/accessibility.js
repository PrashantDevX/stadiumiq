/**
 * Accessibility services tool — inclusive by design.
 *
 * Surfaces the venue's accessibility provisions and, when the user names a
 * specific need, filters to the most relevant services first.
 */
import { getVenue } from '../venueService.js';

/** Keyword → matching-service filters so we lead with what the user needs. */
const NEED_MATCHERS = {
  wheelchair: /wheelchair|step-?free|ramp|elevator/i,
  hearing: /hearing|assistive listening|loop/i,
  sensory: /sensory|quiet/i,
  vision: /braille|large-?print/i,
  service_animal: /service-?animal/i,
};

export const getAccessibilityServices = {
  name: 'get_accessibility_services',
  declaration: {
    name: 'get_accessibility_services',
    description:
      'List a venue\'s accessibility services (step-free routes, wheelchair escort, sensory rooms, hearing loops, accessible seating, service-animal areas). Optionally focus on a specific need. Use for any accessibility, disability or assistance request.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        need: {
          type: 'string',
          description:
            'Optional focus, e.g. "wheelchair", "hearing", "sensory", "vision", "service animal".',
        },
      },
    },
  },
  handler(args, context) {
    const venue = getVenue(args.venue ?? context.venueId);
    if (!venue) return { error: 'venue_not_found', message: 'I could not find that venue.' };

    const a11y = venue.operations.accessibility;
    const need = (args.need ?? '').toLowerCase();
    const matcher = Object.entries(NEED_MATCHERS).find(([key]) => need.includes(key.replace('_', ' ')) || need.includes(key))?.[1];

    // Lead with services that match the stated need, keep the rest for context.
    const relevant = matcher ? a11y.services.filter((s) => matcher.test(s)) : [];
    const services = relevant.length ? [...relevant, ...a11y.services.filter((s) => !relevant.includes(s))] : a11y.services;

    return {
      venue: venue.name,
      stepFree: a11y.step_free,
      accessibleSeating: a11y.accessible_seating,
      focusedOn: args.need ?? null,
      services,
      howToGetHelp: a11y.guest_services,
    };
  },
};

export const accessibilityTools = [getAccessibilityServices];
