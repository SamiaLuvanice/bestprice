"""AC08 fora do processo: uvicorn real + PostgreSQL real, cliente HTTP stdlib.

Cada envio usa uma origem distinta (cabeçalho do proxy confiável), então nenhum limite interfere.
Intercala os tipos para não favorecer nenhum. Uso: python ac08_http.py (lê TRUSTED_PROXY_SECRET do ambiente).
"""
import json, os, statistics, time, urllib.error, urllib.request, uuid

API = "http://127.0.0.1:8054/api/auth/login"
SECRET = os.environ["TRUSTED_PROXY_SECRET"]
counter = iter(range(1, 100000))

def post(email, password):
    n = next(counter)
    ip = f"10.{n // 65536 % 256}.{n // 256 % 256}.{n % 256}"
    req = urllib.request.Request(API, data=json.dumps({"email": email, "password": password}).encode(),
        headers={"Content-Type": "application/json", "x-bestprice-proxy-secret": SECRET, "x-bestprice-client-ip": ip})
    t = time.perf_counter()
    try:
        urllib.request.urlopen(req, timeout=10); status = 200
    except urllib.error.HTTPError as e:
        e.read(); status = e.code
    ms = (time.perf_counter() - t) * 1000
    assert status == 401, status
    return ms

for _ in range(3):
    post("qa0054@exemplo.com", "senha-errada-aquecimento")
missing, existing, oversized = [], [], []
for _ in range(30):
    missing.append(post(f"sem-conta-{uuid.uuid4().hex}@exemplo.com", "senha-errada-1234"))
    existing.append(post("qa0054@exemplo.com", "senha-errada-1234"))
    oversized.append(post("qa0054@exemplo.com", "x" * 1025))
m, e, o = (statistics.median(v) for v in (missing, existing, oversized))
print(f"n=30+30(+30); mediana sem conta={m:.1f} ms; com conta (senha errada)={e:.1f} ms; diferenca={abs(m-e)/max(m,e)*100:.1f}%")
print(f"mediana campo acima do maximo (senha 1025)={o:.1f} ms; diferenca vs com conta={abs(o-e)/max(o,e)*100:.1f}%")
print(f"min/max sem conta={min(missing):.1f}/{max(missing):.1f}; com conta={min(existing):.1f}/{max(existing):.1f}")
