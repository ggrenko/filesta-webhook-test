// api/ids.js
import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  const ids = await kv.lrange("filesta:requests", 0, 50);
  return res.json({ count: ids.length, ids });
}