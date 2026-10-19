import json
from decimal import Decimal

from app.marketplace.client import IntegrationError, ListingData
from app.marketplace.validate_live import run

IDS = {
    "MERCADOLIVRE_VALIDATION_PRICE_ITEM_ID": "MLB111111111",
    "MERCADOLIVRE_VALIDATION_NO_PRICE_ITEM_ID": "MLB222222222",
    "MERCADOLIVRE_VALIDATION_UNAVAILABLE_ITEM_ID": "MLB333333333",
}


class FakeClient:
    def __init__(self, *, fail_id: str | None = None) -> None:
        self.calls: list[str] = []
        self.fail_id = fail_id

    def get_listing(self, item_id: str) -> ListingData:
        self.calls.append(item_id)
        if item_id == self.fail_id:
            raise IntegrationError("integration_access_denied")
        return ListingData(
            external_id=item_id,
            title="Não deve aparecer na saída",
            canonical_url="https://produto.mercadolivre.com.br/MLB",
            image_url=None,
            price=Decimal("12.34") if item_id == IDS["MERCADOLIVRE_VALIDATION_PRICE_ITEM_ID"] else None,
            currency="BRL",
            availability="unavailable" if item_id == IDS["MERCADOLIVRE_VALIDATION_UNAVAILABLE_ITEM_ID"] else "available",
        )


def test_live_validation_requires_explicit_confirmation_before_client_creation() -> None:
    created = False

    def create_client() -> FakeClient:
        nonlocal created
        created = True
        return FakeClient()

    result = run([], env=IDS, client_factory=create_client)

    assert result.exit_code == 2
    assert not created
    assert "--confirm-live-requests" in result.stderr


def test_live_validation_refuses_to_run_after_integration_flag_is_enabled() -> None:
    result = run(
        ["--confirm-live-requests"],
        env={**IDS, "MERCADOLIVRE_THIRD_PARTY_VALIDATED": "true"},
        client_factory=lambda: (_ for _ in ()).throw(AssertionError("client must not be created")),
    )

    assert result.exit_code == 2
    assert "desativada" in result.stderr


def test_live_validation_checks_all_three_scenarios_and_prints_sanitized_json() -> None:
    client = FakeClient()

    result = run(["--confirm-live-requests"], env=IDS, client_factory=lambda: (client, True))
    report = json.loads(result.stdout)

    assert result.exit_code == 0
    assert client.calls == list(IDS.values())
    assert report["status"] == "passed"
    assert report["oauth_refresh"] == "confirmed"
    assert [item["scenario"] for item in report["items"]] == ["price", "no_price", "unavailable"]
    assert report["items"][0]["price"] == "12.34"
    assert report["items"][1]["price"] is None
    assert report["items"][2]["availability"] == "unavailable"
    assert "Não deve aparecer" not in result.stdout
    assert "https://" not in result.stdout


def test_live_validation_reports_safe_error_and_does_not_claim_success() -> None:
    client = FakeClient(fail_id=IDS["MERCADOLIVRE_VALIDATION_NO_PRICE_ITEM_ID"])

    result = run(["--confirm-live-requests"], env=IDS, client_factory=lambda: (client, True))
    report = json.loads(result.stdout)

    assert result.exit_code == 1
    assert report["status"] == "failed"
    assert report["items"][1]["error_code"] == "integration_access_denied"
    assert "Bearer" not in result.stdout


def test_live_validation_hides_unexpected_client_exception_details() -> None:
    class BrokenClient(FakeClient):
        def get_listing(self, item_id: str) -> ListingData:
            raise RuntimeError("internal detail with secret-token")

    result = run(["--confirm-live-requests"], env=IDS, client_factory=lambda: (BrokenClient(), True))
    report = json.loads(result.stdout)

    assert result.exit_code == 1
    assert report["items"][0]["error_code"] == "validation_request_failed"
    assert "internal detail" not in result.stdout
    assert "secret-token" not in result.stdout


def test_live_validation_requests_manual_action_for_unconfigured_oauth() -> None:
    result = run(
        ["--confirm-live-requests"],
        env=IDS,
        client_factory=lambda: (_ for _ in ()).throw(IntegrationError("integration_not_configured")),
    )
    report = json.loads(result.stdout)

    assert result.exit_code == 2
    assert report["status"] == "requires_manual_action"
    assert report["manual_actions"] == ["configure_operator_oauth_credentials"]


def test_live_validation_hides_unexpected_setup_exception_details() -> None:
    result = run(
        ["--confirm-live-requests"],
        env=IDS,
        client_factory=lambda: (_ for _ in ()).throw(RuntimeError("secret-token and internal details")),
    )
    report = json.loads(result.stdout)

    assert result.exit_code == 1
    assert report["status"] == "failed"
    assert report["error_code"] == "validation_setup_failed"
    assert "secret-token" not in result.stdout
    assert "internal details" not in result.stdout


def test_live_validation_does_not_claim_oauth_refresh_when_token_remains_valid() -> None:
    result = run(["--confirm-live-requests"], env=IDS, client_factory=lambda: (FakeClient(), False))
    report = json.loads(result.stdout)

    assert result.exit_code == 1
    assert report["status"] == "requires_manual_action"
    assert "schedule_oauth_refresh_validation" in report["manual_actions"]
    assert report["oauth_refresh"] == "not_observed"


def test_live_validation_refuses_invalid_or_reused_sample_ids() -> None:
    result = run(
        ["--confirm-live-requests"],
        env={**IDS, "MERCADOLIVRE_VALIDATION_NO_PRICE_ITEM_ID": "MLB111111111"},
        client_factory=lambda: (_ for _ in ()).throw(AssertionError("network must not start")),
    )

    report = json.loads(result.stdout)

    assert result.exit_code == 2
    assert report["status"] == "requires_manual_action"
    assert report["manual_actions"] == ["validation_item_ids_reused"]


def test_live_validation_marks_missing_item_ids_as_manual_action() -> None:
    result = run(
        ["--confirm-live-requests"], env={},
        client_factory=lambda: (_ for _ in ()).throw(AssertionError("network must not start")),
    )

    report = json.loads(result.stdout)
    assert result.exit_code == 2
    assert report["status"] == "requires_manual_action"
    assert report["manual_actions"] == ["validation_item_ids_invalid"]


def test_live_validation_marks_unexpected_scenario_as_manual_action() -> None:
    class WrongSelectionClient(FakeClient):
        def get_listing(self, item_id: str) -> ListingData:
            listing = super().get_listing(item_id)
            if item_id == IDS["MERCADOLIVRE_VALIDATION_PRICE_ITEM_ID"]:
                return ListingData(**{**listing.__dict__, "price": None})
            return listing

    result = run(
        ["--confirm-live-requests"], env=IDS,
        client_factory=lambda: (WrongSelectionClient(), True),
    )
    report = json.loads(result.stdout)

    assert result.exit_code == 1
    assert report["status"] == "requires_manual_action"
    assert report["items"][0]["status"] == "requires_manual_action"
    assert report["items"][0]["manual_action"] == "select_item_matching_scenario"


def test_real_failure_takes_precedence_over_manual_actions() -> None:
    class MixedResultClient(FakeClient):
        def get_listing(self, item_id: str) -> ListingData:
            if item_id == IDS["MERCADOLIVRE_VALIDATION_NO_PRICE_ITEM_ID"]:
                return super().get_listing(item_id)
            listing = super().get_listing(item_id)
            if item_id == IDS["MERCADOLIVRE_VALIDATION_PRICE_ITEM_ID"]:
                return ListingData(**{**listing.__dict__, "price": None})
            raise IntegrationError("integration_unavailable")

    result = run(
        ["--confirm-live-requests"], env=IDS,
        client_factory=lambda: (MixedResultClient(), True),
    )
    report = json.loads(result.stdout)

    assert result.exit_code == 1
    assert report["status"] == "failed"
    assert "select_item_matching_scenario" in report["manual_actions"]
    assert report["items"][2]["status"] == "failed"
