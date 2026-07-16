/**
 * Stadium Map view — all 16 venues projected onto an SVG canvas.
 *
 * Uses a simple equirectangular projection of each stadium's real coordinates,
 * drawn as keyboard-accessible pins (role=button, Enter/Space activate).
 */
import { state, emit } from '../state.js';

const COUNTRY_COLOR = { USA: '#1d6fe0', Canada: '#dc2626', Mexico: '#12945f' };
const W = 1000;
const H = 640;
const PAD = 70;

function project(venues) {
  const lats = venues.map((v) => v.coordinates.lat);
  const lngs = venues.map((v) => v.coordinates.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  return (v) => ({
    x: PAD + ((v.coordinates.lng - minLng) / (maxLng - minLng)) * (W - PAD * 2),
    y: PAD + ((maxLat - v.coordinates.lat) / (maxLat - minLat)) * (H - PAD * 2),
  });
}

function svgEl(tag, attrs = {}) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

function showCard(venue) {
  const card = document.getElementById('map-card');
  card.replaceChildren();

  const h3 = document.createElement('h3');
  h3.textContent = venue.name;
  const meta = document.createElement('p');
  meta.textContent = `${venue.city}, ${venue.country} · capacity ${venue.capacity.toLocaleString()}`;

  const actions = document.createElement('p');
  const open = document.createElement('button');
  open.className = 'btn btn-primary btn-sm';
  open.textContent = 'Open venue guide';
  open.addEventListener('click', () => {
    state.selectedVenueId = venue.id;
    emit('navigate', 'venues');
  });
  const ask = document.createElement('button');
  ask.className = 'btn btn-ghost btn-sm';
  ask.textContent = 'Ask the assistant';
  ask.style.marginInlineStart = '0.5rem';
  ask.addEventListener('click', () => {
    document.getElementById('venue-select').value = venue.id;
    emit('navigate', 'assistant');
    emit('ask', `Give me a quick guide to ${venue.name}`);
  });
  actions.append(open, ask);

  card.append(h3, meta, actions);
  card.hidden = false;
}

export function initMap() {
  const svg = document.getElementById('venue-map');
  const venues = state.meta?.venues ?? [];
  if (!venues.length || svg.childElementCount > 0) return;

  // Backdrop: subtle graticule so the pins read as a map, not a scatter plot.
  svg.append(svgEl('rect', { width: W, height: H, fill: 'transparent' }));
  for (let x = PAD; x <= W - PAD; x += (W - PAD * 2) / 8) {
    svg.append(
      svgEl('line', {
        x1: x,
        y1: PAD / 2,
        x2: x,
        y2: H - PAD / 2,
        stroke: 'currentColor',
        'stroke-opacity': '0.06',
      }),
    );
  }
  for (let y = PAD; y <= H - PAD; y += (H - PAD * 2) / 6) {
    svg.append(
      svgEl('line', {
        x1: PAD / 2,
        y1: y,
        x2: W - PAD / 2,
        y2: y,
        stroke: 'currentColor',
        'stroke-opacity': '0.06',
      }),
    );
  }

  const toXY = project(venues);
  for (const venue of venues) {
    const { x, y } = toXY(venue);
    const g = svgEl('g', { class: 'map-pin', tabindex: '0', role: 'button' });
    g.setAttribute('aria-label', `${venue.name}, ${venue.city}, ${venue.country}`);

    g.append(
      svgEl('circle', {
        cx: x,
        cy: y,
        r: 8,
        fill: COUNTRY_COLOR[venue.country] ?? '#888',
        stroke: '#fff',
        'stroke-width': 2,
      }),
    );
    const label = svgEl('text', { x: x + 12, y: y + 4 });
    label.textContent = venue.city.split('/')[0].trim();
    g.append(label);

    const activate = () => showCard(venue);
    g.addEventListener('click', activate);
    g.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activate();
      }
    });
    svg.append(g);
  }
}
