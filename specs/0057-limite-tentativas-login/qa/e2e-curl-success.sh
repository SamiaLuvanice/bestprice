#!/usr/bin/env bash
# QA 0054 (HEAD ae20bce): caminhos de sucesso após o ajuste de record_success. Limites 3/5/1 min.
S=/c/Users/luvan/AppData/Local/Temp/claude/e84fce5372d52fde/87dbc8a5-80d6-4437-a77b-22f3dcb1c794/scratchpad
. $S/qa-secrets.env
API=http://127.0.0.1:8054/api
OK='senha-correta-qa-0054'
code() { # ip email senha [cookiejar]
  curl -s -o /dev/null -w "%{http_code} retry-after=%header{retry-after}" ${4:+-c $4} -X POST "$API/auth/login" -H 'Content-Type: application/json' \
    -H "x-bestprice-proxy-secret: $TRUSTED_PROXY_SECRET" -H "x-bestprice-client-ip: $1" --data "{\"email\":\"$2\",\"password\":\"$3\"}"; echo; }
echo "== AC01 (escala 3): origem 203.0.113.70, 2 falhas e senha correta"
code 203.0.113.70 qa0054@exemplo.com e1; code 203.0.113.70 qa0054@exemplo.com e2; code 203.0.113.70 qa0054@exemplo.com "$OK"
echo "== AC05 (escala 3/5): mesma origem, mais 2 falhas e senha correta -> 200 (combinacao zerada)"
code 203.0.113.70 qa0054@exemplo.com e3; code 203.0.113.70 qa0054@exemplo.com e4; code 203.0.113.70 qa0054@exemplo.com "$OK"
echo "== AC05: contagem por origem manteve as 4 falhas -> 1 falha em outro e-mail (5a) e a seguinte e recusada pela origem"
code 203.0.113.70 x9@exemplo.com e5; code 203.0.113.70 outra0054@exemplo.com "$OK"
echo "== linhas da combinacao vs origem (psql)"
docker exec bestprice-0054-qa-pg psql -U bestprice -d bestprice_qa -At -c "select source_hash, count(*) total, count(account_hash) com_email from login_failures group by source_hash order by total desc limit 3" | sed -E 's/^([0-9a-f]{8})[0-9a-f]{56}/\1…/'
echo "== AC17: sessao aberta (203.0.113.80) e bloqueio da origem 203.0.113.81 para o mesmo e-mail"
code 203.0.113.80 qa0054@exemplo.com "$OK" $S/cj2.txt
for i in 1 2 3; do code 203.0.113.81 qa0054@exemplo.com err$i; done; code 203.0.113.81 qa0054@exemplo.com "$OK"
curl -s -b $S/cj2.txt -o /dev/null -w "GET /api/auth/me: %{http_code}\n" $API/auth/me
curl -s -b $S/cj2.txt -o /dev/null -w "GET /api/dashboard: %{http_code}\n" $API/dashboard
echo "== AC06: outra origem 203.0.113.82 com senha correta"
code 203.0.113.82 qa0054@exemplo.com "$OK"
