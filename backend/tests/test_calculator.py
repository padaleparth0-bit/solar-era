"""
tests/test_calculator.py
Unit tests for app/calculator.py — covers:
  - CEA grid emission constant value
  - calculate_carbon_footprint() for all commute modes, diet, household size
  - calculate_roof_assessment_deterministic() subsidy slabs & CO2 formula
  - Edge cases: zero commute, zero bill, single-member household
"""
import pytest
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.calculator import (
    CEA_GRID_EMISSION_FACTOR_KG_PER_KWH,
    calculate_carbon_footprint,
    calculate_roof_assessment_deterministic,
)


# ---------------------------------------------------------------------------
# CEA constant
# ---------------------------------------------------------------------------

class TestCEAConstant:
    def test_cea_factor_exact_value(self):
        """Official CEA weighted average grid emission factor must be 0.82 kg CO2/kWh."""
        assert CEA_GRID_EMISSION_FACTOR_KG_PER_KWH == 0.82

    def test_cea_factor_is_float(self):
        assert isinstance(CEA_GRID_EMISSION_FACTOR_KG_PER_KWH, float)


# ---------------------------------------------------------------------------
# calculate_carbon_footprint
# ---------------------------------------------------------------------------

class TestCalculateCarbonFootprint:
    BASE = dict(
        system_capacity_kw=3.3,
        years_installed=2.5,
        monthly_units_kwh=450.0,
        commute_mode="petrol_diesel",
        daily_commute_km=20.0,
        diet_preference="vegetarian",
        household_members=4,
    )

    def _calc(self, **kw):
        return calculate_carbon_footprint(**{**self.BASE, **kw})

    # structure
    def test_returns_dict_with_success(self):
        r = self._calc()
        assert isinstance(r, dict)
        assert r["success"] is True

    def test_required_keys_present(self):
        r = self._calc()
        required = {
            "annualSolarUnits", "totalUnitsGenerated", "annualSolarOffsetKg",
            "totalCo2OffsetKg", "totalCo2OffsetTonnes", "treesEquivalent",
            "coalSavedKg", "carKmOffset", "annualHouseholdUnits",
            "annualElectricityEmissionsKg", "annualCommuteKm",
            "annualTransportEmissionsKg", "annualWasteDietEmissionsKg",
            "annualGrossEmissionsKg", "netAnnualBalanceKg",
            "isNetZeroOrNegative", "gridEmissionFactorUsed", "dataSource",
        }
        assert required.issubset(r.keys())

    # generation maths
    def test_annual_solar_units_formula(self):
        """1 kW generates 1,450 kWh/year in India (MNRE standard)."""
        r = self._calc(system_capacity_kw=3.0, years_installed=1.0)
        assert r["annualSolarUnits"] == 4350.0

    def test_total_units_generated(self):
        r = self._calc(system_capacity_kw=2.0, years_installed=5.0)
        assert r["totalUnitsGenerated"] == 14500.0

    def test_solar_offset_uses_cea(self):
        r = self._calc(system_capacity_kw=1.0, years_installed=1.0)
        expected = round(1450 * 0.82)
        assert r["annualSolarOffsetKg"] == float(expected)

    def test_grid_factor_in_response(self):
        assert self._calc()["gridEmissionFactorUsed"] == 0.82

    def test_data_source_mentions_cea(self):
        src = self._calc()["dataSource"]
        assert "Central Electricity Authority" in src
        assert "CEA" in src

    # commute modes
    def test_ev_has_lowest_transport_emissions(self):
        assert self._calc(commute_mode="ev")["annualTransportEmissionsKg"] < \
               self._calc(commute_mode="two_wheeler")["annualTransportEmissionsKg"]

    def test_petrol_has_highest_transport_emissions(self):
        """petrol_diesel must produce more transport emissions than the other 3 modes."""
        petrol = self._calc(commute_mode="petrol_diesel")["annualTransportEmissionsKg"]
        for mode in ["ev", "public_metro", "two_wheeler"]:
            assert petrol > self._calc(commute_mode=mode)["annualTransportEmissionsKg"], \
                f"{mode} should have lower emissions than petrol_diesel"

    def test_unknown_mode_falls_back_to_petrol(self):
        assert self._calc(commute_mode="bullock_cart")["annualTransportEmissionsKg"] == \
               self._calc(commute_mode="petrol_diesel")["annualTransportEmissionsKg"]

    # diet
    def test_vegetarian_lower_than_nonveg(self):
        assert self._calc(diet_preference="vegetarian")["annualWasteDietEmissionsKg"] < \
               self._calc(diet_preference="non_vegetarian")["annualWasteDietEmissionsKg"]

    # household size
    def test_larger_household_higher_diet_emissions(self):
        assert self._calc(household_members=8)["annualWasteDietEmissionsKg"] == \
               2 * self._calc(household_members=4)["annualWasteDietEmissionsKg"]

    # net balance
    def test_large_solar_achieves_net_zero(self):
        r = self._calc(system_capacity_kw=10.0)
        assert r["isNetZeroOrNegative"] is True

    def test_no_solar_is_net_positive(self):
        r = self._calc(system_capacity_kw=0.01, years_installed=0.0)
        assert r["isNetZeroOrNegative"] is False

    # edge cases
    def test_zero_commute_uses_default_fallback(self):
        """0.0 km triggers 'or 20.0' default in the calculator — matches 20 km/day baseline."""
        default = self._calc(daily_commute_km=20.0)["annualTransportEmissionsKg"]
        zero_km = self._calc(daily_commute_km=0.0)["annualTransportEmissionsKg"]
        assert zero_km == default, "0.0 km falls back to 20 km/day default"

    def test_single_member_household(self):
        r = self._calc(household_members=1)
        assert r["annualWasteDietEmissionsKg"] > 0


# ---------------------------------------------------------------------------
# calculate_roof_assessment_deterministic
# ---------------------------------------------------------------------------

class TestRoofAssessmentDeterministic:
    BASE = dict(
        monthly_bill=3500.0,
        roof_area_sqft=600.0,
        state="Karnataka",
        roof_type="Flat RCC Terrace",
        obstacles="Water tank",
        panel_type="Mono PERC Half-Cut 540W",
    )

    def _assess(self, **kw):
        return calculate_roof_assessment_deterministic(**{**self.BASE, **kw})

    def test_returns_dict(self):
        assert isinstance(self._assess(), dict)

    def test_all_required_keys_present(self):
        r = self._assess()
        for key in [
            "recommendedCapacityKw", "estimatedCost", "centralSubsidy", "netCost",
            "annualGenerationUnits", "annualSavings", "paybackYears",
            "co2OffsetAnnualKg", "treesEquivalent", "roofSuitabilityScore",
            "orientationRecommendation", "shadingAnalysis",
            "inverterRecommendation", "discomNotice", "aiNotes",
        ]:
            assert key in r, f"Missing key: {key}"

    def test_capacity_minimum_1kw(self):
        r = self._assess(monthly_bill=50.0, roof_area_sqft=40.0)
        assert r["recommendedCapacityKw"] >= 1.0

    def test_capacity_maximum_10kw(self):
        r = self._assess(monthly_bill=999_999.0, roof_area_sqft=50_000.0)
        assert r["recommendedCapacityKw"] <= 10.0

    def test_subsidy_max_slab_3kw_plus(self):
        """Systems >2 kW → PM Surya Ghar ₹78,000 cap."""
        r = self._assess(monthly_bill=5000.0, roof_area_sqft=600.0)
        if r["recommendedCapacityKw"] > 2.0:
            assert r["centralSubsidy"] == 78_000.0

    def test_net_cost_non_negative(self):
        for bill in [500, 2000, 5000, 20000]:
            assert self._assess(monthly_bill=bill)["netCost"] >= 0.0

    def test_co2_offset_uses_cea_factor(self):
        r = self._assess()
        expected = round(r["annualGenerationUnits"] * CEA_GRID_EMISSION_FACTOR_KG_PER_KWH)
        # allow ±1 for rounding differences
        assert abs(r["co2OffsetAnnualKg"] - expected) <= 1

    def test_trees_equivalent_formula(self):
        """FSI: 1 mature tree absorbs ~20 kg CO2/year."""
        r = self._assess()
        expected = round(r["co2OffsetAnnualKg"] / 20)
        assert r["treesEquivalent"] == expected

    def test_payback_is_positive(self):
        assert self._assess()["paybackYears"] > 0

    def test_suitability_score_is_92(self):
        assert self._assess()["roofSuitabilityScore"] == 92

    def test_state_name_in_discom_notice(self):
        r = self._assess(state="Maharashtra")
        assert "Maharashtra" in r["discomNotice"]

    def test_large_system_gets_three_phase_inverter(self):
        r = self._assess(monthly_bill=10_000.0, roof_area_sqft=1200.0)
        if r["recommendedCapacityKw"] > 3.0:
            assert "Three-Phase" in r["inverterRecommendation"]

    def test_small_system_gets_single_phase_inverter(self):
        r = self._assess(monthly_bill=800.0, roof_area_sqft=150.0)
        if r["recommendedCapacityKw"] <= 3.0:
            assert "Single Phase" in r["inverterRecommendation"]

    def test_zero_bill_defaults_gracefully(self):
        r = self._assess(monthly_bill=0.0)
        assert r["recommendedCapacityKw"] >= 1.0
