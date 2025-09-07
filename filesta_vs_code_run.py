# filesta_vs_code_run.py
# Скрипт запускает задачу в Filesta и ждёт downloadUrl,
# опрашивая твой Vercel /api/status?requestId=...
# Зависимости: pip install requests

import time
import json
import sys
from typing import Optional
import requests

# ============= НАСТРОЙКИ (правь при необходимости) =============
FILESTA_API_KEY = "7aba5147fd74c1f0129032540eb94a098460a42b43de974d2f518978f6932336"  # твой ключ Filesta (не vercel)
SERVICE = "envato"
ITEM_URL = "https://elements.envato.com/computer-scientist-running-ai-cognitive-computing--DQHNFQN"

# Filesta endpoint (фиксированный)
FILESTA_DOWNLOAD_ENDPOINT = "https://www.filesta.com/api/v1/download"

# Твой домен на Vercel со статус-эндпоинтом (KV-версия, чтобы не терялось)
VERCEL_STATUS_URL = "https://filesta-webhook-test.vercel.app/api/status"

# Поллинг
POLL_INTERVAL_SEC = 5         # каждые 5 сек проверяем
POLL_TIMEOUT_SEC = 15 * 60    # максимум 15 минут

# ============= КОД =============

def trigger_download(service: str, url: str) -> str:
    """Отправляет POST в Filesta, возвращает requestId или падает с ошибкой."""
    headers = {
        "Authorization": f"Bearer {FILESTA_API_KEY}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    payload = {"service": service, "url": url}
    print(f"[1/3] Стартую Filesta: service={service}, url={url}")
    r = requests.post(FILESTA_DOWNLOAD_ENDPOINT, headers=headers, json=payload, timeout=30)
    text = r.text
    try:
        data = r.json()
    except Exception:
        data = {"raw": text}

    if r.status_code != 202:
        print(f"❌ Filesta ответила {r.status_code}: {text}")
        sys.exit(1)

    req_id = (data or {}).get("requestId")
    if not req_id:
        print(f"❌ Нет requestId в ответе: {json.dumps(data, ensure_ascii=False)}")
        sys.exit(1)

    print(f"✅ Принято. requestId={req_id}")
    return req_id


def fetch_status_from_vercel(request_id: str) -> Optional[dict]:
    """Возвращает JSON вебхука для requestId из твоего /api/status, либо None (если ещё нет)."""
    url = f"{VERCEL_STATUS_URL}?requestId={request_id}"
    try:
        resp = requests.get(url, timeout=15)
    except Exception as e:
        print(f"⚠️ Ошибка запроса статуса: {e}")
        return None

    if resp.status_code == 200:
        try:
            return resp.json()
        except Exception:
            return None
    return None


def wait_for_download_url(request_id: str) -> Optional[str]:
    """Ждёт вебхук, возвращает downloadUrl; если fail — печатает ошибку и возвращает None."""
    print(f"[2/3] Жду вебхук → опрашиваю: {VERCEL_STATUS_URL}?requestId={request_id}")
    print(f"     (каждые {POLL_INTERVAL_SEC} сек., максимум {POLL_TIMEOUT_SEC//60} мин)")

    deadline = time.time() + POLL_TIMEOUT_SEC
    while time.time() < deadline:
        payload = fetch_status_from_vercel(request_id)
        if payload:
            status = payload.get("status")
            result = payload.get("result") or {}
            if status == "completed":
                return result.get("downloadUrl")
            if status == "failed":
                print(f"❌ Filesta вернула ошибку: {result.get('error')}")
                return None
        time.sleep(POLL_INTERVAL_SEC)

    print("⏳ Таймаут. Возможно, вебхук ещё в пути или смотри логи Vercel.")
    return None


def main():
    if not FILESTA_API_KEY or len(FILESTA_API_KEY) < 20:
        print("❌ FILESTA_API_KEY пустой/неверный. Укажи вверху файла.")
        sys.exit(1)
    if not ITEM_URL.startswith("http"):
        print("❌ ITEM_URL должен быть валидным URL площадки.")
        sys.exit(1)

    req_id = trigger_download(SERVICE, ITEM_URL)
    url = wait_for_download_url(req_id)

    print("\n[3/3] Результат:")
    if url:
        print(f"✅ downloadUrl: {url}")
        sys.exit(0)
    else:
        print("⚠️ downloadUrl не получен в отведённое время.")
        print("   Проверь Vercel → Deployments → View Functions Logs (строки 'WEBHOOK: ...').")
        sys.exit(2)


if __name__ == "__main__":
    main()
