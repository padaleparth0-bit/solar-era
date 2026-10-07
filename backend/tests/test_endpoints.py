"""
tests/test_endpoints.py
Integration tests for Sol-Era FastAPI endpoints using FastAPI TestClient.

Covers:
  POST /api/quotes  — quote request validation, persistence, 404 for bad installer
  POST /api/citizens/pledge  — pledge creation, duplicate upsert, cert ID format
  POST /api/carbon/calculate  — CEA baseline factor, all required response fields
  POST /api/ai/assess-roof   — deterministic fallback always returns valid response

No live server is required — TestClient runs the app in-process.
The tests use a real (on-disk) SQLite database, so the database must be seeded
before running. Seed with:  python -m app.seed
"""
import os
import sys
import uuid
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _unique_phone():
    """Return a fresh valid 10-digit Indian mobile number each call."""
    import random
    return f"9{random.randint(100000000, 999999999)}"

def _unique_email():
    return f"test_{uuid.uuid4().hex[:8]}@solera.test"

# Pick any installer that exists in the seeded DB (first one returned by GET)
def _first_installer_id():
    r = client.get("/api/installers")
    assert r.status_code == 200, "Cannot load installers — is the DB seeded?"
    installers = r.json()
    assert len(installers) > 0, "No installers found — run python -m app.seed first"
    return installers[0]["id"]


# ===========================================================================
# POST /api/quotes
# ===========================================================================

class TestQuotesEndpoint:
    """Tests for the quote / lead submission endpoint."""

    @pytest.fixture(scope="class")
    def installer_id(self):
        return _first_installer_id()

    def _good_payload(self, installer_id):
        return {
            "installerId": installer_id,
            "clientName": "Ramesh Kumar",
            "clientPhone": _unique_phone(),
            "clientCity": "Bengaluru",
            "pincode": "560034",
            "stateCode": "KA",
            "estimatedKw": "3 kW",
        }

    def test_valid_quote_returns_201(self, installer_id):
        r = client.post("/api/quotes", json=self._good_payload(installer_id))
        assert r.status_code == 201

    def test_valid_quote_response_shape(self, installer_id):
        r = client.post("/api/quotes", json=self._good_payload(installer_id))
        body = r.json()
        assert body["success"] is True
        assert "quoteId" in body
        assert "clientName" in body
        assert "installerName" in body

    def test_quote_id_is_integer(self, installer_id):
        r = client.post("/api/quotes", json=self._good_payload(installer_id))
        assert isinstance(r.json()["quoteId"], int)

    def test_invalid_installer_returns_404(self):
        payload = {
            "installerId": "NONEXISTENT_XYZ_9999",
            "clientName": "Test User",
            "clientPhone": _unique_phone(),
            "clientCity": "Mumbai",
            "pincode": "400001",
        }
        r = client.post("/api/quotes", json=payload)
        assert r.status_code == 404

    def test_short_name_validation(self, installer_id):
        payload = self._good_payload(installer_id)
        payload["clientName"] = "X"
        r = client.post("/api/quotes", json=payload)
        assert r.status_code == 422

    def test_invalid_phone_validation(self, installer_id):
        payload = self._good_payload(installer_id)
        payload["clientPhone"] = "12345"      # too short
        r = client.post("/api/quotes", json=payload)
        assert r.status_code == 422

    def test_landline_number_rejected(self, installer_id):
        payload = self._good_payload(installer_id)
        payload["clientPhone"] = "0111234567"  # starts with 0, not a mobile
        r = client.post("/api/quotes", json=payload)
        assert r.status_code == 422

    def test_invalid_pincode_validation(self, installer_id):
        payload = self._good_payload(installer_id)
        payload["pincode"] = "1234"   # only 4 digits
        r = client.post("/api/quotes", json=payload)
        assert r.status_code == 422

    def test_pincode_starting_with_zero_rejected(self, installer_id):
        payload = self._good_payload(installer_id)
        payload["pincode"] = "012345"
        r = client.post("/api/quotes", json=payload)
        assert r.status_code == 422

    def test_missing_installer_id_returns_422(self):
        r = client.post("/api/quotes", json={
            "clientName": "Sita Devi",
            "clientPhone": _unique_phone(),
            "clientCity": "Delhi",
            "pincode": "110001",
        })
        assert r.status_code == 422


# ===========================================================================
# POST /api/citizens/pledge
# ===========================================================================

class TestCitizenPledgeEndpoint:
    """Tests for the Green Citizen pledge / registration endpoint."""

    def _good_payload(self, email=None, cid=None):
        return {
            "fullName": "Priya Sharma",
            "email": email or _unique_email(),
            "phone": _unique_phone(),
            "city": "Pune",
            "stateCode": "MH",
            "housingType": "independent_house",
            "householdMembers": 4,
            "monthlyElectricityBill": 3200.0,
            "monthlyUnitsKwh": 420.0,
            "solarSystemKw": 3.3,
            "hasEv": False,
            "dailyCommuteKm": 15.0,
            "commuteMode": "two_wheeler",
            "dietPreference": "vegetarian",
            **({"id": cid} if cid else {}),
        }

    def test_valid_pledge_returns_200(self):
        r = client.post("/api/citizens/pledge", json=self._good_payload())
        assert r.status_code == 200

    def test_response_has_required_fields(self):
        r = client.post("/api/citizens/pledge", json=self._good_payload())
        body = r.json()
        for field in ["id", "fullName", "email", "certificateId", "stateCode"]:
            assert field in body, f"Missing field: {field}"

    def test_certificate_id_has_correct_prefix(self):
        r = client.post("/api/citizens/pledge", json=self._good_payload())
        cert_id = r.json()["certificateId"]
        assert cert_id.startswith("IND-GC-"), \
            f"Certificate ID should start with IND-GC-, got: {cert_id}"

    def test_certificate_id_not_empty(self):
        r = client.post("/api/citizens/pledge", json=self._good_payload())
        assert len(r.json()["certificateId"]) > 7

    def test_duplicate_email_returns_same_citizen(self):
        email = _unique_email()
        r1 = client.post("/api/citizens/pledge", json=self._good_payload(email=email))
        r2 = client.post("/api/citizens/pledge", json=self._good_payload(email=email))
        assert r1.status_code == 200
        assert r2.status_code == 200
        assert r1.json()["id"] == r2.json()["id"], "Same email should return the same citizen ID"

    def test_duplicate_email_same_certificate(self):
        email = _unique_email()
        r1 = client.post("/api/citizens/pledge", json=self._good_payload(email=email))
        r2 = client.post("/api/citizens/pledge", json=self._good_payload(email=email))
        assert r1.json()["certificateId"] == r2.json()["certificateId"]

    def test_two_different_emails_have_unique_certificate_ids(self):
        c1 = client.post("/api/citizens/pledge", json=self._good_payload()).json()["certificateId"]
        c2 = client.post("/api/citizens/pledge", json=self._good_payload()).json()["certificateId"]
        assert c1 != c2

    def test_short_name_rejected(self):
        payload = self._good_payload()
        payload["fullName"] = "A"
        r = client.post("/api/citizens/pledge", json=payload)
        assert r.status_code == 422

    def test_invalid_email_rejected(self):
        payload = self._good_payload()
        payload["email"] = "not-an-email"
        r = client.post("/api/citizens/pledge", json=payload)
        assert r.status_code == 422

    def test_get_citizen_by_id(self):
        r = client.post("/api/citizens/pledge", json=self._good_payload())
        cid = r.json()["id"]
        get_r = client.get(f"/api/citizens/{cid}")
        assert get_r.status_code == 200
        assert get_r.json()["id"] == cid


# ===========================================================================
# POST /api/carbon/calculate
# ===========================================================================

class TestCarbonCalculateEndpoint:
    """Tests for the CEA-based household carbon footprint calculation endpoint."""

    BASE = {
        "systemCapacityKw": 3.3,
        "yearsInstalled": 2.5,
        "monthlyUnitsKwh": 450,
        "commuteMode": "petrol_diesel",
        "dailyCommuteKm": 20,
        "dietPreference": "vegetarian",
        "householdMembers": 4,
    }

    def _calc(self, **kw):
        return client.post("/api/carbon/calculate", json={**self.BASE, **kw})

    def test_returns_200(self):
        assert self._calc().status_code == 200

    def test_success_flag(self):
        assert self._calc().json()["success"] is True

    def test_required_response_keys(self):
        body = self._calc().json()
        for key in [
            "annualSolarUnits", "totalUnitsGenerated", "annualSolarOffsetKg",
            "totalCo2OffsetKg", "totalCo2OffsetTonnes", "treesEquivalent",
            "coalSavedKg", "carKmOffset", "annualGrossEmissionsKg",
            "netAnnualBalanceKg", "isNetZeroOrNegative",
            "gridEmissionFactorUsed", "dataSource",
        ]:
            assert key in body, f"Missing key: {key}"

    def test_grid_emission_factor_is_0_82(self):
        assert self._calc().json()["gridEmissionFactorUsed"] == 0.82

    def test_data_source_cites_cea(self):
        src = self._calc().json()["dataSource"]
        assert "Central Electricity Authority" in src

    def test_annual_solar_units_3kw(self):
        """3 kW × 1450 kWh/yr = 4350 kWh/yr."""
        r = self._calc(systemCapacityKw=3.0, yearsInstalled=1.0)
        assert r.json()["annualSolarUnits"] == 4350.0

    def test_ev_mode_reduces_transport_emissions(self):
        petrol = self._calc(commuteMode="petrol_diesel").json()["annualTransportEmissionsKg"]
        ev     = self._calc(commuteMode="ev").json()["annualTransportEmissionsKg"]
        assert ev < petrol

    def test_large_system_net_zero(self):
        r = self._calc(systemCapacityKw=10.0, yearsInstalled=1.0)
        assert r.json()["isNetZeroOrNegative"] is True

    def test_empty_body_uses_all_defaults(self):
        """All carbon fields have defaults — empty body should still return 200 with valid data."""
        r = client.post("/api/carbon/calculate", json={})
        assert r.status_code == 200
        assert r.json()["success"] is True
        assert r.json()["gridEmissionFactorUsed"] == 0.82


# ===========================================================================
# POST /api/ai/assess-roof (deterministic fallback path)
# ===========================================================================

class TestAssessRoofEndpoint:
    """Tests for the AI rooftop assessment endpoint.

    Gemini may or may not be reachable in CI — the deterministic fallback
    guarantees a valid response regardless, so all structural assertions hold.
    """

    PAYLOAD = {
        "address": "HSR Layout, Bengaluru, Karnataka",
        "monthlyBill": 3500,
        "roofAreaSqFt": 600,
        "state": "Karnataka",
        "roofType": "Flat RCC Terrace",
        "obstacles": "Water tank, staircase mumty",
        "panelType": "Mono PERC Half-Cut 540W",
    }

    def test_returns_200(self):
        r = client.post("/api/ai/assess-roof", json=self.PAYLOAD)
        assert r.status_code == 200

    def test_success_flag(self):
        r = client.post("/api/ai/assess-roof", json=self.PAYLOAD)
        assert r.json()["success"] is True

    def test_source_field_present(self):
        r = client.post("/api/ai/assess-roof", json=self.PAYLOAD)
        assert r.json()["source"] in {"gemini", "deterministic_fallback"}

    def test_data_block_present(self):
        r = client.post("/api/ai/assess-roof", json=self.PAYLOAD)
        assert "data" in r.json()

    def test_all_data_keys_present(self):
        data = client.post("/api/ai/assess-roof", json=self.PAYLOAD).json()["data"]
        for key in [
            "recommendedCapacityKw", "estimatedCost", "centralSubsidy", "netCost",
            "annualGenerationUnits", "annualSavings", "paybackYears",
            "co2OffsetAnnualKg", "treesEquivalent", "roofSuitabilityScore",
            "orientationRecommendation", "shadingAnalysis",
            "inverterRecommendation", "discomNotice", "aiNotes",
        ]:
            assert key in data, f"Missing data key: {key}"

    def test_recommended_capacity_in_valid_range(self):
        data = client.post("/api/ai/assess-roof", json=self.PAYLOAD).json()["data"]
        assert 1.0 <= data["recommendedCapacityKw"] <= 15.0

    def test_suitability_score_in_range(self):
        data = client.post("/api/ai/assess-roof", json=self.PAYLOAD).json()["data"]
        assert 0 <= data["roofSuitabilityScore"] <= 100

    def test_net_cost_non_negative(self):
        data = client.post("/api/ai/assess-roof", json=self.PAYLOAD).json()["data"]
        assert data["netCost"] >= 0.0

    def test_alias_route_also_works(self):
        """Both /api/ai/assess-roof and /api/assess-roof must respond."""
        r = client.post("/api/assess-roof", json=self.PAYLOAD)
        assert r.status_code == 200
        assert r.json()["success"] is True

    def test_empty_body_uses_defaults(self):
        """An empty payload should use sensible defaults and not crash."""
        r = client.post("/api/ai/assess-roof", json={})
        assert r.status_code == 200
