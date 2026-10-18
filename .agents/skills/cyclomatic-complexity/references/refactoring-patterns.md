# Reduzindo complexidade ciclomática: padrões por causa

Cada estrutura de decisão (`if`, `elif`, `for`, `while`, `and`, `or`, `except`,
`with` condicional, comprehension com `if`, expressão ternária, `assert`, `case`)
soma +1 ao CC. Baixar o número é consequência de eliminar a decisão, não de
escondê-la em outra função.

---

## 1. Guard clauses no lugar de aninhamento

O aninhamento não aumenta o CC mais que o `if` plano, mas dispara o crescimento
porque cada nível convida a mais ramos. Inverta e saia cedo.

```python
# Antes — CC cresce e a leitura exige empilhar contexto
def process(order):
    if order is not None:
        if order.status == "pending":
            if order.user.has_active_plan:
                return charge(order)
            else:
                return deny(order)
        else:
            return None
    return None

# Depois — mesmo comportamento, cada condição isolada
def process(order):
    if order is None:
        return None
    if order.status != "pending":
        return None
    if not order.user.has_active_plan:
        return deny(order)
    return charge(order)
```

---

## 2. Dispatch por dicionário no lugar de `if/elif` longo

Cadeias sobre um valor discreto (tipo de evento, status, provedor) viram tabela.
O CC do dispatcher cai para ~1 e cada handler é testável isoladamente.

```python
# Antes — CC = 6 e cresce a cada novo evento
def handle(event):
    if event.type == "PRICE_CHANGED":
        ...
    elif event.type == "STOCK_CHANGED":
        ...
    elif event.type == "LISTING_REMOVED":
        ...

# Depois — CC = 2, extensível sem tocar no dispatcher
HANDLERS = {
    "PRICE_CHANGED": handle_price,
    "STOCK_CHANGED": handle_stock,
    "LISTING_REMOVED": handle_removed,
}

def handle(event):
    handler = HANDLERS.get(event.type)
    if handler is None:
        logger.warning("evento não tratado: %s", event.type)
        return
    handler(event)
```

O mesmo vale para escolher schema, query ou resposta por parâmetro de rota.

---

## 3. Validações encadeadas → lista de regras

```python
# Antes — cada regra soma +1, a função vira um muro
def validate(product):
    if not product.title:
        raise ValidationError("titulo obrigatorio")
    if product.price <= 0:
        raise ValidationError("preco invalido")
    if product.stock < 0:
        raise ValidationError("estoque negativo")
    ...

# Depois — CC = 3, regras viram dados
RULES = [
    (lambda p: bool(p.title), "titulo obrigatorio"),
    (lambda p: p.price > 0, "preco invalido"),
    (lambda p: p.stock >= 0, "estoque negativo"),
]

def validate(product):
    for check, message in RULES:
        if not check(product):
            raise ValidationError(message)
```

No BestPrice, prefira validação nos schemas Pydantic das rotas — o framework já
faz esse laço antes de chegar ao serviço.

---

## 4. Condições booleanas compostas → predicado nomeado

`and`/`or` somam ao CC e escondem a intenção.

```python
# Antes — CC +4 numa linha
if user.is_active and user.plan != "NONE" and not user.is_blocked and user.verified:
    ...

# Depois — a condição ganha nome e a rota fica com CC +1
# app/auth/models.py
@property
def can_monitor(self) -> bool:
    return (
        self.is_active
        and self.plan != Plan.NONE
        and not self.is_blocked
        and self.verified
    )

if user.can_monitor:
    ...
```

O CC total não some — migra para onde é coeso e fácil de testar direto.

---

## 5. `try/except` amplo → escopo mínimo

Cada `except` soma +1. Um `try` que envolve 40 linhas com 5 handlers também
mascara qual linha falhou.

```python
# Antes
def refresh_listing(listing):
    try:
        payload = build_payload(listing)
        data = client.fetch(payload)
        persist(data)
    except httpx.HTTPError:
        ...
    except ValidationError:
        ...
    except Exception:
        ...

# Depois — cada trecho protege só o que pode falhar daquele jeito
def refresh_listing(listing):
    payload = build_payload(listing)
    data = _fetch(payload)     # trata httpx.HTTPError
    _persist(data)             # trata ValidationError
```

---

## 6. Rotas FastAPI gordas → camada de serviço

O padrão mais comum de rank D/E neste projeto: uma rota que valida, consulta,
decide, escreve e monta resposta. O backend já separa camadas em
`app/products/service.py` — siga o mesmo formato.

```python
# Antes — CC 24 numa única rota
@router.post("/products")
def create_product(payload: ProductPayload):
    ...  # validação, quota, escrita, alerta, tratamento de erro

# Depois — rota fina, regra em serviço
@router.post("/products", status_code=201)
def create_product(payload: ProductPayload, session: Session = Depends(get_session)):
    product = product_service.create(session, payload)
    return ProductRead.model_validate(product)
```

O serviço concentra a decisão, roda sem `Request`/`Response` e é testável sem
cliente HTTP — em FastAPI isso ainda permite manter as rotas síncronas ou
assíncronas conforme a regra de event loop de `.agents/rules/backend.md`.

---

## 7. Laços com filtro → query SQLAlchemy ou comprehension

```python
# Antes — CC 4, e provável N+1
results = []
for product in session.scalars(select(Product)).all():
    if product.is_active:
        for alert in product.alerts:
            if alert.enabled:
                results.append(alert)

# Depois — CC 1, uma query
results = session.scalars(
    select(Alert)
    .join(Product)
    .where(Product.is_active.is_(True), Alert.enabled.is_(True))
    .options(selectinload(Alert.product))
).all()
```

Ganho duplo: menos ramos e menos consultas.

---

## Quando **não** refatorar

- **Migrations do Alembic** — geradas pelo revisor de migração; complexidade
  linear própria do formato.
- **Dispatchers de protocolo externo** já em forma de tabela, onde o `if` restante
  é o fallback.
- **Parsers/máquinas de estado** cuja complexidade é intrínseca ao formato; nesse
  caso, invista em testes de caso-limite em vez de extrair funções.
- **Blocos de configuração declarativa** (`config.py`, `Settings`, mapeamentos).

Quando um bloco é legitimamente complexo, documente o porquê num comentário curto
e cubra os caminhos com teste. Um rank D justificado e testado é melhor que seis
helpers de uso único espalhados pelo módulo.
