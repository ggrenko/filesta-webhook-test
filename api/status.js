// api/status.js
import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  const { requestId } = req.query;

  if (requestId) {
    const item = await kv.get(`filesta:request:${requestId}`);
    if (!item) return res.status(404).json({ error: "not found" });
    return res.json(item);
  }

  const last = await kv.get("filesta:last");
  if (!last) return res.status(404).json({ error: "no webhook yet" });
  return res.json(last);
}
