/**
 * Stadium sound effects — synthesized with the Web Audio API.
 *
 * No audio files are shipped (repo stays tiny): a referee whistle is two
 * detuned square oscillators, and the crowd is filtered noise with a slow
 * swell. Sound is OFF by default, toggled by the user, persisted, and
 * automatically disabled when the OS asks for reduced motion — an
 * accessibility-first take on "stadium atmosphere".
 */

let ctx = null;
let enabled = false;

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function audioContext() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function isSoundEnabled() {
  return enabled;
}

export function setSoundEnabled(value) {
  enabled = Boolean(value) && !prefersReducedMotion();
  localStorage.setItem('siq-sound', enabled ? 'on' : 'off');
  return enabled;
}

export function restoreSoundPreference() {
  enabled = localStorage.getItem('siq-sound') === 'on' && !prefersReducedMotion();
  return enabled;
}

/** Short referee-whistle chirp (used on send + sound-on). */
export function playWhistle() {
  if (!enabled) return;
  try {
    const ac = audioContext();
    const now = ac.currentTime;
    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    gain.connect(ac.destination);

    for (const freq of [2450, 2489]) {
      const osc = ac.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now);
      // The warble that makes it read as a pea whistle.
      const lfo = ac.createOscillator();
      const lfoGain = ac.createGain();
      lfo.frequency.value = 30;
      lfoGain.gain.value = 60;
      lfo.connect(lfoGain).connect(osc.frequency);
      osc.connect(gain);
      osc.start(now);
      osc.stop(now + 0.3);
      lfo.start(now);
      lfo.stop(now + 0.3);
    }
  } catch {
    /* audio is a garnish — never break the app over it */
  }
}

/** Soft crowd swell (used when a reply arrives). */
export function playCrowd() {
  if (!enabled) return;
  try {
    const ac = audioContext();
    const now = ac.currentTime;
    const dur = 1.2;

    const buffer = ac.createBuffer(1, ac.sampleRate * dur, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;

    const noise = ac.createBufferSource();
    noise.buffer = buffer;

    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 900;
    filter.Q.value = 0.7;

    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.06, now + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    noise.connect(filter).connect(gain).connect(ac.destination);
    noise.start(now);
    noise.stop(now + dur);
  } catch {
    /* ignore */
  }
}
