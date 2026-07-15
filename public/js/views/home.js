/**
 * Home view — hero countdown to the final and the finals-week schedule strip.
 */
import { api } from '../api.js';

const FINAL_KICKOFF_UTC = '2026-07-19T19:00:00Z'; // ceremonial 3pm ET window (assumed)

let timer = null;

function renderCountdown() {
  const target = new Date(FINAL_KICKOFF_UTC).getTime();
  const el = document.getElementById('countdown-digits');
  if (!el) return;

  const tick = () => {
    const diff = Math.max(0, target - Date.now());
    const d = Math.floor(diff / 86_400_000);
    const h = Math.floor(diff / 3_600_000) % 24;
    const m = Math.floor(diff / 60_000) % 60;
    const s = Math.floor(diff / 1000) % 60;
    const units = [
      [d, 'days'],
      [h, 'hours'],
      [m, 'mins'],
      [s, 'secs'],
    ];
    el.replaceChildren(
      ...units.map(([value, label]) => {
        const unit = document.createElement('div');
        unit.className = 'unit';
        const strong = document.createElement('strong');
        strong.textContent = String(value).padStart(2, '0');
        const span = document.createElement('span');
        span.textContent = label;
        unit.append(strong, span);
        return unit;
      }),
    );
  };

  tick();
  clearInterval(timer);
  timer = setInterval(tick, 1000);
}

async function renderSchedule() {
  const wrap = document.getElementById('home-schedule');
  try {
    const { matches } = await api.schedule();
    wrap.replaceChildren(
      ...matches.slice(-6).map((m) => {
        const card = document.createElement('div');
        card.className = `match-card${m.round.includes('FINAL') ? ' final' : ''}`;
        const round = document.createElement('div');
        round.className = 'round';
        round.textContent = `${m.date} · ${m.round}`;
        const fixture = document.createElement('div');
        fixture.className = 'fixture';
        fixture.textContent = `${m.home} vs ${m.away}`;
        const where = document.createElement('div');
        where.className = 'where';
        where.textContent = `📍 ${m.venueName}`;
        card.append(round, fixture, where);
        return card;
      }),
    );
  } catch {
    wrap.textContent = 'Schedule unavailable right now.';
  }
}

export function initHome() {
  renderCountdown();
  renderSchedule();
}
