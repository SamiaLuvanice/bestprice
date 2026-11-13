#!/usr/bin/env bash
# QA 0054: cenários HTTP reais contra uvicorn (limites 3/5/1 min). Origem simulada pelo cabeçalho do proxy confiável.
S=/c/Users/luvan/AppData/Local/Temp/claude/e84fce5372d52fde/87dbc8a5-80d6-4437-a77b-22f3dcb1c794/scratchpad
. $S/qa-secrets.env
API=http://127.0.0.1:8054/api/auth/login
OK='senha-correta-qa-0054'
login() { # ip email senha
  curl -s -i -m 10 -X POST "$API" -H 'Content-Type: application/json' \
    -H "x-bestprice-proxy-secret: $TRUSTED_PROXY_SECRET" -H "x-bestprice-client-ip: $1" \
    --data "{\"email\":\"$2\",\"password\":\"$3\"}" | tr -d '\r' | grep -E '^HTTP|^retry-after|^set-cookie|^\{' | sed -E 's/(bestprice_session=)[^;]+/\1<token>/'
}
echo "== 422 corpo nao JSON (text/plain), origem 198.51.100.1"
curl -s -i -m 10 -X POST "$API" -H 'Content-Type: text/plain' -H "x-bestprice-proxy-secret: $TRUSTED_PROXY_SECRET" -H 'x-bestprice-client-ip: 198.51.100.1' --data 'email=a&password=b' | tr -d '\r' | grep -E '^HTTP|^\{'
echo "== 422 JSON invalido, origem 198.51.100.1"
curl -s -i -m 10 -X POST "$API" -H 'Content-Type: application/json' -H "x-bestprice-proxy-secret: $TRUSTED_PROXY_SECRET" -H 'x-bestprice-client-ip: 198.51.100.1' --data '{"email":' | tr -d '\r' | grep -E '^HTTP|^\{'
echo "== AC02 origem A=203.0.113.10: 3 senhas erradas"
for i in 1 2 3; do login 203.0.113.10 qa0054@exemplo.com errada-$i; done
echo "== AC02 4o envio com senha correta (esperado 429, sem cookie)"
login 203.0.113.10 qa0054@exemplo.com "$OK"
echo "== AC09 continua enviando durante a espera (2s depois): Retry-After nao aumenta"
sleep 2; login 203.0.113.10 qa0054@exemplo.com errada-x; login 203.0.113.10 qa0054@exemplo.com "$OK"
echo "== AC06 outra origem B=203.0.113.20, senha correta"
login 203.0.113.20 qa0054@exemplo.com "$OK"
echo "== AC07 origem D=203.0.113.40 e-mail COM conta x origem E=203.0.113.50 e-mail SEM conta (3 falhas + 1)"
for i in 1 2 3 4; do login 203.0.113.40 outra0054@exemplo.com errada-$i; done
for i in 1 2 3 4; do login 203.0.113.50 naoexiste0054@exemplo.com errada-$i; done
echo "== AC03 origem C=203.0.113.30: 5 falhas em e-mails diferentes (2 por e-mail + malformado)"
login 203.0.113.30 x1@exemplo.com e1; login 203.0.113.30 x2@exemplo.com e2; login 203.0.113.30 x3@exemplo.com e3; login 203.0.113.30 x4@exemplo.com e4
curl -s -i -m 10 -X POST "$API" -H 'Content-Type: text/plain' -H "x-bestprice-proxy-secret: $TRUSTED_PROXY_SECRET" -H 'x-bestprice-client-ip: 203.0.113.30' --data 'x' | tr -d '\r' | grep -E '^HTTP'
echo "== AC03 e-mail sem falhas proprias com senha correta (esperado 429)"
login 203.0.113.30 outra0054@exemplo.com "$OK"
echo "== AC03 corpo malformado na origem bloqueada (esperado 429)"
curl -s -i -m 10 -X POST "$API" -H 'Content-Type: text/plain' -H "x-bestprice-proxy-secret: $TRUSTED_PROXY_SECRET" -H 'x-bestprice-client-ip: 203.0.113.30' --data 'x' | tr -d '\r' | grep -E '^HTTP|^retry-after|^\{'
