/**
 * Venue Explorer view — card grid of the 16 stadiums; selecting one loads the
 * full merged profile (gates, transit, accessibility, sustainability, matches).
 */
import { api } from '../api.js';
import { state, emit } from '../state.js';

const FLAGS = { USA: '🇺🇸', Canada: '🇨🇦', Mexico: '🇲🇽' };

function block(title, items) {
  const div = document.createElement('div');
  div.className = 'detail-block';
  const h4 = document.createElement('h4');
  h4.textContent = title;
  const ul = document.createElement('ul');
  for (const item of items.filter(Boolean)) {
    const li = document.createElement('li');
    li.textContent = item;
    ul.append(li);
  }
  div.append(h4, ul);
  return div;
}

async function showDetail(venueId) {
  const wrap = document.getElementById('venue-detail');
  wrap.hidden = false;
  wrap.textContent = 'Loading venue…';

  try {
    const v = await api.venue(venueId);
    wrap.replaceChildren();

    const h3 = document.createElement('h3');
    h3.textContent = `${FLAGS[v.country] ?? ''} ${v.name}`;
    const meta = document.createElement('p');
    meta.className = 'meta';
    meta.textContent = `${v.city}, ${v.country} · capacity ${v.capacity.toLocaleString()} · ${v.timezone}`;

    const grid = document.createElement('div');
    grid.className = 'detail-grid';
    grid.append(
      block(
        '🚪 Gates',
        v.operations.gates.map(
          (g) =>
            `Gate ${g.id} — ${g.compass}${g.security === 'express' ? ' · express lane' : ''}${g.accessible ? ' · accessible' : ''}`,
        ),
      ),
      block('🚆 Getting there', [
        v.transport.rail,
        v.transport.shuttle,
        v.transport.rideshare,
        v.transport.parking,
      ]),
      block('♿ Accessibility', v.operations.accessibility.services.slice(0, 5)),
      block('🌱 Sustainability', [
        v.operations.sustainability.recycling,
        v.operations.sustainability.transit_incentive,
      ]),
      block('🍽️ Good to know', [
        `Dietary: ${v.operations.amenities.dietary.join(', ')}`,
        v.operations.amenities.first_aid,
        v.operations.amenities.water,
      ]),
      block(
        '📅 Matches here',
        v.matches.length
          ? v.matches.map((m) => `${m.date} — ${m.round}`)
          : ['Group-stage fixtures completed at this venue.'],
      ),
    );

    const actions = document.createElement('div');
    actions.className = 'detail-actions';
    const ask = document.createElement('button');
    ask.className = 'btn btn-primary btn-sm';
    ask.textContent = `Ask StadiumIQ about ${v.city}`;
    ask.addEventListener('click', () => {
      document.getElementById('venue-select').value = v.id;
      emit('navigate', 'assistant');
      emit('ask', `I'm at ${v.name}. What should I know before kickoff?`);
    });
    const ops = document.createElement('button');
    ops.className = 'btn btn-ghost btn-sm';
    ops.textContent = 'Open in Ops Room';
    ops.addEventListener('click', () => {
      document.getElementById('ops-venue').value = v.id;
      emit('navigate', 'ops');
    });
    actions.append(ask, ops);

    wrap.append(h3, meta, grid, actions);
    wrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (err) {
    wrap.textContent = err.message;
  }
}

export function initVenues() {
  const grid = document.getElementById('venue-grid');
  const venues = state.meta?.venues ?? [];
  if (!venues.length || grid.childElementCount > 0) {
    // Grid already built — still honour a pending map selection.
    if (state.selectedVenueId) showDetail(state.selectedVenueId);
    return;
  }

  for (const v of venues) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'venue-card';
    const flag = document.createElement('span');
    flag.className = 'flag';
    flag.textContent = FLAGS[v.country] ?? '🏟️';
    const name = document.createElement('strong');
    name.textContent = v.name;
    const sub = document.createElement('span');
    sub.textContent = `${v.city} · ${v.capacity.toLocaleString()} seats`;
    card.append(flag, name, sub);
    card.addEventListener('click', () => showDetail(v.id));
    grid.append(card);
  }

  if (state.selectedVenueId) showDetail(state.selectedVenueId);
}
