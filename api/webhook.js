// api/webhook.js
import { kv } from "@vercel/kv";

export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });

  const expected = process.env.FILESTA_WEBHOOK_SECRET || "ad9cc594-0bef-644c-09ab-bb76e43ec245";
  if (req.query.secret !== expected) return res.status(403).json({ error: "forbidden" });

  const body = req.body || {};
  const requestId = body?.requestId;

  // лог в функции — смотрится в Vercel → Deployments → View Functions Logs
  console.log("WEBHOOK:", JSON.stringify(body));

  // Сохранить в KV
  if (requestId) {
    await kv.set(`filesta:request:${requestId}`, body, { ex: 60 * 60 * 24 * 7 }); // 7 дней
    await kv.set("filesta:last", body, { ex: 60 * 60 * 24 * 7 });
    await kv.lpush("filesta:requests", requestId);
    await kv.ltrim("filesta:requests", 0, 199); // только последние 200
  }

  if (body?.status === "completed") {
    return res.json({ ok: true, requestId, downloadUrl: body.result?.downloadUrl, timestamp: body.timestamp, stored: true });
  }
  if (body?.status === "failed") {
    return res.json({ ok: false, requestId, error: body.result?.error, timestamp: body.timestamp, stored: true });
  }
  return res.json({ ok: true, received: true, requestId, stored: Boolean(requestId) });
}
