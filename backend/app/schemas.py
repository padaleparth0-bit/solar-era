import re
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import List, Optional, Any
from datetime import datetime



# State Schemas
class StateOut(BaseModel):
    code: str
    name: str
    capital: str
    avgSunHoursPerDay: float
    avgTariffPerKwh: float
    discoms: List[str]
    stateSubsidyPerKw: Optional[float] = 0.0
    statePolicyHighlight: str
    netMeteringPolicy: str
    portalUrl: str


class StateBase(BaseModel):
    code: str
    name: str
    capital: str
    avg_sun_hours_per_day: float
    avg_tariff_per_kwh: float
    discoms: List[str]
    state_subsidy_per_kw: Optional[float] = 0.0
    state_policy_highlight: str
    net_metering_policy: str
    portalUrl: str

    class Config:
        from_attributes = True



# Government Scheme Schemas
class GovernmentSchemeOut(BaseModel):
    id: str
    name: str
    shortName: str
    targetAudience: str
    ministry: str
    badgeText: str
    subsidyStructure: List[Any]
    keyBenefits: List[str]
    applicationSteps: List[str]
    officialPortalUrl: str
    helpline: Optional[str] = None
    directApplyUrl: str
    source: Optional[str] = None


class SubsidySlab(BaseModel):
    slab: str
    subsidyAmount: str
    eligibility: str


class GovernmentSchemeBase(BaseModel):
    id: str
    name: str
    short_name: str
    target_audience: str
    ministry: str
    badge_text: str
    subsidy_structure: List[Any]
    key_benefits: List[str]
    application_steps: List[str]
    official_portal_url: str
    helpline: Optional[str] = None
    direct_apply_url: str
    source: str

    class Config:
        from_attributes = True



# Installer Schemas
class InstallerOut(BaseModel):
    id: str
    name: str
    brand: str
    badge: str
    rating: float
    reviewsCount: int
    completedInstallations: int
    statesServed: List[str]
    contactPhone: str
    email: str
    locationCity: str
    headquarters: str
    avgQuotePerKw: float
    warrantyYears: int
    financePartner: str
    features: List[str]
    verified: bool


class InstallerBase(BaseModel):
    id: str
    name: str
    brand: str
    badge: str
    rating: float
    reviews_count: int
    completed_installations: int
    states_served: List[str]
    contact_phone: str
    email: str
    location_city: str
    headquarters: str
    avg_quote_per_kw: float
    warranty_years: int
    finance_partner: str
    features: List[str]
    verified: bool

    class Config:
        from_attributes = True


# Quote Request Schemas
class QuoteRequestCreate(BaseModel):
    installer_id: str = Field(..., alias="installerId")
    client_name: str = Field(..., alias="clientName")
    client_phone: str = Field(..., alias="clientPhone")
    client_city: str = Field(..., alias="clientCity")
    pincode: str = Field(..., alias="pincode")
    state_code: Optional[str] = Field(None, alias="stateCode")
    estimated_kw: Optional[str] = Field("3 kW", alias="estimatedKw")
    monthly_bill: Optional[float] = Field(None, alias="monthlyBill")
    roof_area_sqft: Optional[float] = Field(None, alias="roofAreaSqFt")

    class Config:
        populate_by_name = True

    @field_validator("client_name")
    def validate_name(cls, v):
        v = (v or "").strip()
        if len(v) < 2:
            raise ValueError("Name must be at least 2 characters long")
        return v

    @field_validator("client_phone")
    def validate_phone(cls, v):
        cleaned = re.sub(r"[\s\-\(\)\+]", "", v or "")
        if cleaned.startswith("91") and len(cleaned) == 12:
            cleaned = cleaned[2:]
        elif cleaned.startswith("0") and len(cleaned) == 11:
            cleaned = cleaned[1:]
        if not re.match(r"^[6-9]\d{9}$", cleaned):
            raise ValueError("Phone number must be a valid 10-digit Indian mobile number")
        return cleaned

    @field_validator("pincode")
    def validate_pincode(cls, v):
        cleaned = re.sub(r"\s+", "", v or "")
        if not re.match(r"^[1-9][0-9]{5}$", cleaned):
            raise ValueError("Pin code must be a valid 6-digit Indian postal code (e.g. 110001)")
        return cleaned

    @field_validator("installer_id")
    def validate_installer_id(cls, v):
        v = (v or "").strip()
        if not v:
            raise ValueError("Installer ID is required")
        return v


class QuoteSubmissionSuccess(BaseModel):
    success: bool = True
    message: str = "Quote request submitted successfully! An engineer will reach out to you shortly."
    quoteId: int
    clientName: str
    installerName: Optional[str] = None


class QuoteLeadOut(BaseModel):
    id: int
    installerId: str
    installerName: Optional[str] = None
    clientName: str
    clientPhone: str
    clientCity: str
    pincode: Optional[str] = None
    stateCode: Optional[str] = None
    estimatedKw: Optional[str] = None
    status: str
    createdAt: datetime



# Myth Schemas
class MythOut(BaseModel):
    id: str
    myth: str
    fact: str
    detailedTruth: str
    category: str
    icon: str
    source: Optional[str] = None


class MythBase(BaseModel):
    id: str
    myth: str
    fact: str
    detailed_truth: str
    category: str
    icon: str
    source: str

    class Config:
        from_attributes = True


# Quiz Question Schemas
class QuizQuestionOut(BaseModel):
    id: str
    question: str
    options: List[str]
    correctIndex: int
    explanation: str
    category: str


class QuizQuestionBase(BaseModel):
    id: str
    question: str
    options: List[str]
    correct_index: int
    explanation: str
    category: str

    class Config:
        from_attributes = True



# Green Citizen Schemas
class CitizenCreate(BaseModel):
    id: str
    full_name: str
    email: str
    phone: Optional[str] = None
    city: str
    state_code: str
    housing_type: Optional[str] = "independent_house"
    household_members: Optional[int] = 4
    monthly_electricity_bill: Optional[float] = 3500.0
    monthly_units_kwh: Optional[float] = 450.0
    solar_system_kw: Optional[float] = 0.0
    has_ev: Optional[bool] = False
    daily_commute_km: Optional[float] = 20.0
    commute_mode: Optional[str] = "petrol_diesel"
    diet_preference: Optional[str] = "vegetarian"
    certificate_id: str
    total_quiz_score: Optional[int] = 0
    quizzes_completed_count: Optional[int] = 0
    completed_action_ids: Optional[List[str]] = []
    unlocked_badge_ids: Optional[List[str]] = []


class CitizenResponse(CitizenCreate):
    registered_at: datetime

    class Config:
        from_attributes = True


# Calculation Log Schemas
class CalculationLogCreate(BaseModel):
    address: Optional[str] = None
    pincode: Optional[str] = None
    state_code: str
    monthly_bill: float
    roof_area_sqft: float
    roof_type: str
    panel_type: str
    shading_condition: str
    battery_storage_needed: bool = False
    recommended_capacity_kw: float
    total_system_cost: float
    central_subsidy: float
    state_subsidy: float
    net_payable_cost: float
    annual_savings: float
    payback_period_years: float
    co2_annual_offset_kg: float


class CalculationLogResponse(CalculationLogCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Solar Calculation Engine Schemas
class SolarCalculationRequest(BaseModel):
    address: Optional[str] = ""
    pincode: Optional[str] = ""
    stateCode: str
    monthlyBill: float
    roofAreaSqFt: float
    roofType: Optional[str] = "rcc_flat"
    panelType: Optional[str] = "mono_perc_540"
    shadingCondition: Optional[str] = "none"
    batteryStorageNeeded: Optional[bool] = False
    sanctionedLoadKw: Optional[float] = None


class SolarCalculationResponse(BaseModel):
    recommendedCapacityKw: float
    panelCount: int
    requiredAreaSqFt: float
    totalSystemCost: float
    centralSubsidy: float
    stateSubsidy: float
    netPayableCost: float
    dailyGenerationUnits: float
    monthlyGenerationUnits: float
    annualGenerationUnits: float
    monthlyBillBeforeSolar: float
    estimatedNewMonthlyBill: float
    monthlySavings: float
    annualSavings: float
    twentyFiveYearSavings: float
    paybackPeriodYears: float
    co2AnnualOffsetKg: float
    treesEquivalentAnnual: float
    coalSavedAnnualKg: float
    carKmEquivalentAnnual: float
    sbiLoanEmiEstimate: int
    logId: Optional[int] = None


# ============================================================================
# Green Citizen & Certificate Schemas
# ============================================================================

class CitizenPledgeCreate(BaseModel):
    id: Optional[str] = Field(None, alias="id")
    full_name: str = Field(..., alias="fullName")
    email: str = Field(..., alias="email")
    phone: Optional[str] = Field(None, alias="phone")
    city: str = Field(..., alias="city")
    state_code: str = Field(..., alias="stateCode")
    housing_type: Optional[str] = Field("independent_house", alias="housingType")
    household_members: Optional[int] = Field(4, alias="householdMembers")
    monthly_electricity_bill: Optional[float] = Field(3500.0, alias="monthlyElectricityBill")
    monthly_units_kwh: Optional[float] = Field(450.0, alias="monthlyUnitsKwh")
    solar_system_kw: Optional[float] = Field(0.0, alias="solarSystemKw")
    has_ev: Optional[bool] = Field(False, alias="hasEv")
    daily_commute_km: Optional[float] = Field(20.0, alias="dailyCommuteKm")
    commute_mode: Optional[str] = Field("petrol_diesel", alias="commuteMode")
    diet_preference: Optional[str] = Field("vegetarian", alias="dietPreference")
    completed_action_ids: Optional[List[str]] = Field(default_factory=list, alias="completedActionIds")
    unlocked_badge_ids: Optional[List[str]] = Field(default_factory=list, alias="unlockedBadgeIds")

    class Config:
        populate_by_name = True

    @field_validator("full_name")
    def validate_name(cls, v):
        v = (v or "").strip()
        if len(v) < 2:
            raise ValueError("Full name must be at least 2 characters long")
        return v

    @field_validator("email")
    def validate_email(cls, v):
        v = (v or "").strip().lower()
        if not re.match(r"^[^@]+@[^@]+\.[^@]+$", v):
            raise ValueError("Invalid email address format")
        return v


class CitizenQuizPointsUpdate(BaseModel):
    points: int = Field(..., ge=0)
    quizzes_completed_count: Optional[int] = Field(1, alias="quizzesCompletedCount")

    class Config:
        populate_by_name = True


class CitizenOut(BaseModel):
    id: str
    fullName: str
    email: str
    phone: Optional[str] = None
    city: str
    stateCode: str
    housingType: str
    householdMembers: int
    monthlyElectricityBill: float
    monthlyUnitsKwh: float
    solarSystemKw: float
    hasEv: bool
    dailyCommuteKm: float
    commuteMode: str
    dietPreference: str
    certificateId: str
    totalQuizScore: int
    quizzesCompletedCount: int
    completedActionIds: List[str]
    unlockedBadgeIds: List[str]
    registeredAt: str

    class Config:
        populate_by_name = True
        from_attributes = True


class CitizenCertificateOut(BaseModel):
    citizenId: str
    certificateId: str
    fullName: str
    city: str
    stateCode: str
    stateName: str
    registeredAt: str
    solarSystemKw: float
    totalQuizScore: int
    quizzesCompletedCount: int
    verified: bool = True
    totalCo2SavedKg: float
    treesEquivalent: int
    coalSavedKg: float
    totalUnitsGenerated: float

    class Config:
        populate_by_name = True


# ============================================================================
# Gemini AI Endpoints Schemas
# ============================================================================

class GenerateQuizRequest(BaseModel):
    topic: Optional[str] = "Indian Rooftop Solar, PM Surya Ghar Muft Bijli Yojana & Net Metering"
    difficulty: Optional[str] = "Intermediate"


class GeneratedQuizItem(BaseModel):
    id: str
    question: str
    options: List[str]
    correctIndex: int
    explanation: str
    category: str

    @field_validator("options")
    def validate_options_length(cls, v):
        if not isinstance(v, list) or len(v) != 4:
            raise ValueError("Each quiz question must contain exactly 4 options.")
        return [str(opt).strip() for opt in v]

    @field_validator("correctIndex")
    def validate_correct_index(cls, v):
        if not isinstance(v, int) or v < 0 or v > 3:
            raise ValueError("correctIndex must be an integer between 0 and 3.")
        return v


class GenerateQuizResponse(BaseModel):
    success: bool = True
    quizzes: List[GeneratedQuizItem]
    source: str = "gemini"
    note: Optional[str] = None


class EcoRecommendationItem(BaseModel):
    id: str
    category: str
    title: str
    impact: str
    annualSavingsRupees: float
    difficulty: str
    description: str
    isCompleted: bool = False


class PersonalizedEcoAdviceRequest(BaseModel):
    profile: Optional[dict] = None
    footprintSummary: Optional[dict] = None


class PersonalizedEcoAdviceResponse(BaseModel):
    success: bool = True
    summary: str
    recommendations: List[EcoRecommendationItem]
    source: str = "gemini"
    note: Optional[str] = None


class RoofAssessmentRequest(BaseModel):
    address: Optional[str] = "India"
    monthlyBill: Optional[float] = 3500.0
    roofAreaSqFt: Optional[float] = 600.0
    state: Optional[str] = "Karnataka"
    roofType: Optional[str] = "Flat RCC Terrace"
    obstacles: Optional[str] = "Staircase room, overhead water tank"
    panelType: Optional[str] = "Mono PERC Half-Cut 540W"


class RoofAssessmentData(BaseModel):
    recommendedCapacityKw: float
    estimatedCost: float
    centralSubsidy: float
    netCost: float
    annualGenerationUnits: float
    annualSavings: float
    paybackYears: float
    co2OffsetAnnualKg: float
    treesEquivalent: int
    roofSuitabilityScore: int
    orientationRecommendation: str
    shadingAnalysis: str
    inverterRecommendation: str
    discomNotice: str
    aiNotes: str


class RoofAssessmentResponse(BaseModel):
    success: bool = True
    data: RoofAssessmentData
    source: str = "gemini"


class CarbonFootprintCalculationRequest(BaseModel):
    systemCapacityKw: float = Field(3.3, alias="systemCapacityKw")
    yearsInstalled: float = Field(2.5, alias="yearsInstalled")
    monthlyUnitsKwh: float = Field(450.0, alias="monthlyUnitsKwh")
    commuteMode: str = Field("petrol_diesel", alias="commuteMode")
    dailyCommuteKm: float = Field(20.0, alias="dailyCommuteKm")
    dietPreference: str = Field("vegetarian", alias="dietPreference")
    householdMembers: int = Field(4, alias="householdMembers")

    class Config:
        populate_by_name = True


class CarbonFootprintCalculationResponse(BaseModel):
    success: bool = True
    annualSolarUnits: float
    totalUnitsGenerated: float
    annualSolarOffsetKg: float
    totalCo2OffsetKg: float
    totalCo2OffsetTonnes: str
    treesEquivalent: int
    coalSavedKg: float
    carKmOffset: float
    annualHouseholdUnits: float
    annualElectricityEmissionsKg: float
    annualCommuteKm: float
    annualTransportEmissionsKg: float
    annualWasteDietEmissionsKg: float
    annualGrossEmissionsKg: float
    netAnnualBalanceKg: float
    isNetZeroOrNegative: bool
    gridEmissionFactorUsed: float
    dataSource: str


# ============================================================================
# Authentication Schemas
# ============================================================================

class UserRegisterRequest(BaseModel):
    """Request body for POST /api/auth/register"""
    full_name: str = Field(..., min_length=2, max_length=150)
    email: str = Field(...)
    password: str = Field(..., min_length=6, max_length=128)
    phone: Optional[str] = None
    city: Optional[str] = None
    state_code: Optional[str] = None

    @field_validator("email")
    def validate_email(cls, v):
        v = (v or "").strip().lower()
        if not re.match(r"^[^@]+@[^@]+\.[^@]+$", v):
            raise ValueError("Invalid email address format")
        return v

    @field_validator("full_name")
    def validate_name(cls, v):
        v = (v or "").strip()
        if len(v) < 2:
            raise ValueError("Full name must be at least 2 characters long")
        return v


class UserLoginRequest(BaseModel):
    """Request body for POST /api/auth/login"""
    email: str = Field(...)
    password: str = Field(...)

    @field_validator("email")
    def validate_email(cls, v):
        return (v or "").strip().lower()


class AuthTokenResponse(BaseModel):
    """Response from login/register containing the JWT and user info"""
    success: bool = True
    token: str
    user: 'UserProfileOut'


class UserProfileOut(BaseModel):
    """Public user profile info (no password)"""
    id: str
    fullName: str
    email: str
    phone: Optional[str] = None
    city: Optional[str] = None
    stateCode: Optional[str] = None
    avatarUrl: Optional[str] = None
    citizenId: Optional[str] = None
    certificateId: Optional[str] = None
    totalQuizScore: Optional[int] = 0
    quizzesCompletedCount: Optional[int] = 0
    createdAt: str


class UserProfileUpdateRequest(BaseModel):
    """Request body for PUT /api/auth/profile"""
    full_name: Optional[str] = Field(None, alias="fullName", min_length=2, max_length=150)
    phone: Optional[str] = None
    city: Optional[str] = None
    state_code: Optional[str] = Field(None, alias="stateCode")
    avatar_url: Optional[str] = Field(None, alias="avatarUrl")

    class Config:
        populate_by_name = True


class ChangePasswordRequest(BaseModel):
    """Request body for POST /api/auth/change-password"""
    current_password: str = Field(..., alias="currentPassword")
    new_password: str = Field(..., alias="newPassword", min_length=6, max_length=128)

    class Config:
        populate_by_name = True
