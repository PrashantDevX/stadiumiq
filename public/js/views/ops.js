/**
 * Operations Room view — gate-load meters, crowd forecast and incident
 * intelligence, driven by the deterministic crowd model on the server.
 */
import { api } from '../api.js';
import { state } from '../state.js';

function meterRow(gate) {
  const row = document.createElement('div');
  row.className = 'gate-row';

  const label = document.createElement('span');
  label.className = 'g-label';
  label.textContent = `Gate ${gate.gate} · ${gate.compass}${gate.security === 'express' ? ' ⚡' : ''}`;

  const meter = document.createElement('div');
  meter.className = 'meter';
  meter.setAttribute('role', 'meter');
  meter.setAttribute('aria-label', `Gate ${gate.gate} load`);
  meter.setAttribute('aria-valuemin', '0');
  meter.setAttribute('aria-valuemax', '3');
  meter.setAttribute('aria-valuenow', String(gate.score));
  const bar = document.createElement('i');
  bar.className = `lvl-${gate.level}`;
  bar.style.width = `${Math.max(6, (gate.score / 3) * 100)}%`;
  meter.append(bar);

  const wait = document.createElement('span');
  wait.className = 'g-wait';
  wait.textContent = `~${gate.waitMinutes} min`;

  row.append(label, meter, wait);
  return row;
}

function card(title) {
  const el = document.createElement('div');
  el.className = 'ops-card';
  const h3 = document.createElement('h3');
  h3.textContent = title;
  el.append(h3);
  return el;
}

async function refresh() {
  const venueId = document.getElementById('ops-venue').value;
  const minutes = Number(document.getElementById('ops-minutes').value);
  const board = document.getElementById('ops-board');
  if (!venueId) return;

  try {
    const ops = await api.ops(venueId, minutes);
    board.replaceChildren();

    // Overall status
    const overall = card(`📊 ${ops.venue.name} — overall`);
    const badge = document.createElement('p');
    const level = document.createElement('span');
    level.className = `badge ${ops.overall.level}`;
    level.textContent = ops.overall.level.replace('_', ' ');
    badge.append(level, document.createTextNode(` ~${ops.overall.waitMinutes} min queues`));
    const advice = document.createElement('p');
    advice.textContent = ops.overall.advice;
    advice.style.fontSize = '0.87rem';
    overall.append(badge, advice);

    // Gate meters
    const gates = card('🚪 Gate load');
    for (const g of ops.gates) gates.append(meterRow(g));

    // Incidents
    const inc = card(`🚨 Incidents — ${ops.incidents.open} open`);
    const counts = document.createElement('p');
    counts.style.fontSize = '0.85rem';
    counts.textContent = `critical ${ops.incidents.bySeverity.critical} · high ${ops.incidents.bySeverity.high} · medium ${ops.incidents.bySeverity.medium} · low ${ops.incidents.bySeverity.low}`;
    inc.append(counts);
    if (ops.recentIncidents.length) {
      for (const i of ops.recentIncidents) {
        const row = document.createElement('div');
        row.className = 'incident-row';
        const what = document.createElement('span');
        what.textContent = `${i.id} · ${i.type} @ ${i.zone}`;
        const sev = document.createElement('span');
        sev.className = `badge ${i.severity === 'critical' ? 'very_high' : i.severity === 'high' ? 'high' : i.severity === 'medium' ? 'moderate' : 'low'}`;
        sev.textContent = i.severity;
        row.append(what, sev);
        inc.append(row);
      }
    } else {
      const empty = document.createElement('p');
      empty.style.fontSize = '0.85rem';
      empty.textContent = 'No incidents logged. Report one via the AI Assistant as Staff/Volunteer.';
      inc.append(empty);
    }

    board.append(overall, gates, inc);
  } catch (err) {
    board.textContent = err.message;
  }
}

export function initOps() {
  const select = document.getElementById('ops-venue');
  if (select.childElementCount === 0) {
    for (const v of state.meta?.venues ?? []) {
      select.append(new Option(`${v.name} — ${v.city}`, v.id));
    }
    const slider = document.getElementById('ops-minutes');
    const out = document.getElementById('ops-minutes-out');
    slider.addEventListener('input', () => {
      out.textContent = slider.value;
    });
    slider.addEventListener('change', refresh);
    select.addEventListener('change', refresh);
    document.getElementById('ops-refresh').addEventListener('click', refresh);
  }
  refresh();
}
