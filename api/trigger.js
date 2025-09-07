// api/trigger.js
const ALLOWED = new Set(["envato", "freepik", "shutterstock", "motionarray", "adobestock"]);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });

  const { service, url } = req.body || {};
  if (!service || !url) return res.status(400).json({ error: "service and url are required" });
  if (!ALLOWED.has(service)) return res.status(400).json({ error: "service not allowed" });

  const apiKey = process.env.FILESTA_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "FILESTA_API_KEY not set on Vercel" });

  const r = await fetch("https://www.filesta.com/api/v1/download", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ service, url })
  });

  // пробуем JSON, иначе текст
  let data;
  try { data = await r.json(); }
  catch { data = { raw: await r.text() }; }

  return res.status(r.status).json(data);
}
