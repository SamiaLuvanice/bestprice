import logging
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime

from sqlalchemy import exists, or_, select
from sqlalchemy.orm import Session

from app.db import create_database_engine
from app.errors import ApiError
from app.monitoring.settings import load_monitoring_settings
from app.products.locking import ListingBusy
from app.products.models import Product, TrackedProduct
from app.products.routes import build_marketplace_client
from app.products.service import record_failed_attempt, refresh_tracking

logger = logging.getLogger(__name__)


# Failures that point at an unexpected payload shape rather than a transient condition.
_DATA_ERRORS = (KeyError, ValueError, TypeError, AttributeError, ArithmeticError)


def _attempt(session: Session, source: object, product_id: object, user_id: object, tracking_id: object, now: datetime | None) -> int:
    """Run one listing attempt; any failure is contained so the cycle continues."""
    try:
        # Non-blocking lock: a listing busy elsewhere is already being refreshed.
        refresh_tracking(session, user_id, tracking_id, source, now=now, lock_wait_seconds=0)
        return 1
    except ListingBusy:
        return 0
    except ApiError as exc:
        if exc.code not in {"refresh_not_due", "tracking_inactive", "resource_not_found"}:
            logger.warning("Consulta do anúncio falhou: produto=%s codigo=%s", product_id, exc.code)
            return 1
        return 0
    except Exception as exc:  # noqa: BLE001 - isolate each listing; never abort the cycle
        # Log only identifiers and the exception type: messages may carry upstream payload.
        logger.warning("Falha inesperada ao consultar anúncio: produto=%s tipo=%s", product_id, type(exc).__name__)
        session.rollback()
        _record_unexpected_failure(session.get_bind(), product_id, exc, now or datetime.now(UTC))
        return 1
    finally:
        session.rollback()


def _record_unexpected_failure(bind: object, product_id: object, error: Exception, now: datetime) -> None:
    status = "invalid_response" if isinstance(error, _DATA_ERRORS) else "temporary_error"
    try:
        with Session(bind) as clean:
            product = clean.scalar(select(Product).where(Product.id == product_id).with_for_update())
            if product is None:
                return
            record_failed_attempt(product, status, now)
            clean.commit()
    except Exception as exc:  # noqa: BLE001 - isolate each listing; never abort the cycle
        logger.error("Não foi possível registrar a falha: produto=%s tipo=%s", product_id, type(exc).__name__)


def _attempt_in_session(bind: object, source: object, task: tuple[object, object, object], now: datetime | None) -> int:
    with Session(bind) as session:
        return _attempt(session, source, *task, now)


def run_cycle(session: Session, source: object, *, limit: int | None = None, now: datetime | None = None) -> int:
    """Attempt each due, actively tracked publication at most once in this cycle."""
    settings = load_monitoring_settings()
    limit = settings.batch_limit if limit is None else limit
    if limit < 1 or limit > 100:
        raise ValueError("limit deve estar entre 1 e 100")
    instant = now or datetime.now(UTC)
    due_ids = session.scalars(
        select(Product.id).where(
            or_(Product.next_check_at.is_(None), Product.next_check_at <= instant),
            exists().where(TrackedProduct.product_id == Product.id, TrackedProduct.active.is_(True)),
        ).order_by(Product.next_check_at, Product.id).limit(limit)
    ).all()
    tasks = []
    for product_id in due_ids:
        tracked = session.scalar(select(TrackedProduct).where(
            TrackedProduct.product_id == product_id, TrackedProduct.active.is_(True),
        ).order_by(TrackedProduct.id).limit(1))
        if tracked is None:
            continue
        tasks.append((product_id, tracked.user_id, tracked.id))
    if settings.max_concurrency == 1:
        return sum(_attempt(session, source, *task, now) for task in tasks)
    bind = session.get_bind()
    session.rollback()
    with ThreadPoolExecutor(max_workers=settings.max_concurrency) as pool:
        return sum(pool.map(lambda task: _attempt_in_session(bind, source, task, now), tasks))


def main() -> None:
    logging.basicConfig(level=logging.INFO)
    settings = load_monitoring_settings()
    while True:
        try:
            source = build_marketplace_client()
        except ApiError:
            logger.warning("Monitoramento aguardando integração autorizada")
            time.sleep(settings.poll_interval_seconds)
            continue
        try:
            with Session(create_database_engine()) as session:
                count = run_cycle(session, source)
            logger.info("Ciclo de monitoramento: %d anúncio(s) consultado(s)", count)
        except Exception:
            logger.exception("Ciclo de monitoramento falhou")
        time.sleep(settings.poll_interval_seconds)


if __name__ == "__main__":
    main()
