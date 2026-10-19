"""Read-only, explicitly confirmed probe for the official Mercado Livre API."""

import argparse
import json
import os
import sys
from collections.abc import Callable, Sequence
from dataclasses import dataclass
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import create_database_engine
from app.marketplace.client import (
    ITEM_ID,
    IntegrationError,
    ListingData,
    MercadoLivreClient,
)
from app.marketplace.oauth import OperatorTokenManager
from app.products.models import OperatorCredential

SCENARIOS = (
    ("price", "MERCADOLIVRE_VALIDATION_PRICE_ITEM_ID"),
    ("no_price", "MERCADOLIVRE_VALIDATION_NO_PRICE_ITEM_ID"),
    ("unavailable", "MERCADOLIVRE_VALIDATION_UNAVAILABLE_ITEM_ID"),
)


@dataclass(frozen=True)
class RunResult:
    exit_code: int
    stdout: str = ""
    stderr: str = ""


def _build_client(env: dict[str, str]) -> tuple[MercadoLivreClient, bool]:
    key = env.get("MERCADOLIVRE_OAUTH_KEY")
    client_id = env.get("MERCADOLIVRE_CLIENT_ID")
    client_secret = env.get("MERCADOLIVRE_CLIENT_SECRET")
    if not key or not client_id or not client_secret:
        raise IntegrationError("integration_not_configured")
    engine = create_database_engine()
    with Session(engine) as session:
        expires_before = session.scalar(select(OperatorCredential.expires_at).where(OperatorCredential.id == 1))
    access_token = OperatorTokenManager(engine, key.encode(), client_id, client_secret).get_access_token()
    with Session(engine) as session:
        expires_after = session.scalar(select(OperatorCredential.expires_at).where(OperatorCredential.id == 1))
    refreshed = expires_before is not None and expires_after is not None and expires_after != expires_before
    return MercadoLivreClient(access_token), refreshed


def _parse_ids(env: dict[str, str]) -> tuple[list[tuple[str, str]], str | None]:
    values = [(scenario, env.get(variable, "").strip()) for scenario, variable in SCENARIOS]
    if any(not ITEM_ID.fullmatch(item_id) for _, item_id in values):
        return [], "validation_item_ids_invalid"
    if len({item_id for _, item_id in values}) != len(values):
        return [], "validation_item_ids_reused"
    return values, None


def _matches(scenario: str, listing: ListingData) -> bool:
    if scenario == "price":
        return listing.price is not None
    if scenario == "no_price":
        return listing.price is None
    return listing.availability == "unavailable"


def _validation_error(args: argparse.Namespace, env: dict[str, str]) -> str | None:
    if not args.confirm_live_requests:
        return "Nenhuma chamada foi feita. Passe --confirm-live-requests após revisar os IDs MLB autorizados."
    if env.get("MERCADOLIVRE_THIRD_PARTY_VALIDATED", "false").lower() == "true":
        return "A validação exige a integração desativada (MERCADOLIVRE_THIRD_PARTY_VALIDATED=false)."
    return None


def _manual_action_result(code: str) -> RunResult:
    report = {"status": "requires_manual_action", "manual_actions": [code], "items": []}
    return RunResult(2, json.dumps(report, ensure_ascii=False) + "\n")


def _create_client(
    env: dict[str, str],
    factory: Callable[[], tuple[MercadoLivreClient, bool] | MercadoLivreClient] | None,
) -> tuple[MercadoLivreClient, bool] | RunResult:
    try:
        built = (factory or (lambda: _build_client(env)))()
        return built if isinstance(built, tuple) else (built, False)
    except IntegrationError as exc:
        if exc.code in {"integration_not_configured", "integration_auth_required"}:
            return _manual_action_result("configure_operator_oauth_credentials")
        report = {"status": "failed", "error_code": exc.code, "items": []}
    except Exception:  # noqa: BLE001 - CLI boundary must not print internal setup details.
        report = {"status": "failed", "error_code": "validation_setup_failed", "items": []}
    return RunResult(1, json.dumps(report, ensure_ascii=False) + "\n")


def _probe(client: MercadoLivreClient, scenario: str, item_id: str) -> dict[str, object]:
    try:
        listing = client.get_listing(item_id)
    except IntegrationError as exc:
        return {"scenario": scenario, "item_id": item_id, "status": "failed", "error_code": exc.code}
    except Exception:  # noqa: BLE001 - CLI boundary must not print internal request details.
        return {
            "scenario": scenario,
            "item_id": item_id,
            "status": "failed",
            "error_code": "validation_request_failed",
        }
    matches = _matches(scenario, listing)
    return {
        "scenario": scenario,
        "item_id": item_id,
        "status": "passed" if matches else "requires_manual_action",
        **({} if matches else {"manual_action": "select_item_matching_scenario"}),
        "price": str(listing.price) if listing.price is not None else None,
        "currency": listing.currency,
        "price_context": "mlb_marketplace_unit",
        "availability": listing.availability,
        "normalized_fields": ["external_id", "title", "canonical_url", "image_url", "price", "currency", "availability"],
    }


def _passed(oauth_refreshed: bool, results: list[dict[str, object]]) -> bool:
    return oauth_refreshed and all(item["status"] == "passed" for item in results)


def _aggregate_results(
    oauth_refreshed: bool, results: list[dict[str, object]],
) -> tuple[str, list[str]]:
    manual_actions = [
        str(item["manual_action"]) for item in results if item["status"] == "requires_manual_action"
    ]
    if not oauth_refreshed:
        manual_actions.append("schedule_oauth_refresh_validation")
    if _passed(oauth_refreshed, results):
        return "passed", manual_actions
    if any(item["status"] == "failed" for item in results):
        return "failed", manual_actions
    return "requires_manual_action", manual_actions


def run(
    argv: Sequence[str],
    *,
    env: dict[str, str] | None = None,
    client_factory: Callable[[], tuple[MercadoLivreClient, bool] | MercadoLivreClient] | None = None,
    now: datetime | None = None,
) -> RunResult:
    parser = argparse.ArgumentParser(description="Consulta controlada e somente leitura da API oficial do Mercado Livre.")
    parser.add_argument(
        "--confirm-live-requests", action="store_true",
        help="confirma até três consultas reais a anúncios previamente autorizados",
    )
    args = parser.parse_args(list(argv))
    configured = dict(os.environ if env is None else env)
    error = _validation_error(args, configured)
    if error:
        return RunResult(2, stderr=error + "\n")

    items, id_error = _parse_ids(configured)
    if id_error:
        return _manual_action_result(id_error)

    built = _create_client(configured, client_factory)
    if isinstance(built, RunResult):
        return built
    client, oauth_refreshed = built

    results = [_probe(client, scenario, item_id) for scenario, item_id in items]

    status, manual_actions = _aggregate_results(oauth_refreshed, results)
    observed = now or datetime.now(UTC)
    report = {
        "status": status,
        "observed_at": observed.astimezone(UTC).isoformat().replace("+00:00", "Z"),
        "oauth_refresh": "confirmed" if oauth_refreshed else "not_observed",
        "manual_actions": manual_actions,
        "items": results,
    }
    return RunResult(0 if status == "passed" else 1, json.dumps(report, ensure_ascii=False) + "\n")


def main() -> None:
    result = run(sys.argv[1:])
    if result.stdout:
        sys.stdout.write(result.stdout)
    if result.stderr:
        sys.stderr.write(result.stderr)
    raise SystemExit(result.exit_code)


if __name__ == "__main__":
    main()
