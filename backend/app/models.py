from sqlalchemy import Column, String, Integer, Float, Boolean, Text, JSON, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime, timezone


class State(Base):
    """
    Indian States solar potential, average sun hours, DISCOMs, and electricity tariffs.
    """
    __tablename__ = "states"

    code = Column(String(5), primary_key=True, index=True) # e.g. "DL", "MH"
    name = Column(String(100), nullable=False)
    capital = Column(String(100), nullable=False)
    avg_sun_hours_per_day = Column(Float, nullable=False) # Peak sun hours
    avg_tariff_per_kwh = Column(Float, nullable=False) # INR / unit
    discoms = Column(JSON, nullable=False, default=list) # List of DISCOM names
    state_subsidy_per_kw = Column(Float, default=0.0) # Additional state subsidy
    state_policy_highlight = Column(Text, nullable=False)
    net_metering_policy = Column(Text, nullable=False)
    portalUrl = Column(String(255), nullable=False)


class GovernmentScheme(Base):
    """
    Central & State Government Solar Subsidies & Loan Schemes.
    # TODO: Verify subsidy slabs with official MNRE notifications (pmsuryaghar.gov.in)
    """
    __tablename__ = "government_schemes"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    short_name = Column(String(100), nullable=False)
    target_audience = Column(Text, nullable=False)
    ministry = Column(String(255), nullable=False)
    badge_text = Column(String(100), nullable=False)
    subsidy_structure = Column(JSON, nullable=False, default=list)
    key_benefits = Column(JSON, nullable=False, default=list)
    application_steps = Column(JSON, nullable=False, default=list)
    official_portal_url = Column(String(255), nullable=False)
    helpline = Column(String(100), nullable=True)
    direct_apply_url = Column(String(255), nullable=False)
    # Source provenance (e.g., 'MNRE PM Surya Ghar National Portal')
    source = Column(String(255), nullable=False, default="MNRE PM Surya Ghar National Portal (pmsuryaghar.gov.in)")


class Installer(Base):
    """
    Empanelled & Certified Indian Solar EPC Vendors.
    """
    __tablename__ = "installers"

    id = Column(String(100), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    brand = Column(String(100), nullable=False)
    badge = Column(String(100), nullable=False) # e.g. "MNRE Empanelled"
    rating = Column(Float, default=4.5)
    reviews_count = Column(Integer, default=0)
    completed_installations = Column(Integer, default=0)
    states_served = Column(JSON, nullable=False, default=list)
    contact_phone = Column(String(50), nullable=False)
    email = Column(String(100), nullable=False)
    location_city = Column(String(100), nullable=False)
    headquarters = Column(String(100), nullable=False)
    avg_quote_per_kw = Column(Float, nullable=False)
    warranty_years = Column(Integer, default=25)
    finance_partner = Column(String(100), nullable=False)
    features = Column(JSON, nullable=False, default=list)
    verified = Column(Boolean, default=True)

    # Relationships
    quotes = relationship("QuoteRequest", back_populates="installer", cascade="all, delete-orphan")


class QuoteRequest(Base):
    """
    Solar Quote and Site Survey Requests submitted by homeowners.
    """
    __tablename__ = "quote_requests"

    id = Column(Integer, primary_key=True, autoincrement=True)
    installer_id = Column(String(100), ForeignKey("installers.id"), nullable=False)
    client_name = Column(String(150), nullable=False)
    client_phone = Column(String(30), nullable=False)
    client_city = Column(String(100), nullable=False)
    pincode = Column(String(15), nullable=True)
    state_code = Column(String(10), nullable=True)
    estimated_kw = Column(String(50), default="3 kW")
    monthly_bill = Column(Float, nullable=True)
    roof_area_sqft = Column(Float, nullable=True)
    status = Column(String(30), default="pending") # pending, contacted, scheduled, completed
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    installer = relationship("Installer", back_populates="quotes")


class Myth(Base):
    """
    Common Indian Rooftop Solar Myths vs Facts.
    # TODO: Verify facts with National Institute of Solar Energy (NISE) and MNRE guidelines
    """
    __tablename__ = "myths"

    id = Column(String(100), primary_key=True, index=True)
    myth = Column(Text, nullable=False)
    fact = Column(Text, nullable=False)
    detailed_truth = Column(Text, nullable=False)
    category = Column(String(100), nullable=False)
    icon = Column(String(50), nullable=False)
    source = Column(String(255), nullable=False, default="MNRE Technical Guidelines & National Solar Mission Factsheets")


class QuizQuestion(Base):
    """
    Multiple-choice questions testing citizen solar and subsidy awareness.
    """
    __tablename__ = "quiz_questions"

    id = Column(String(100), primary_key=True, index=True)
    question = Column(Text, nullable=False)
    options = Column(JSON, nullable=False, default=list)
    correct_index = Column(Integer, nullable=False)
    explanation = Column(Text, nullable=False)
    category = Column(String(100), nullable=False)


class Citizen(Base):
    """
    Registered Green Citizens, Mission LiFE Pledges, and Certificate records.
    """
    __tablename__ = "citizens"

    id = Column(String(100), primary_key=True, index=True)
    full_name = Column(String(150), nullable=False)
    email = Column(String(150), nullable=False, index=True)
    phone = Column(String(30), nullable=True)
    city = Column(String(100), nullable=False)
    state_code = Column(String(10), nullable=False)
    housing_type = Column(String(50), default="independent_house")
    household_members = Column(Integer, default=4)
    monthly_electricity_bill = Column(Float, default=3500.0)
    monthly_units_kwh = Column(Float, default=450.0)
    solar_system_kw = Column(Float, default=0.0)
    has_ev = Column(Boolean, default=False)
    daily_commute_km = Column(Float, default=20.0)
    commute_mode = Column(String(50), default="petrol_diesel")
    diet_preference = Column(String(50), default="vegetarian")
    certificate_id = Column(String(100), unique=True, nullable=False)
    
    # Progress & Gamification
    total_quiz_score = Column(Integer, default=0)
    quizzes_completed_count = Column(Integer, default=0)
    completed_action_ids = Column(JSON, default=list)
    unlocked_badge_ids = Column(JSON, default=list)
    registered_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class CalculationLog(Base):
    """
    Record of solar calculations performed by visitors.
    """
    __tablename__ = "calculation_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    address = Column(String(255), nullable=True)
    pincode = Column(String(15), nullable=True)
    state_code = Column(String(10), nullable=False)
    monthly_bill = Column(Float, nullable=False)
    roof_area_sqft = Column(Float, nullable=False)
    roof_type = Column(String(50), nullable=False)
    panel_type = Column(String(50), nullable=False)
    shading_condition = Column(String(50), nullable=False)
    battery_storage_needed = Column(Boolean, default=False)
    recommended_capacity_kw = Column(Float, nullable=False)
    total_system_cost = Column(Float, nullable=False)
    central_subsidy = Column(Float, nullable=False)
    state_subsidy = Column(Float, nullable=False)
    net_payable_cost = Column(Float, nullable=False)
    annual_savings = Column(Float, nullable=False)
    payback_period_years = Column(Float, nullable=False)
    co2_annual_offset_kg = Column(Float, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
