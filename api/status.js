// api/status.js
import { getLast, getById } from "./_mem";

export default function handler(req, res) {
  const { requestId } = req.query;

  // если указали requestId — пытаемся вернуть саме его
  if (requestId) {
    const item = getById(requestId);
    if (!item) return res.status(404).json({ error: "not found (maybe another serverless instance)" });
    return res.json(item);
  }

  // иначе — последний полученный вебхук
  const last = getLast();
  if (!last) return res.status(404).json({ error: "no webhook received yet (try again later or check logs)" });
  return res.json(last);
}
