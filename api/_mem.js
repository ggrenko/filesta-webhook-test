// api/_mem.js
let last = null;
const byId = new Map();

export function saveEvent(e) {
  last = e;
  if (e?.requestId) byId.set(e.requestId, e);
}
export function getLast() { return last; }
export function getById(id) { return byId.get(id) || null; }
