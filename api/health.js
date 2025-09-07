// api/health.js
import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  try {
    const pingKey = "filesta:health:ping";
    await kv.set(pingKey, Date.now(), { ex: 60 });
    const val = await kv.get(pingKey);
    return res.json({ ok: true, kv: true, sample: val });
  } catch (e) {
    return res.status(500).json({ ok: false, kv: false, error: String(e) });
  }
}