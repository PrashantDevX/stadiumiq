/**
 * Minimal fetch helpers for the StadiumIQ API.
 */

async function request(path, options) {
  const res = await fetch(path, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Request failed (${res.status})`);
  }
  return res.json();
}

export const api = {
  meta: () => request('/api/meta'),
  schedule: (venueId) =>
    request(`/api/schedule${venueId ? `?venue=${encodeURIComponent(venueId)}` : ''}`),
  venue: (id) => request(`/api/venues/${encodeURIComponent(id)}`),
  ops: (id, minutes, isEgress = false) =>
    request(
      `/api/venues/${encodeURIComponent(id)}/ops?minutesToKickoff=${encodeURIComponent(minutes)}&isEgress=${isEgress}`,
    ),
  chat: (messages, context) =>
    request('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, context }),
    }),
};
