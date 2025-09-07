// api/webhook.js
import { saveEvent } from "./_mem";

export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });

  const secret = req.query.secret;
  const expected = process.env.FILESTA_WEBHOOK_SECRET || "ad9cc594-0bef-644c-09ab-bb76e43ec245";
  if (secret !== expected) return res.status(403).json({ error: "forbidden" });

  const body = req.body || {};
  saveEvent(body);

  if (body?.status === "completed") {
    return res.json({
      ok: true,
      requestId: body.requestId,
      downloadUrl: body.result?.downloadUrl,
    });
  }
  if (body?.status === "failed") {
    return res.json({
      ok: false,
      requestId: body.requestId,
      error: body.result?.error,
    });
  }
  return res.json({ ok: true, received: true, requestId: body.requestId });
}
