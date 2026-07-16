/**
 * Crowd-management & real-time decision-support tool.
 */
import { getVenue } from '../venueService.js';
import { estimateCrowd } from '../crowdModel.js';

export const getCrowdStatus = {
  name: 'get_crowd_status',
  declaration: {
    name: 'get_crowd_status',
    description:
      'Report current crowd density and queue estimates for a venue or a specific zone/gate, with advice on the best time and route to move. Use for "how busy is it", "which gate is quicker", or timing questions.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        zone: {
          type: 'string',
          description: 'Optional gate id or area, e.g. "Gate A", "main concourse", "west".',
        },
        minutesToKickoff: {
          type: 'number',
          description: 'Minutes until kickoff (negative if the match is in progress).',
        },
        isEgress: {
          type: 'boolean',
          description: 'True to assess post-match exit conditions.',
        },
      },
    },
  },
  handler(args, context) {
    const venue = getVenue(args.venue ?? context.venueId);
    if (!venue) return { error: 'venue_not_found', message: 'I could not find that venue.' };

    const minutesToKickoff = args.minutesToKickoff ?? context.minutesToKickoff ?? 60;
    const zone = (args.zone ?? '').toLowerCase();

    // Central/main areas concentrate flow; named express gates relieve it.
    const gateFlow = /main|central|entrance|plaza/.test(zone)
      ? 'central'
      : venue.operations.gates.find(
            (g) => zone.includes(g.id.toLowerCase()) && g.security === 'express',
          )
        ? 'express'
        : 'standard';

    const crowd = estimateCrowd({
      minutesToKickoff,
      gateFlow,
      isEgress: args.isEgress ?? context.isEgress ?? false,
    });

    // Suggest the quietest gate as a concrete alternative.
    const quietest =
      venue.operations.gates.find((g) => g.security === 'express') ?? venue.operations.gates[0];

    return {
      venue: venue.name,
      zone: args.zone ?? 'overall',
      level: crowd.level,
      estimatedWaitMinutes: crowd.waitMinutes,
      advice: crowd.advice,
      quieterGate: `Gate ${quietest.id} (${quietest.compass})`,
    };
  },
};

export const crowdTools = [getCrowdStatus];
