import os, json
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
import httpx

API_KEY = os.getenv("FILESTA_API_KEY", "7aba5147fd74c1f0129032540eb94a098460a42b43de974d2f518978f6932336")
WEBHOOK_SECRET = os.getenv("FILESTA_WEBHOOK_SECRET", "ad9cc594-0bef-644c-09ab-bb76e43ec245")

app = FastAPI(title="Filesta test")

# Память для статусов (в проде — БД)
STAT = {}

@app.post("/trigger")
async def trigger_download(payload: dict):
    """
    payload: {"service": "envato", "url": "https://elements.envato.com/..."}
    """
    if "service" not in payload or "url" not in payload:
        raise HTTPException(status_code=400, detail="service and url are required")

    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(
            "https://www.filesta.com/api/v1/download",
            headers={
                "Authorization": f"Bearer {API_KEY}",
                "Content-Type": "application/json"
            },
            json={"service": payload["service"], "url": payload["url"]}
        )
    # Ожидаем 202 с requestId
    try:
        data = r.json()
    except Exception:
        data = {"raw": r.text}
    return JSONResponse(status_code=r.status_code, content=data)

@app.post("/filesta/webhook")
async def filesta_webhook(request: Request):
    # проверяем секрет из query (?secret=...)
    secret = request.query_params.get("secret")
    if secret != WEBHOOK_SECRET:
        raise HTTPException(status_code=403, detail="forbidden")

    body = await request.body()
    try:
        data = json.loads(body.decode("utf-8") or "{}")
    except Exception:
        data = {}
    req_id = data.get("requestId")
    STAT[req_id] = data

    # Если completed — вытянем downloadUrl для удобства
    resp = {"ok": True}
    if data.get("status") == "completed":
        resp["downloadUrl"] = (data.get("result") or {}).get("downloadUrl")
    elif data.get("status") == "failed":
        resp["error"] = (data.get("result") or {}).get("error")

    return resp

@app.get("/status/{request_id}")
async def get_status(request_id: str):
    data = STAT.get(request_id)
    if not data:
        raise HTTPException(status_code=404, detail="Unknown requestId yet")
    return data
