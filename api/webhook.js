// api/webhook.js
import { saveEvent } from "./_mem";

export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });

  // проверяем секрет из query (?secret=...)
  const expected = process.env.FILESTA_WEBHOOK_SECRET || "ad9cc594-0bef-644c-09ab-bb76e43ec245";
  if (req.query.secret !== expected) return res.status(403).json({ error: "forbidden" });

  const body = req.body || {};
  // лог — смотри в Vercel → Deployments → View Functions Logs
  console.log("WEBHOOK:", JSON.stringify(body));

  // сохраняем в "оперативную память" инстанса (для быстрых тестов ок)
  saveEvent(body);

  if (body?.status === "completed") {
    return res.json({
      ok: true,
      requestId: body.requestId,
      downloadUrl: body.result?.downloadUrl,
      timestamp: body.timestamp
    });
  }

  if (body?.status === "failed") {
    return res.json({
      ok: false,
      requestId: body.requestId,
      error: body.result?.error,
      timestamp: body.timestamp
    });
  }

  return res.json({ ok: true, received: true, requestId: body.requestId });
}
