/**
 * Venue & tournament data endpoints for the interactive UI.
 *   GET /api/schedule            — knockout calendar (optionally ?venue=)
 *   GET /api/venues/:id          — full merged profile for the venue explorer
 *   GET /api/venues/:id/ops      — live ops snapshot (crowd + incidents) for the dashboard
 */
import { Router } from 'express';
import { getVenue } from '../services/venueService.js';
import { estimateCrowd } from '../services/crowdModel.js';
import { incidentStore } from '../services/incidentStore.js';
import { getMatches, TOURNAMENT } from '../data/matches.js';

const router = Router();

router.get('/schedule', (req, res) => {
  const venue = req.query.venue ? getVenue(String(req.query.venue)) : null;
  res.json({
    tournament: TOURNAMENT,
    matches: getMatches({ venueId: venue?.id }).map((m) => ({
      ...m,
      venueName: getVenue(m.venueId)?.name ?? m.venueId,
    })),
  });
});

router.get('/venues/:id', (req, res) => {
  const venue = getVenue(req.params.id);
  if (!venue) {
    return res.status(404).json({ error: 'venue_not_found', message: 'Unknown venue.' });
  }
  res.json({ ...venue, matches: getMatches({ venueId: venue.id }) });
});

router.get('/venues/:id/ops', (req, res) => {
  const venue = getVenue(req.params.id);
  if (!venue) {
    return res.status(404).json({ error: 'venue_not_found', message: 'Unknown venue.' });
  }
  const minutesToKickoff = Number.parseInt(String(req.query.minutesToKickoff ?? '60'), 10);
  const safeMinutes = Number.isFinite(minutesToKickoff) ? minutesToKickoff : 60;

  // Per-gate view drives the dashboard's gate-load meters.
  const gates = venue.operations.gates.map((g) => ({
    gate: g.id,
    compass: g.compass,
    security: g.security,
    ...estimateCrowd({
      minutesToKickoff: safeMinutes,
      gateFlow: g.security === 'express' ? 'express' : 'standard',
    }),
  }));

  res.json({
    venue: { id: venue.id, name: venue.name, city: venue.city },
    minutesToKickoff: safeMinutes,
    overall: estimateCrowd({ minutesToKickoff: safeMinutes }),
    gates,
    incidents: incidentStore.summary({ venueId: venue.id }),
    recentIncidents: incidentStore
      .list({ venueId: venue.id })
      .slice(0, 6)
      .map((i) => ({
        id: i.id,
        type: i.type,
        zone: i.zone,
        severity: i.severity,
        status: i.status,
      })),
  });
});

export default router;
