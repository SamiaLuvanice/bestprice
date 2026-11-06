-- Dados de OUTRA conta (ops@exemplo.com) para provar isolamento (AC11). Banco descartável de QA.
\set ON_ERROR_STOP on
BEGIN;
WITH u AS (SELECT id FROM users WHERE email='ops@exemplo.com'),
p AS (INSERT INTO products (id, external_id, title, canonical_url, currency, price_context, availability, lookup_status, last_attempt_status, failure_count, current_price)
      VALUES ('11111111-1111-1111-1111-111111111111','MLB999000111','Produto da conta ops','https://www.mercadolivre.com.br/p/MLB999000111','BRL','regular','available','found','success',0,100.00) RETURNING id),
t AS (INSERT INTO tracked_products (id, user_id, product_id, active, active_since) SELECT '22222222-2222-2222-2222-222222222222', u.id, p.id, true, now() FROM u, p RETURNING id, user_id),
a AS (INSERT INTO price_alerts (id, tracked_product_id, target_price, currency, enabled, revision, episode, notified_in_episode) SELECT '33333333-3333-3333-3333-333333333333', t.id, 90.00, 'BRL', true, 1, 1, true FROM t RETURNING id, tracked_product_id)
INSERT INTO notifications (id, user_id, tracked_product_id, alert_id, revision, episode, type, product_title, observed_price, target_price, currency, observed_at)
SELECT '44444444-4444-4444-4444-444444444444', t.user_id, t.id, a.id, 1, 1, 'target_reached', 'Produto da conta ops', 89.90, 90.00, 'BRL', now() FROM t, a;
INSERT INTO research_conversations (id, user_id, title, created_at, updated_at, expires_at)
SELECT '55555555-5555-5555-5555-555555555555', id, 'Conversa da conta ops', now(), now(), now() + interval '30 days' FROM users WHERE email='ops@exemplo.com';
INSERT INTO research_messages (id, conversation_id, role, content, position, created_at)
VALUES ('66666666-6666-6666-6666-666666666666','55555555-5555-5555-5555-555555555555','user','Mensagem privada da ops',0,now());
COMMIT;
