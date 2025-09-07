// api/status.js
import { getLast, getById } from "./_mem";

export default function handler(req, res) {
  const { requestId } = req.query;
  if (requestId) {
    const item = getById(requestId);
    if (!item) return res.status(404).json({ error: "not found" });
    return res.json(item);
  }
  const last = getLast();
  if (!last) return res.status(404).json({ error: "no webhook received yet" });
  return res.json(last);
}
