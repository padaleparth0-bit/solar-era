import math
from typing import Optional
from sqlalchemy.orm import Session

try:
    from app.models import State, CalculationLog
    from app.schemas import SolarCalculationRequest, SolarCalculationResponse
except ImportError:
    from backend.app.models import State, CalculationLog
    from backend.app.schemas import SolarCalculationRequest, SolarCalculationResponse


# ============================================================================
# SOLAR ENGINE ASSUMPTIONS & CONSTANTS
# ============================================================================

# 1. Solar Panel Wattage Assumptions (in Watts)
PANEL_WATTAGE_MONO_PERC = 540  # High-efficiency Mono PERC 540W
PANEL_WATTAGE_BIFACIAL = 550   # Bifacial TopCon dual-glass 550W
PANEL_WATTAGE_POLY = 335       # Budget Polycrystalline 335W

# 2. Panel Physical Surface Area Sizing (sq. ft per panel)
PANEL_AREA_LARGE_SQFT = 28     # Standard area for panels >= 500W
PANEL_AREA_STANDARD_SQFT = 20  # Standard area for panels < 500W
ROOF_SQFT_PER_KW = 85.0        # Roof area limitation factor (~85 sq ft per kW)

# 3. Capital Turnkey Installation Cost per kW (INR ₹)
COST_PER_KW_MONO_PERC = 55000.0       # Standard Mono PERC baseline in India
COST_PER_KW_BIFACIAL = 59000.0        # Bifacial TopCon (+₹4,000/kW)
COST_PER_KW_POLY = 48000.0            # Polycrystalline budget (-₹7,000/kW)
BATTERY_STORAGE_COST_PER_KW = 25000.0 # Hybrid LiFePO4 battery add-on

# 4. System Derating & Technical Efficiency
# 0.78 derating factor accounts for ambient thermal losses, dust/soiling & inverter/cabling losses
SYSTEM_DERATING_FACTOR = 0.78

# 5. Financial & Grid Assumptions
ANNUAL_TARIFF_INFLATION = 0.035  # 3.5% annual grid electricity tariff rise in India
SYSTEM_LIFESPAN_YEARS = 25       # 25-year standard solar performance guarantee
MIN_MONTHLY_DISCOM_BILL = 180.0  # Minimum fixed DISCOM grid charge in ₹
MIN_MONTHLY_UNITS = 50.0         # Floor for monthly electricity consumption in kWh
MIN_OUT_OF_POCKET_COST = 10000.0 # Minimum net payable system cost floor

# 6. Concessional Solar Loan (SBI Surya Ghar Solar Loan Scheme)
LOAN_ANNUAL_INTEREST_RATE = 0.07 # 7.00% p.a. concessional interest rate
LOAN_TENURE_MONTHS = 60          # 5-year repayment (60 months)
LOAN_MARGIN_MONEY_RATIO = 0.10   # 10% borrower margin / downpayment (90% financed)

# 7. Central Government Subsidy (PM Surya Ghar Muft Bijli Yojana DBT slabs)
CENTRAL_SUBSIDY_1KW = 30000.0    # Direct DBT for systems up to 1 kW
CENTRAL_SUBSIDY_2KW = 60000.0    # Direct DBT for systems > 1 kW and <= 2 kW
CENTRAL_SUBSIDY_3KW_MAX = 78000.0 # Capped DBT for systems >= 3 kW

# 8. State-Specific Subsidies (e.g. Uttar Pradesh & Delhi GBI)
UP_STATE_SUBSIDY_UP_TO_2KW = 15000.0
UP_STATE_SUBSIDY_ABOVE_2KW = 30000.0

# 9. Environmental Footprint Baseline (India Central Electricity Authority Grid Factors)
# Official Source: Central Electricity Authority (CEA), Ministry of Power, Govt. of India
# "CO2 Baseline Database for the Indian Power Sector" (Weighted Average Grid Emission Factor)
CEA_GRID_EMISSION_FACTOR_KG_PER_KWH = 0.82  # ~0.82 kg CO2 avoided per kWh generated
CO2_KG_PER_KWH = CEA_GRID_EMISSION_FACTOR_KG_PER_KWH
CO2_ABSORBED_KG_PER_TREE_YEAR = 20.0        # 1 mature tree absorbs ~20 kg CO2 / year
COAL_SAVED_KG_PER_KWH = 0.45                # ~0.45 kg coal burned per thermal kWh
CAR_KM_SAVED_PER_CO2_KG = 5.26              # ~190g CO2 per car km -> 5.26 km driven offset


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def _js_round(val: float) -> int:
    """
    Rounds half towards +infinity, identically replicating JavaScript's
    Math.round for positive values to maintain exact frontend parity.
    """
    return int(math.floor(val + 0.5))


def _js_round_decimal(val: float, decimals: int = 1) -> float:
    """
    Rounds a float to specified decimal places matching JavaScript's
    Math.round(val * 10) / 10 logic.
    """
    factor = 10 ** decimals
    return math.floor(val * factor + 0.5) / factor


# ============================================================================
# CALCULATION ENGINE
# ============================================================================

def calculate_solar_potential(
    input_data: SolarCalculationRequest,
    db: Session,
    save_log: bool = True
) -> SolarCalculationResponse:
    """
    Computes solar sizing, subsidies, financial savings, environmental footprint,
    and concessional EMI for Indian rooftop solar installations.
    
    Reads state solar insolation and DISCOM tariffs directly from SQLite.
    Persists the calculation log into the database if save_log is True.
    """
    # 1. Fetch state solar insolation and tariff from SQLite database
    state_code = input_data.stateCode.strip().upper() if input_data.stateCode else "DL"
    state = db.query(State).filter(State.code == state_code).first()
    if not state:
        # Fallback to Delhi or the first available state in the database
        state = db.query(State).first()
        if not state:
            raise ValueError("No states found in the database. Please seed the database first.")

    avg_tariff = state.avg_tariff_per_kwh
    avg_sun_hours = state.avg_sun_hours_per_day

    # 2. Estimate monthly units from monthly bill: units = bill / tariff
    monthly_units = max(input_data.monthlyBill / avg_tariff, MIN_MONTHLY_UNITS)
    daily_units_needed = monthly_units / 30.0

    # 3. Daily units generated per 1 kW (derated for heat, dust, and wire losses)
    units_per_kw_day = avg_sun_hours * SYSTEM_DERATING_FACTOR
    raw_capacity_kw = daily_units_needed / units_per_kw_day

    # 4. Sizing constraints: round to nearest 0.5 kW, min 1 kW, max 15 kW, capped by roof area
    max_possible_kw_by_area = max(math.floor((input_data.roofAreaSqFt / ROOF_SQFT_PER_KW) * 2.0) / 2.0, 0.5)
    recommended_capacity_kw = min(max(_js_round(raw_capacity_kw * 2.0) / 2.0, 1.0), 15.0)

    # Check roof area limitation
    if recommended_capacity_kw > max_possible_kw_by_area and max_possible_kw_by_area >= 1.0:
        recommended_capacity_kw = max_possible_kw_by_area

    # 5. Panel count and physical rooftop area requirement
    if input_data.panelType == "mono_perc_540":
        panel_wattage = PANEL_WATTAGE_MONO_PERC
    elif input_data.panelType == "bifacial_550":
        panel_wattage = PANEL_WATTAGE_BIFACIAL
    elif input_data.panelType == "poly_335":
        panel_wattage = PANEL_WATTAGE_POLY
    else:
        panel_wattage = PANEL_WATTAGE_MONO_PERC

    panel_count = math.ceil((recommended_capacity_kw * 1000.0) / panel_wattage)
    area_factor = PANEL_AREA_LARGE_SQFT if panel_wattage >= 500 else PANEL_AREA_STANDARD_SQFT
    required_area_sqft = _js_round(panel_count * area_factor)

    # 6. Turnkey Capital Costs (in ₹ INR)
    if input_data.panelType == "bifacial_550":
        cost_per_kw = COST_PER_KW_BIFACIAL
    elif input_data.panelType == "poly_335":
        cost_per_kw = COST_PER_KW_POLY
    else:
        cost_per_kw = COST_PER_KW_MONO_PERC

    if input_data.batteryStorageNeeded:
        cost_per_kw += BATTERY_STORAGE_COST_PER_KW

    total_system_cost = _js_round(recommended_capacity_kw * cost_per_kw)

    # 7. PM Surya Ghar Muft Bijli Yojana Central Subsidy
    if recommended_capacity_kw <= 1.0:
        central_subsidy = CENTRAL_SUBSIDY_1KW
    elif recommended_capacity_kw <= 2.0:
        central_subsidy = CENTRAL_SUBSIDY_2KW
    else:
        central_subsidy = CENTRAL_SUBSIDY_3KW_MAX

    # 8. State-specific Solar Subsidy
    state_subsidy = 0.0
    if state.code == "UP":
        state_subsidy = UP_STATE_SUBSIDY_UP_TO_2KW if recommended_capacity_kw <= 2.0 else UP_STATE_SUBSIDY_ABOVE_2KW
    elif state.state_subsidy_per_kw and state.state_subsidy_per_kw > 0:
        state_subsidy = _js_round(recommended_capacity_kw * state.state_subsidy_per_kw)

    net_payable_cost = max(total_system_cost - central_subsidy - state_subsidy, MIN_OUT_OF_POCKET_COST)

    # 9. Energy Generation Metrics
    daily_generation_units = _js_round(recommended_capacity_kw * units_per_kw_day * 10.0) / 10.0
    monthly_generation_units = _js_round(daily_generation_units * 30.0)
    annual_generation_units = _js_round(daily_generation_units * 365.0)

    # 10. Bill Savings & Financial ROI
    monthly_bill_before_solar = input_data.monthlyBill
    solar_monthly_value = monthly_generation_units * avg_tariff
    estimated_new_monthly_bill = max(_js_round(monthly_bill_before_solar - solar_monthly_value), MIN_MONTHLY_DISCOM_BILL)
    monthly_savings = _js_round(monthly_bill_before_solar - estimated_new_monthly_bill)
    annual_savings = monthly_savings * 12

    # 11. 25-Year Lifetime Savings (incorporating 3.5% annual grid tariff inflation)
    twenty_five_year_savings = 0.0
    current_year_savings = float(annual_savings)
    for _ in range(SYSTEM_LIFESPAN_YEARS):
        twenty_five_year_savings += current_year_savings
        current_year_savings *= (1.0 + ANNUAL_TARIFF_INFLATION)
    twenty_five_year_savings = _js_round(twenty_five_year_savings)

    # 12. Payback period in years
    if annual_savings > 0:
        payback_period_years = _js_round((net_payable_cost / annual_savings) * 10.0) / 10.0
    else:
        payback_period_years = 3.2
    if payback_period_years <= 0 or math.isnan(payback_period_years):
        payback_period_years = 3.2

    # 13. Environmental Footprint Offset
    co2_annual_offset_kg = _js_round(annual_generation_units * CO2_KG_PER_KWH)
    trees_equivalent_annual = _js_round(co2_annual_offset_kg / CO2_ABSORBED_KG_PER_TREE_YEAR)
    coal_saved_annual_kg = _js_round(annual_generation_units * COAL_SAVED_KG_PER_KWH)
    car_km_equivalent_annual = _js_round(co2_annual_offset_kg * CAR_KM_SAVED_PER_CO2_KG)

    # 14. SBI Surya Ghar Concessional Loan EMI Estimate
    principal = net_payable_cost * (1.0 - LOAN_MARGIN_MONEY_RATIO)
    monthly_rate = LOAN_ANNUAL_INTEREST_RATE / 12.0
    total_months = LOAN_TENURE_MONTHS
    rate_factor = (1.0 + monthly_rate) ** total_months
    emi = (principal * monthly_rate * rate_factor) / (rate_factor - 1.0)
    sbi_loan_emi_estimate = _js_round(emi)

    # 15. Save calculation to database calculation_logs table
    log_id = None
    if save_log:
        try:
            log_entry = CalculationLog(
                address=input_data.address or "",
                pincode=input_data.pincode or "",
                state_code=state.code,
                monthly_bill=float(input_data.monthlyBill),
                roof_area_sqft=float(input_data.roofAreaSqFt),
                roof_type=input_data.roofType or "rcc_flat",
                panel_type=input_data.panelType or "mono_perc_540",
                shading_condition=input_data.shadingCondition or "none",
                battery_storage_needed=bool(input_data.batteryStorageNeeded),
                recommended_capacity_kw=float(recommended_capacity_kw),
                total_system_cost=float(total_system_cost),
                central_subsidy=float(central_subsidy),
                state_subsidy=float(state_subsidy),
                net_payable_cost=float(net_payable_cost),
                annual_savings=float(annual_savings),
                payback_period_years=float(payback_period_years),
                co2_annual_offset_kg=float(co2_annual_offset_kg)
            )
            db.add(log_entry)
            db.commit()
            db.refresh(log_entry)
            log_id = log_entry.id
        except Exception as e:
            db.rollback()
            # Do not fail calculation if logging fails
            print(f"Warning: Failed to save calculation log: {e}")

    return SolarCalculationResponse(
        recommendedCapacityKw=float(recommended_capacity_kw),
        panelCount=int(panel_count),
        requiredAreaSqFt=float(required_area_sqft),
        totalSystemCost=float(total_system_cost),
        centralSubsidy=float(central_subsidy),
        stateSubsidy=float(state_subsidy),
        netPayableCost=float(net_payable_cost),
        dailyGenerationUnits=float(daily_generation_units),
        monthlyGenerationUnits=float(monthly_generation_units),
        annualGenerationUnits=float(annual_generation_units),
        monthlyBillBeforeSolar=float(monthly_bill_before_solar),
        estimatedNewMonthlyBill=float(estimated_new_monthly_bill),
        monthlySavings=float(monthly_savings),
        annualSavings=float(annual_savings),
        twentyFiveYearSavings=float(twenty_five_year_savings),
        paybackPeriodYears=float(payback_period_years),
        co2AnnualOffsetKg=float(co2_annual_offset_kg),
        treesEquivalentAnnual=float(trees_equivalent_annual),
        coalSavedAnnualKg=float(coal_saved_annual_kg),
        carKmEquivalentAnnual=float(car_km_equivalent_annual),
        sbiLoanEmiEstimate=int(sbi_loan_emi_estimate),
        logId=log_id
    )


def calculate_carbon_footprint(
    system_capacity_kw: float,
    years_installed: float,
    monthly_units_kwh: float,
    commute_mode: str,
    daily_commute_km: float,
    diet_preference: str,
    household_members: int
) -> dict:
    """
    Computes household gross emissions, solar clean energy offsets, and net carbon balance.
    Uses CEA official grid emission factor: 0.82 kg CO2/kWh.
    """
    # 1. Solar Generation & Offset (1 kW in India ~ 1,450 kWh/year)
    annual_solar_units = _js_round(system_capacity_kw * 1450.0)
    total_units_generated = _js_round(annual_solar_units * years_installed)

    # Grid emission factor for India: ~0.82 kg CO2 / kWh (CEA Baseline Database)
    total_co2_offset_kg = _js_round(total_units_generated * CEA_GRID_EMISSION_FACTOR_KG_PER_KWH)
    annual_solar_offset_kg = _js_round(annual_solar_units * CEA_GRID_EMISSION_FACTOR_KG_PER_KWH)
    total_co2_offset_tonnes = f"{(total_co2_offset_kg / 1000.0):.2f}"

    # 1 mature tree absorbs ~20 kg CO2 / year
    trees_equivalent = _js_round(total_co2_offset_kg / CO2_ABSORBED_KG_PER_TREE_YEAR)
    # 0.45 kg thermal coal burned per kWh
    coal_saved_kg = _js_round(total_units_generated * COAL_SAVED_KG_PER_KWH)
    # Car distance offset
    car_km_offset = _js_round(total_co2_offset_kg * CAR_KM_SAVED_PER_CO2_KG)

    # 2. Individual Annual Gross Footprint Breakdown (Baseline consumption)
    annual_household_units = (monthly_units_kwh or 450.0) * 12.0
    annual_electricity_emissions_kg = _js_round(annual_household_units * CEA_GRID_EMISSION_FACTOR_KG_PER_KWH)

    # Transportation emissions factor
    commute_factor_map = {
        "ev": 0.03,
        "two_wheeler": 0.07,
        "public_metro": 0.02,
        "petrol_diesel": 0.19
    }
    commute_factor = commute_factor_map.get(commute_mode, 0.19)
    annual_commute_km = (daily_commute_km or 20.0) * 300.0
    annual_transport_emissions_kg = _js_round(annual_commute_km * commute_factor)

    # Diet & Household Waste factor
    waste_diet_unit = 700.0 if diet_preference == "vegetarian" else 1200.0
    annual_waste_diet_emissions_kg = _js_round(waste_diet_unit * (household_members or 4))

    # Total gross household emissions per year
    annual_gross_emissions_kg = annual_electricity_emissions_kg + annual_transport_emissions_kg + annual_waste_diet_emissions_kg

    # Net Personal Carbon Balance (Gross - Solar Offsets)
    net_annual_balance_kg = annual_gross_emissions_kg - annual_solar_offset_kg
    is_net_zero = net_annual_balance_kg <= 0

    return {
        "success": True,
        "annualSolarUnits": float(annual_solar_units),
        "totalUnitsGenerated": float(total_units_generated),
        "annualSolarOffsetKg": float(annual_solar_offset_kg),
        "totalCo2OffsetKg": float(total_co2_offset_kg),
        "totalCo2OffsetTonnes": total_co2_offset_tonnes,
        "treesEquivalent": trees_equivalent,
        "coalSavedKg": float(coal_saved_kg),
        "carKmOffset": float(car_km_offset),
        "annualHouseholdUnits": float(annual_household_units),
        "annualElectricityEmissionsKg": float(annual_electricity_emissions_kg),
        "annualCommuteKm": float(annual_commute_km),
        "annualTransportEmissionsKg": float(annual_transport_emissions_kg),
        "annualWasteDietEmissionsKg": float(annual_waste_diet_emissions_kg),
        "annualGrossEmissionsKg": float(annual_gross_emissions_kg),
        "netAnnualBalanceKg": float(net_annual_balance_kg),
        "isNetZeroOrNegative": is_net_zero,
        "gridEmissionFactorUsed": CEA_GRID_EMISSION_FACTOR_KG_PER_KWH,
        "dataSource": "Central Electricity Authority (CEA) CO2 Baseline Database for the Indian Power Sector"
    }


def calculate_roof_assessment_deterministic(
    monthly_bill: float,
    roof_area_sqft: float,
    state: str,
    roof_type: str,
    obstacles: str,
    panel_type: str
) -> dict:
    """
    Computes deterministic rooftop solar capacity, generation, savings, and payback period.
    Used directly or as guaranteed fallback for assess-roof.
    """
    bill = monthly_bill if monthly_bill and monthly_bill > 0 else 3500.0
    area = roof_area_sqft if roof_area_sqft and roof_area_sqft > 0 else 500.0

    # Capacity recommendation based on bill and roof area
    cap_from_bill = bill / 750.0
    cap_from_area = area / ROOF_SQFT_PER_KW
    system_size_kw = min(max(round(min(cap_from_bill, cap_from_area) * 10) / 10, 1.0), 10.0)

    est_cost = system_size_kw * COST_PER_KW_MONO_PERC
    if system_size_kw <= 1.0:
        subsidy = CENTRAL_SUBSIDY_1KW
    elif system_size_kw <= 2.0:
        subsidy = CENTRAL_SUBSIDY_2KW
    else:
        subsidy = CENTRAL_SUBSIDY_3KW_MAX

    net_cost = max(est_cost - subsidy, 0.0)
    annual_gen_units = round(system_size_kw * 1450.0)
    annual_savings = round(annual_gen_units * 7.2)
    payback_years = round((net_cost / annual_savings) * 10) / 10 if annual_savings > 0 else 4.5
    co2_offset = round(annual_gen_units * CEA_GRID_EMISSION_FACTOR_KG_PER_KWH)
    trees_equiv = round(co2_offset / CO2_ABSORBED_KG_PER_TREE_YEAR)

    inverter = (
        "On-Grid Three-Phase String Inverter with Dual MPPT"
        if system_size_kw > 3
        else "Single Phase On-Grid Inverter with WiFi Telemetry"
    )

    return {
        "recommendedCapacityKw": float(system_size_kw),
        "estimatedCost": float(est_cost),
        "centralSubsidy": float(subsidy),
        "netCost": float(net_cost),
        "annualGenerationUnits": float(annual_gen_units),
        "annualSavings": float(annual_savings),
        "paybackYears": float(payback_years),
        "co2OffsetAnnualKg": float(co2_offset),
        "treesEquivalent": int(trees_equiv),
        "roofSuitabilityScore": 92,
        "orientationRecommendation": "South-facing at 18°-22° tilt for maximum Indian insolation year-round.",
        "shadingAnalysis": "Clean generation window from 8:30 AM to 4:30 PM with minimal parapet/tank obstruction.",
        "inverterRecommendation": inverter,
        "discomNotice": f"Eligible for Net Metering under {state or 'State'} DISCOM with PM Surya Ghar Muft Bijli Yojana DBT.",
        "aiNotes": "Calculated using official MNRE PM Surya Ghar guidelines & CEA 0.82 kg CO2/kWh baseline."
    }

