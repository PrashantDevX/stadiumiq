/**
 * Operational-intelligence tools for volunteers, staff and organizers.
 *
 * `report_incident` routes an issue to the right team; `get_operations_brief`
 * gives a live snapshot of crowd + open incidents for real-time decisions.
 * Both are authorization-gated in the tool registry — fans cannot call them.
 */
import { getVenue } from '../venueService.js';
import { estimateCrowd } from '../crowdModel.js';
import { incidentStore } from '../incidentStore.js';
import { buildOperationalPlan } from '../operationsPlanner.js';

export const reportIncident = {
  name: 'report_incident',
  declaration: {
    name: 'report_incident',
    description:
      'Log an operational incident (crowd, medical, security, accessibility blocker, spill, lost person) and route it to the responsible team. Staff/volunteer/organizer only.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['crowd', 'medical', 'security', 'accessibility', 'lost_person', 'spill', 'other'],
        },
        zone: {
          type: 'string',
          description: 'Where it is happening, e.g. "Gate C", "Section 210".',
        },
        description: { type: 'string', description: 'Brief description of the issue.' },
        severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
      },
      required: ['type', 'zone', 'description'],
    },
  },
  handler(args, context) {
    const incident = incidentStore.add({
      venueId: context.venueId,
      type: args.type,
      zone: args.zone,
      description: args.description,
      severity: args.severity,
    });
    return {
      logged: true,
      incidentId: incident.id,
      routedTo: incident.routedTo,
      severity: incident.severity,
      message: `Logged as ${incident.id} and routed to ${incident.routedTo}.`,
    };
  },
};

export const getOperationsBrief = {
  name: 'get_operations_brief',
  declaration: {
    name: 'get_operations_brief',
    description:
      'Return a live operations snapshot for a venue: current crowd level and a summary of open incidents by severity. Staff/organizer only.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        minutesToKickoff: {
          type: 'number',
          description: 'Minutes until kickoff (negative if under way).',
        },
        isEgress: {
          type: 'boolean',
          description:
            'True to assess post-match exit conditions instead of in-game concourse flow.',
        },
      },
    },
  },
  handler(args, context) {
    const venue = getVenue(args.venue ?? context.venueId);
    if (!venue) return { error: 'venue_not_found', message: 'I could not find that venue.' };

    const minutesToKickoff = args.minutesToKickoff ?? context.minutesToKickoff ?? 60;
    const crowd = estimateCrowd({
      minutesToKickoff,
      isEgress: args.isEgress ?? context.isEgress ?? false,
    });
    const incidents = incidentStore.summary({ venueId: venue.id });
    const activeIncidents = incidentStore.list({ venueId: venue.id });
    const recent = activeIncidents.slice(0, 5);
    const actionPlan = buildOperationalPlan({ crowd, incidents, activeIncidents });

    return {
      venue: venue.name,
      crowd: { level: crowd.level, estimatedWaitMinutes: crowd.waitMinutes, advice: crowd.advice },
      incidents,
      actionPlan,
      recentIncidents: recent.map((i) => ({
        id: i.id,
        type: i.type,
        zone: i.zone,
        severity: i.severity,
      })),
      recommendation: actionPlan.actions[0],
    };
  },
};

export const operationsTools = [reportIncident, getOperationsBrief];
