import os
import uuid
import random
import json
import httpx
from typing import List, Optional, Any
from fastapi import FastAPI, Depends, HTTPException, Query, Header
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone
from dotenv import load_dotenv
from sqlalchemy.orm import Session

try:
    from app.database import get_db
    from app.models import State, GovernmentScheme, Installer, Myth, QuizQuestion, QuoteRequest, Citizen
    from app.schemas import (
        SolarCalculationRequest,
        SolarCalculationResponse,
        StateOut,
        GovernmentSchemeOut,
        InstallerOut,
        MythOut,
        QuizQuestionOut,
        QuoteRequestCreate,
        QuoteSubmissionSuccess,
        QuoteLeadOut,
        CitizenPledgeCreate,
        CitizenQuizPointsUpdate,
        CitizenOut,
        CitizenCertificateOut,
        GenerateQuizRequest,
        GeneratedQuizItem,
        GenerateQuizResponse,
        EcoRecommendationItem,
        PersonalizedEcoAdviceRequest,
        PersonalizedEcoAdviceResponse,
        RoofAssessmentRequest,
        RoofAssessmentData,
        RoofAssessmentResponse,
        CarbonFootprintCalculationRequest,
        CarbonFootprintCalculationResponse,
    )
    from app.calculator import (
        calculate_solar_potential,
        calculate_carbon_footprint,
        calculate_roof_assessment_deterministic,
        CEA_GRID_EMISSION_FACTOR_KG_PER_KWH,
    )
except ImportError:
    from backend.app.database import get_db
    from backend.app.models import State, GovernmentScheme, Installer, Myth, QuizQuestion, QuoteRequest, Citizen
    from backend.app.schemas import (
        SolarCalculationRequest,
        SolarCalculationResponse,
        StateOut,
        GovernmentSchemeOut,
        InstallerOut,
        MythOut,
        QuizQuestionOut,
        QuoteRequestCreate,
        QuoteSubmissionSuccess,
        QuoteLeadOut,
        CitizenPledgeCreate,
        CitizenQuizPointsUpdate,
        CitizenOut,
        CitizenCertificateOut,
        GenerateQuizRequest,
        GeneratedQuizItem,
        GenerateQuizResponse,
        EcoRecommendationItem,
        PersonalizedEcoAdviceRequest,
        PersonalizedEcoAdviceResponse,
        RoofAssessmentRequest,
        RoofAssessmentData,
        RoofAssessmentResponse,
        CarbonFootprintCalculationRequest,
        CarbonFootprintCalculationResponse,
    )
    from backend.app.calculator import (
        calculate_solar_potential,
        calculate_carbon_footprint,
        calculate_roof_assessment_deterministic,
        CEA_GRID_EMISSION_FACTOR_KG_PER_KWH,
    )


# Load environment variables from .env file if present
load_dotenv()

# Initialize FastAPI Application
app = FastAPI(
    title="Solar Era API",
    description="Backend API for Solar Era - Indian Rooftop Solar Awareness Platform",
    version="1.0.0"
)

# Configure Cross-Origin Resource Sharing (CORS)
# On Vercel services, frontend and backend share the same domain so /api/*
# requests are same-origin. For preview deployments, custom domains, and
# local dev, we allow additional origins.
_default_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Read additional allowed origins from env (comma-separated), e.g.:
#   ALLOWED_ORIGINS=https://sol-era.vercel.app,https://solera.in
_env_origins = [
    o.strip()
    for o in os.getenv("ALLOWED_ORIGINS", "").split(",")
    if o.strip()
]

origins = _default_origins + _env_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    # Allow *.vercel.app preview deployment origins
    allow_origin_regex=r"https://.*\.vercel\.app",
)


@app.get("/api/health", tags=["System"])
async def health_check():
    """
    Health check endpoint to verify that the FastAPI backend is running
    and accessible by the frontend.
    """
    return {
        "status": "ok",
        "time": datetime.now(timezone.utc).isoformat(),
        "app": "Solar Era",
        "framework": "FastAPI (Python)"
    }


# ============================================================================
# SOLAR CALCULATOR ENDPOINT
# ============================================================================

@app.post("/api/calculate", response_model=SolarCalculationResponse, tags=["Calculator"])
def calculate_solar(input_data: SolarCalculationRequest, db: Session = Depends(get_db)):
    """
    Calculate rooftop solar potential, recommended kW capacity, central & state subsidies,
    bill savings, 25-year lifetime return, and environmental offsets.
    Logs each calculation into the SQLite calculation_logs table.
    """
    try:
        return calculate_solar_potential(input_data, db=db, save_log=True)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============================================================================
# STATES ENDPOINT
# ============================================================================

@app.get("/api/states", response_model=List[StateOut], tags=["States"])
def get_states(db: Session = Depends(get_db)):
    """
    Retrieve solar data for all Indian states and union territories,
    including peak sun hours, DISCOM electricity tariffs, net-metering policies,
    and state subsidies.
    """
    states = db.query(State).all()
    return [
        StateOut(
            code=s.code,
            name=s.name,
            capital=s.capital,
            avgSunHoursPerDay=s.avg_sun_hours_per_day,
            avgTariffPerKwh=s.avg_tariff_per_kwh,
            discoms=s.discoms or [],
            stateSubsidyPerKw=s.state_subsidy_per_kw or 0.0,
            statePolicyHighlight=s.state_policy_highlight,
            netMeteringPolicy=s.net_metering_policy,
            portalUrl=s.portalUrl,
        )
        for s in states
    ]


# ============================================================================
# GOVERNMENT SCHEMES ENDPOINT
# ============================================================================

@app.get("/api/schemes", response_model=List[GovernmentSchemeOut], tags=["Schemes"])
def get_schemes(db: Session = Depends(get_db)):
    """
    Retrieve central and state government rooftop solar schemes,
    such as PM Surya Ghar Muft Bijli Yojana, State Solar Policies,
    and SBI Surya Ghar Concessional Loans.
    """
    schemes = db.query(GovernmentScheme).all()
    return [
        GovernmentSchemeOut(
            id=s.id,
            name=s.name,
            shortName=s.short_name,
            targetAudience=s.target_audience,
            ministry=s.ministry,
            badgeText=s.badge_text,
            subsidyStructure=s.subsidy_structure or [],
            keyBenefits=s.key_benefits or [],
            applicationSteps=s.application_steps or [],
            officialPortalUrl=s.official_portal_url,
            helpline=s.helpline,
            directApplyUrl=s.direct_apply_url,
            source=s.source,
        )
        for s in schemes
    ]


# ============================================================================
# CERTIFIED INSTALLERS ENDPOINT (WITH FILTERS)
# ============================================================================

@app.get("/api/installers", response_model=List[InstallerOut], tags=["Installers"])
def get_installers(
    state: Optional[str] = Query(None, description="Filter by state code, e.g. DL, MH, or ALL"),
    badge: Optional[str] = Query(None, description="Filter by empanelment badge"),
    verified: Optional[bool] = Query(None, description="Filter verified installers only"),
    search: Optional[str] = Query(None, description="Search by installer name, brand, or city"),
    db: Session = Depends(get_db)
):
    """
    Retrieve empanelled solar EPC installers and certified vendors,
    supporting filters for state, accreditation badge, verification status, and search query.
    """
    query = db.query(Installer)

    if badge:
        query = query.filter(Installer.badge == badge)
    if verified is not None:
        query = query.filter(Installer.verified == verified)

    installers = query.all()

    # Filter by state code (states_served stores JSON list of state codes)
    if state and state.upper() != "ALL":
        target = state.upper()
        installers = [
            i for i in installers
            if i.states_served and (
                target in [s.upper() for s in i.states_served] or 
                "ALL" in [s.upper() for s in i.states_served]
            )
        ]

    # Substring search filter across installer name, brand, and city
    if search:
        s_term = search.strip().lower()
        installers = [
            i for i in installers
            if (
                s_term in i.name.lower() or 
                s_term in i.brand.lower() or 
                s_term in i.location_city.lower()
            )
        ]

    return [
        InstallerOut(
            id=i.id,
            name=i.name,
            brand=i.brand,
            badge=i.badge,
            rating=i.rating,
            reviewsCount=i.reviews_count,
            completedInstallations=i.completed_installations,
            statesServed=i.states_served or [],
            contactPhone=i.contact_phone,
            email=i.email,
            locationCity=i.location_city,
            headquarters=i.headquarters,
            avgQuotePerKw=i.avg_quote_per_kw,
            warrantyYears=i.warranty_years,
            financePartner=i.finance_partner,
            features=i.features or [],
            verified=i.verified,
        )
        for i in installers
    ]


# ============================================================================
# SOLAR MYTHS ENDPOINT (WITH CATEGORY FILTER)
# ============================================================================

@app.get("/api/myths", response_model=List[MythOut], tags=["Myths & Education"])
def get_myths(
    category: Optional[str] = Query(None, description="Filter by myth category"),
    db: Session = Depends(get_db)
):
    """
    Retrieve common Indian rooftop solar myths, debunking facts, and MNRE verified truths,
    with optional category filter.
    """
    query = db.query(Myth)
    if category and category.strip() != "" and category.lower() != "all":
        query = query.filter(Myth.category == category)
    myths = query.all()
    return [
        MythOut(
            id=m.id,
            myth=m.myth,
            fact=m.fact,
            detailedTruth=m.detailed_truth,
            category=m.category,
            icon=m.icon,
            source=m.source,
        )
        for m in myths
    ]


# ============================================================================
# PRESET QUIZ QUESTIONS ENDPOINT
# ============================================================================

@app.get("/api/quiz", response_model=List[QuizQuestionOut], tags=["Myths & Education"])
def get_quiz_questions(
    category: Optional[str] = Query(None, description="Filter by quiz category"),
    db: Session = Depends(get_db)
):
    """
    Retrieve interactive quiz questions testing citizen knowledge on rooftop solar,
    PM Surya Ghar subsidy eligibility, net metering, and savings.
    """
    query = db.query(QuizQuestion)
    if category and category.strip() != "" and category.lower() != "all":
        query = query.filter(QuizQuestion.category == category)
    questions = query.all()
    return [
        QuizQuestionOut(
            id=q.id,
            question=q.question,
            options=q.options or [],
            correctIndex=q.correct_index,
            explanation=q.explanation,
            category=q.category,
        )
        for q in questions
    ]




# ============================================================================
# ADMIN AUTHENTICATION DEPENDENCY
# ============================================================================

def verify_admin_key(
    x_admin_key: Optional[str] = Header(None, alias="X-Admin-Key"),
    admin_key: Optional[str] = Query(None, alias="admin_key")
):
    """
    Verifies that the caller provided the correct ADMIN_API_KEY from .env.
    Accepts the key via either 'X-Admin-Key' HTTP Header or '?admin_key=' query parameter.
    """
    expected_key = os.getenv("ADMIN_API_KEY", "solar_era_admin_secret_2026")
    provided_key = x_admin_key or admin_key
    if not provided_key or provided_key != expected_key:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized: Invalid or missing Admin API Key. Provide via 'X-Admin-Key' header or '?admin_key=' query param."
        )
    return True


# ============================================================================
# QUOTE & LEAD MANAGEMENT ENDPOINTS
# ============================================================================

@app.post("/api/quotes", response_model=QuoteSubmissionSuccess, status_code=201, tags=["Quotes & Leads"])
def create_quote_request(
    quote_data: QuoteRequestCreate,
    db: Session = Depends(get_db)
):
    """
    Submit a free rooftop solar quote and doorstep site survey request.
    Validates client name, phone number (10-digit Indian mobile), 6-digit pin code,
    and empanelled installer ID.
    Saves the lead into SQLite quote_requests table.
    """
    # 1. Validate that the installer exists in the database
    installer = db.query(Installer).filter(Installer.id == quote_data.installer_id).first()
    if not installer:
        raise HTTPException(
            status_code=404,
            detail=f"Installer with ID '{quote_data.installer_id}' not found. Please choose a valid empanelled installer."
        )

    # 2. Persist to quote_requests table
    new_quote = QuoteRequest(
        installer_id=installer.id,
        client_name=quote_data.client_name,
        client_phone=quote_data.client_phone,
        client_city=quote_data.client_city,
        pincode=quote_data.pincode,
        state_code=quote_data.state_code,
        estimated_kw=quote_data.estimated_kw or "3 kW",
        monthly_bill=quote_data.monthly_bill,
        roof_area_sqft=quote_data.roof_area_sqft,
        status="pending"
    )

    db.add(new_quote)
    db.commit()
    db.refresh(new_quote)

    return QuoteSubmissionSuccess(
        success=True,
        message=f"Quote request successfully submitted! An engineer from {installer.name} will contact you on {quote_data.client_phone}.",
        quoteId=new_quote.id,
        clientName=new_quote.client_name,
        installerName=installer.name
    )


@app.get("/api/quotes", response_model=List[QuoteLeadOut], tags=["Quotes & Leads"])
def get_quote_leads(
    authorized: bool = Depends(verify_admin_key),
    db: Session = Depends(get_db)
):
    """
    Protected Admin endpoint to view all submitted quote requests and survey leads.
    Requires ADMIN_API_KEY from .env via 'X-Admin-Key' header or '?admin_key=' query parameter.
    """
    quotes = db.query(QuoteRequest).order_by(QuoteRequest.created_at.desc()).all()
    leads = []
    for q in quotes:
        installer_name = q.installer.name if q.installer else "Unknown Installer"
        leads.append(
            QuoteLeadOut(
                id=q.id,
                installerId=q.installer_id,
                installerName=installer_name,
                clientName=q.client_name,
                clientPhone=q.client_phone,
                clientCity=q.client_city,
                pincode=q.pincode,
                stateCode=q.state_code,
                estimatedKw=q.estimated_kw,
                status=q.status or "pending",
                createdAt=q.created_at
            )
        )
    return leads


# ============================================================================
# GREEN CITIZEN & MISSION LIFE ENDPOINTS
# ============================================================================

def generate_unique_certificate_id(db: Session) -> str:
    """
    Generates a unique, official Green Citizen certificate ID in the format:
    IND-GC-{YEAR}-{5-digit-token}
    and guarantees uniqueness against the citizens table.
    """
    year = datetime.now().year
    while True:
        token = random.randint(10000, 99999)
        candidate = f"IND-GC-{year}-{token}"
        exists = db.query(Citizen).filter(Citizen.certificate_id == candidate).first()
        if not exists:
            return candidate


def format_citizen_out(c: Citizen) -> CitizenOut:
    """Formats a Citizen database model instance into a CitizenOut response schema."""
    registered_str = ""
    if c.registered_at:
        if isinstance(c.registered_at, str):
            registered_str = c.registered_at
        else:
            registered_str = c.registered_at.strftime("%Y-%m-%d")
    else:
        registered_str = datetime.now().strftime("%Y-%m-%d")

    return CitizenOut(
        id=c.id,
        fullName=c.full_name,
        email=c.email,
        phone=c.phone,
        city=c.city,
        stateCode=c.state_code,
        housingType=c.housing_type or "independent_house",
        householdMembers=c.household_members or 4,
        monthlyElectricityBill=c.monthly_electricity_bill or 3500.0,
        monthlyUnitsKwh=c.monthly_units_kwh or 450.0,
        solarSystemKw=c.solar_system_kw or 0.0,
        hasEv=bool(c.has_ev),
        dailyCommuteKm=c.daily_commute_km or 20.0,
        commuteMode=c.commute_mode or "petrol_diesel",
        dietPreference=c.diet_preference or "vegetarian",
        certificateId=c.certificate_id,
        totalQuizScore=c.total_quiz_score or 0,
        quizzesCompletedCount=c.quizzes_completed_count or 0,
        completedActionIds=c.completed_action_ids or [],
        unlockedBadgeIds=c.unlocked_badge_ids or ["b1"],
        registeredAt=registered_str,
    )


@app.post("/api/citizens/pledge", response_model=CitizenOut, status_code=200, tags=["Green Citizen & Mission LiFE"])
@app.post("/api/citizens", response_model=CitizenOut, status_code=200, tags=["Green Citizen & Mission LiFE"])
def save_citizen_pledge(
    data: CitizenPledgeCreate,
    db: Session = Depends(get_db)
):
    """
    Save or update a Green Citizen profile & Mission LiFE pledge in the citizens table.
    Generates a unique, verified certificate ID on the backend.
    """
    citizen = None
    if data.id:
        citizen = db.query(Citizen).filter(Citizen.id == data.id).first()
    
    if not citizen and data.email:
        citizen = db.query(Citizen).filter(Citizen.email == data.email.strip().lower()).first()

    if not citizen:
        # Create brand new citizen with new unique citizen ID and unique certificate ID
        new_id = data.id if data.id else f"cit_{uuid.uuid4().hex[:12]}"
        cert_id = generate_unique_certificate_id(db)
        citizen = Citizen(
            id=new_id,
            full_name=data.full_name.strip(),
            email=data.email.strip().lower(),
            phone=data.phone,
            city=data.city.strip(),
            state_code=data.state_code.upper().strip(),
            housing_type=data.housing_type or "independent_house",
            household_members=data.household_members or 4,
            monthly_electricity_bill=data.monthly_electricity_bill or 3500.0,
            monthly_units_kwh=data.monthly_units_kwh or 450.0,
            solar_system_kw=data.solar_system_kw or 0.0,
            has_ev=data.has_ev or False,
            daily_commute_km=data.daily_commute_km or 20.0,
            commute_mode=data.commute_mode or "petrol_diesel",
            diet_preference=data.diet_preference or "vegetarian",
            certificate_id=cert_id,
            completed_action_ids=data.completed_action_ids or [],
            unlocked_badge_ids=data.unlocked_badge_ids or ["b1"],
            total_quiz_score=0,
            quizzes_completed_count=0,
        )
        db.add(citizen)
    else:
        # Update existing citizen
        citizen.full_name = data.full_name.strip()
        citizen.email = data.email.strip().lower()
        if data.phone is not None:
            citizen.phone = data.phone
        citizen.city = data.city.strip()
        citizen.state_code = data.state_code.upper().strip()
        if data.housing_type:
            citizen.housing_type = data.housing_type
        if data.household_members is not None:
            citizen.household_members = data.household_members
        if data.monthly_electricity_bill is not None:
            citizen.monthly_electricity_bill = data.monthly_electricity_bill
        if data.monthly_units_kwh is not None:
            citizen.monthly_units_kwh = data.monthly_units_kwh
        if data.solar_system_kw is not None:
            citizen.solar_system_kw = data.solar_system_kw
        if data.has_ev is not None:
            citizen.has_ev = data.has_ev
        if data.daily_commute_km is not None:
            citizen.daily_commute_km = data.daily_commute_km
        if data.commute_mode:
            citizen.commute_mode = data.commute_mode
        if data.diet_preference:
            citizen.diet_preference = data.diet_preference
        if data.completed_action_ids is not None:
            citizen.completed_action_ids = data.completed_action_ids
        if data.unlocked_badge_ids is not None:
            citizen.unlocked_badge_ids = data.unlocked_badge_ids
        if not citizen.certificate_id:
            citizen.certificate_id = generate_unique_certificate_id(db)

    db.commit()
    db.refresh(citizen)
    return format_citizen_out(citizen)


@app.get("/api/citizens/{citizen_id}", response_model=CitizenOut, tags=["Green Citizen & Mission LiFE"])
def get_citizen_profile(
    citizen_id: str,
    db: Session = Depends(get_db)
):
    """
    Fetch a registered citizen's profile and progress metrics by citizen ID.
    """
    citizen = db.query(Citizen).filter(Citizen.id == citizen_id).first()
    if not citizen:
        raise HTTPException(status_code=404, detail=f"Citizen with ID '{citizen_id}' not found.")
    return format_citizen_out(citizen)


@app.post("/api/citizens/{citizen_id}/quiz-points", response_model=CitizenOut, tags=["Green Citizen & Mission LiFE"])
def update_citizen_quiz_points(
    citizen_id: str,
    payload: CitizenQuizPointsUpdate,
    db: Session = Depends(get_db)
):
    """
    Update and persist quiz points and completed quizzes count for a citizen in the citizens table.
    """
    citizen = db.query(Citizen).filter(Citizen.id == citizen_id).first()
    if not citizen:
        raise HTTPException(status_code=404, detail=f"Citizen with ID '{citizen_id}' not found.")

    citizen.total_quiz_score = (citizen.total_quiz_score or 0) + payload.points
    citizen.quizzes_completed_count = (citizen.quizzes_completed_count or 0) + (payload.quizzes_completed_count or 1)
    
    # Auto-unlock achievement badges if milestones reached
    badges = list(citizen.unlocked_badge_ids or [])
    if citizen.total_quiz_score >= 5 and "b2" not in badges:
        badges.append("b2")
    if citizen.total_quiz_score >= 10 and "b4" not in badges:
        badges.append("b4")
    citizen.unlocked_badge_ids = badges

    db.commit()
    db.refresh(citizen)
    return format_citizen_out(citizen)


@app.get("/api/citizens/{citizen_id}/certificate", response_model=CitizenCertificateOut, tags=["Green Citizen & Mission LiFE"])
def get_citizen_certificate(
    citizen_id: str,
    db: Session = Depends(get_db)
):
    """
    Fetch verified Green Citizen certificate details and verified environmental impact metrics.
    """
    citizen = db.query(Citizen).filter(Citizen.id == citizen_id).first()
    if not citizen:
        raise HTTPException(status_code=404, detail=f"Citizen with ID '{citizen_id}' not found.")

    # Look up state name from State table if available
    state = db.query(State).filter(State.code == citizen.state_code).first()
    state_name = state.name if state else citizen.state_code

    kw = citizen.solar_system_kw if citizen.solar_system_kw and citizen.solar_system_kw > 0 else 3.3
    annual_units = kw * 1450.0
    total_units = round(annual_units * 2.5)
    co2_saved_kg = round(total_units * 0.82)
    trees_equiv = round(co2_saved_kg / 20.0)
    coal_saved_kg = round(total_units * 0.45)

    registered_str = ""
    if citizen.registered_at:
        if isinstance(citizen.registered_at, str):
            registered_str = citizen.registered_at
        else:
            registered_str = citizen.registered_at.strftime("%Y-%m-%d")
    else:
        registered_str = datetime.now().strftime("%Y-%m-%d")

    return CitizenCertificateOut(
        citizenId=citizen.id,
        certificateId=citizen.certificate_id,
        fullName=citizen.full_name,
        city=citizen.city,
        stateCode=citizen.state_code,
        stateName=state_name,
        registeredAt=registered_str,
        solarSystemKw=kw,
        totalQuizScore=citizen.total_quiz_score or 0,
        quizzesCompletedCount=citizen.quizzes_completed_count or 0,
        verified=True,
        totalCo2SavedKg=float(co2_saved_kg),
        treesEquivalent=trees_equiv,
        coalSavedKg=float(coal_saved_kg),
        totalUnitsGenerated=float(total_units),
    )


# ============================================================================
# GEMINI AI INTERACTIVE ROUTES & FALLBACKS
# ============================================================================

def call_gemini_json(prompt: str) -> Optional[Any]:
    """
    Calls the Google Gemini API requesting strict JSON output.
    Tries current recommended models ('gemini-3.5-flash-lite', 'gemini-3.8-flash').
    Catches 429 rate limits, 503 capacity spikes, and timeouts gracefully.
    """
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        return None

    models_to_try = [
        os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite"),
        "gemini-3.8-flash"
    ]
    seen = set()
    models = [m for m in models_to_try if not (m in seen or seen.add(m))]

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ],
        "generationConfig": {
            "response_mime_type": "application/json",
            "temperature": 0.7
        }
    }

    for model_name in models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
        try:
            with httpx.Client(timeout=14.0) as client:
                resp = client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            raw_text = parts[0].get("text", "").strip()
                            return json.loads(raw_text)
                elif resp.status_code == 429:
                    print(f"[Gemini API Notice] Rate limit hit (429) on model {model_name}.")
                elif resp.status_code == 503:
                    print(f"[Gemini API Notice] Model {model_name} temporarily busy (503).")
                else:
                    print(f"[Gemini API Notice] Status {resp.status_code} on model {model_name}: {resp.text[:140]}")
        except Exception as e:
            print(f"[Gemini API Notice] Request error with model {model_name}: {e}")

    return None


@app.post("/api/ai/generate-quiz", response_model=GenerateQuizResponse, tags=["Gemini AI Features"])
def generate_ai_quiz(
    req: GenerateQuizRequest,
    db: Session = Depends(get_db)
):
    """
    Generate interactive solar quiz questions using Google Gemini API.
    Enforces valid JSON output, validates question structure using Pydantic,
    and provides a seamless fallback to curated preset database questions if rate-limited or offline.
    """
    prompt = f"""Generate 3 educational multiple-choice quiz questions and myth-busting challenges about residential rooftop solar in India.
Topic: {req.topic or 'Indian Rooftop Solar, PM Surya Ghar Muft Bijli Yojana & Net Metering'}
Difficulty: {req.difficulty or 'Intermediate'}

Return ONLY a JSON array with exactly 3 objects matching this schema:
[
  {{
    "id": "q-ai-1",
    "question": "Clear question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Clear, informative explanation citing PM Surya Ghar or technical facts.",
    "category": "Subsidies & Policy"
  }}
]"""

    ai_data = call_gemini_json(prompt)

    if ai_data and isinstance(ai_data, list):
        validated_questions = []
        for idx, item in enumerate(ai_data):
            try:
                if not item.get("id"):
                    item["id"] = f"q-ai-{idx+1}-{uuid.uuid4().hex[:6]}"
                validated = GeneratedQuizItem(**item)
                validated_questions.append(validated)
            except Exception as val_err:
                print(f"[AI Quiz Validation Warning] Item {idx} failed validation: {val_err}")

        if validated_questions:
            return GenerateQuizResponse(
                success=True,
                quizzes=validated_questions,
                source="gemini"
            )

    # Friendly Fallback to preset quiz questions from SQLite database
    preset_questions = db.query(QuizQuestion).limit(3).all()
    fallback_items = []
    for q in preset_questions:
        fallback_items.append(
            GeneratedQuizItem(
                id=q.id,
                question=q.question,
                options=q.options or ["True", "False", "Partially", "None"],
                correctIndex=q.correct_index,
                explanation=q.explanation,
                category=q.category or "General Solar"
            )
        )

    if not fallback_items:
        fallback_items = [
            GeneratedQuizItem(
                id="q-fb-1",
                question="Under PM Surya Ghar Muft Bijli Yojana, what is the central government subsidy for a 3 kW residential rooftop solar system?",
                options=["₹30,000", "₹50,000", "₹78,000", "₹1,00,000"],
                correctIndex=2,
                explanation="The Ministry of New and Renewable Energy (MNRE) provides ₹30,000 for 1 kW, ₹60,000 for 2 kW, and ₹78,000 for 3 kW or higher systems directly to the homeowner's bank account via DBT.",
                category="Government Schemes"
            ),
            GeneratedQuizItem(
                id="q-fb-2",
                question="Do solar panels generate electricity on cloudy or rainy monsoon days in India?",
                options=[
                    "No, they produce 0% electricity without direct sunlight",
                    "Yes, they still produce 20% - 40% of their rated capacity using ambient diffuse light",
                    "They only work if battery storage is attached",
                    "Rainwater permanently damages the photovoltaic cells"
                ],
                correctIndex=1,
                explanation="Solar panels work on photons (light), not heat. Even in cloudy monsoon weather, diffuse daylight generates 20%–40% electricity, and rain naturally cleans dust off panels!",
                category="Solar Myths"
            )
        ]

    return GenerateQuizResponse(
        success=True,
        quizzes=fallback_items,
        source="fallback",
        note="Served verified preset solar questions (Gemini fallback active)"
    )


@app.post("/api/ai/personalized-eco-advice", response_model=PersonalizedEcoAdviceResponse, tags=["Gemini AI Features"])
def get_personalized_eco_advice(
    req: PersonalizedEcoAdviceRequest
):
    """
    Generate personalized eco recommendations and carbon footprint reduction roadmap
    using Google Gemini API, with tailored fallback if rate-limited or offline.
    """
    profile = req.profile or {}
    footprint = req.footprintSummary or {}

    user_name = profile.get("fullName", "Citizen")
    city = profile.get("city", "India")
    solar_kw = float(profile.get("solarSystemKw") or 0.0)
    bill = float(profile.get("monthlyElectricityBill") or 3500.0)

    prompt = f"""You are the Chief Environmental Advisor and Sustainability Architect for the Solar Era app in India.
Analyze this individual's household profile and carbon footprint:
Profile:
- Name: {user_name}
- Location: {city}, State Code: {profile.get("stateCode", "DL")}
- Housing: {profile.get("housingType", "Independent House")}
- Family Members: {profile.get("householdMembers", 4)}
- Monthly Electricity: ₹{bill} (~{profile.get("monthlyUnitsKwh", 450)} kWh)
- Existing Rooftop Solar: {solar_kw} kW
- Daily Commute: {profile.get("dailyCommuteKm", 20)} km via {profile.get("commuteMode", "petrol_diesel")}
- EV Owner: {"Yes" if profile.get("hasEv") else "No"}
- Diet: {profile.get("dietPreference", "vegetarian")}
Footprint Metrics:
{json.dumps(footprint)}

Provide customized, realistic, high-impact environmental action recommendations specifically for this user in India aligned with Government of India's Mission LiFE (Lifestyle for Environment) and Panchamrit Net-Zero 2070 goals.
Return ONLY valid JSON matching this schema:
{{
  "summary": "warm, personalized 2-sentence summary acknowledging their score and next milestones",
  "recommendations": [
    {{
      "id": "rec-ai-1",
      "category": "Solar & Energy",
      "title": "Action title",
      "impact": "e.g. Save ~1,400 kg CO2 / yr",
      "annualSavingsRupees": 28000,
      "difficulty": "High Impact",
      "description": "practical guidance on implementation in India",
      "isCompleted": false
    }}
  ]
}}"""

    ai_data = call_gemini_json(prompt)

    if ai_data and isinstance(ai_data, dict):
        try:
            summary = ai_data.get("summary", "")
            raw_recs = ai_data.get("recommendations", [])
            validated_recs = []
            for idx, r in enumerate(raw_recs):
                if not r.get("id"):
                    r["id"] = f"rec-ai-{idx+1}"
                validated_recs.append(EcoRecommendationItem(**r))

            if summary and validated_recs:
                return PersonalizedEcoAdviceResponse(
                    success=True,
                    summary=summary,
                    recommendations=validated_recs,
                    source="gemini"
                )
        except Exception as e:
            print(f"[AI Eco Advice Validation Warning] Failed parsing Gemini output: {e}")

    # Fallback tailored to the user profile
    fallback_summary = (
        f"Based on your household profile in {city} with {profile.get('householdMembers', 4)} members "
        f"and a monthly electricity bill of ₹{bill:,.0f}, here are top environmental impact recommendations "
        f"aligned with India's Mission LiFE:"
    )

    fallback_recs = [
        EcoRecommendationItem(
            id="rec-fb-1",
            category="Solar & Energy",
            title="Adopt 3.3 kW Rooftop Solar under PM Surya Ghar",
            impact="Cut ~3,800 kg CO2 / year & eliminate ₹28,000+ annual electric bills",
            annualSavingsRupees=28000.0,
            difficulty="High Impact",
            description="Leverage ₹78,000 direct bank subsidy and collateral-free ~7% SBI loan to generate 100% clean power with bi-directional net-metering.",
            isCompleted=bool(solar_kw >= 3.0)
        ),
        EcoRecommendationItem(
            id="rec-fb-2",
            category="Appliances & Efficiency",
            title="Upgrade to BEE 5-Star BLDC Fans & Inverter AC",
            impact="Reduce household cooling energy consumption by 45% (~750 kg CO2 / yr)",
            annualSavingsRupees=7200.0,
            difficulty="Easy",
            description="BLDC motor fans consume only 28-32W compared to 75W regular induction fans, saving ~150 kWh per room annually.",
            isCompleted=False
        ),
        EcoRecommendationItem(
            id="rec-fb-3",
            category="Mobility & EV",
            title="Transition Daily Commute to Solar-Charged Electric Two-Wheeler / EV",
            impact="Prevent ~1,200 kg CO2 tailpipe emissions and save ₹35,000 in petrol",
            annualSavingsRupees=35000.0,
            difficulty="Medium",
            description="Charging an EV via rooftop solar creates truly zero-emission mobility at an effective cost of less than ₹0.20 per km.",
            isCompleted=bool(profile.get("hasEv"))
        ),
        EcoRecommendationItem(
            id="rec-fb-4",
            category="Water & Terrace",
            title="Install Rooftop Rainwater Harvesting & Solar Water Heater",
            impact="Recharge 50,000+ Litres groundwater and cut water geyser load by 1,200 kWh/yr",
            annualSavingsRupees=8500.0,
            difficulty="Medium",
            description="Solar water heaters pay back in under 2 years and reduce peak winter heating electrical surge significantly.",
            isCompleted=False
        ),
        EcoRecommendationItem(
            id="rec-fb-5",
            category="Waste & Lifestyle",
            title="Home Terrace Composting & Single-Use Plastic Elimination (Mission LiFE)",
            impact="Divert 250 kg organic waste from landfills & prevent methane generation",
            annualSavingsRupees=2400.0,
            difficulty="Easy",
            description="Convert kitchen wet waste into nutrient-rich organic compost for rooftop potted terrace plants and cool your roof naturally.",
            isCompleted=False
        )
    ]

    return PersonalizedEcoAdviceResponse(
        success=True,
        summary=fallback_summary,
        recommendations=fallback_recs,
        source="fallback",
        note="Served tailored recommendations (Gemini fallback active)"
    )


# ============================================================================
# AI ROOFTOP ASSESSMENT ENDPOINT (PORTED FROM SERVER.TS)
# ============================================================================

@app.post("/api/ai/assess-roof", response_model=RoofAssessmentResponse, tags=["AI Rooftop Assessment"])
@app.post("/api/assess-roof", response_model=RoofAssessmentResponse, tags=["AI Rooftop Assessment"])
def assess_roof_endpoint(req: RoofAssessmentRequest):
    """
    Evaluates rooftop solar potential, optimal system size, estimated costs,
    PM Surya Ghar central subsidy, annual generation, payback period, and CEA-based carbon offsets.
    Uses Google Gemini with automatic fallback to deterministic MNRE / CEA calculations.
    """
    bill = req.monthlyBill if req.monthlyBill and req.monthlyBill > 0 else 3500.0
    area = req.roofAreaSqFt if req.roofAreaSqFt and req.roofAreaSqFt > 0 else 500.0
    state_str = req.state or "Karnataka"
    address_str = req.address or "India"
    roof_type_str = req.roofType or "Flat RCC Terrace"
    obstacles_str = req.obstacles or "Staircase mumty room, overhead water tank"
    panel_type_str = req.panelType or "Mono PERC Half-Cut 540W"

    prompt = f"""You are an expert Indian Solar Photovoltaic Engineer and MNRE (Ministry of New and Renewable Energy) certified consultant for the Solar Era platform.
Analyze the following residential rooftop solar requirements in India:
- Location/Address: {address_str}
- State: {state_str}
- Monthly Electricity Bill: ₹{bill:.0f}
- Rooftop Area Available: {area:.0f} sq.ft
- Roof Type: {roof_type_str}
- Shading/Obstacles: {obstacles_str}
- Preferred Panel Technology: {panel_type_str}

Provide an accurate, realistic assessment adhering to Indian Standards (PM Surya Ghar Muft Bijli Yojana subsidy slab: 1kW=₹30,000, 2kW=₹60,000, 3kW+=₹78,000; National Grid Emission Factor: {CEA_GRID_EMISSION_FACTOR_KG_PER_KWH} kg CO2/kWh from CEA CO2 Baseline Database).
Return ONLY valid JSON with this exact schema:
{{
  "recommendedCapacityKw": 3.3,
  "estimatedCost": 198000,
  "centralSubsidy": 78000,
  "netCost": 120000,
  "annualGenerationUnits": 4785,
  "annualSavings": 34452,
  "paybackYears": 3.5,
  "co2OffsetAnnualKg": 3924,
  "treesEquivalent": 196,
  "roofSuitabilityScore": 92,
  "orientationRecommendation": "South-facing at 18°-22° tilt for maximum Indian insolation year-round.",
  "shadingAnalysis": "Clean generation window from 8:30 AM to 4:30 PM with minimal obstruction.",
  "inverterRecommendation": "On-Grid Three-Phase String Inverter with Dual MPPT",
  "discomNotice": "Eligible for Net Metering under state DISCOM with PM Surya Ghar Muft Bijli Yojana DBT.",
  "aiNotes": "Calculated adhering to official MNRE guidelines and CEA 0.82 kg CO2/kWh grid baseline."
}}"""

    ai_data = call_gemini_json(prompt)

    if ai_data and isinstance(ai_data, dict):
        try:
            validated_data = RoofAssessmentData(
                recommendedCapacityKw=float(ai_data.get("recommendedCapacityKw", 3.0)),
                estimatedCost=float(ai_data.get("estimatedCost", 180000.0)),
                centralSubsidy=float(ai_data.get("centralSubsidy", 78000.0)),
                netCost=float(ai_data.get("netCost", 102000.0)),
                annualGenerationUnits=float(ai_data.get("annualGenerationUnits", 4350.0)),
                annualSavings=float(ai_data.get("annualSavings", 31320.0)),
                paybackYears=float(ai_data.get("paybackYears", 3.3)),
                co2OffsetAnnualKg=float(ai_data.get("co2OffsetAnnualKg", 3567.0)),
                treesEquivalent=int(ai_data.get("treesEquivalent", 178)),
                roofSuitabilityScore=int(ai_data.get("roofSuitabilityScore", 92)),
                orientationRecommendation=str(ai_data.get("orientationRecommendation", "True South (180°) at 18°-22° tilt")),
                shadingAnalysis=str(ai_data.get("shadingAnalysis", "Optimal rooftop generation window")),
                inverterRecommendation=str(ai_data.get("inverterRecommendation", "On-Grid String Inverter with Dual MPPT")),
                discomNotice=str(ai_data.get("discomNotice", f"Eligible for Net Metering under {state_str} DISCOM")),
                aiNotes=str(ai_data.get("aiNotes", f"Verified against MNRE PM Surya Ghar & CEA {CEA_GRID_EMISSION_FACTOR_KG_PER_KWH} kg CO2/kWh baseline"))
            )
            return RoofAssessmentResponse(
                success=True,
                data=validated_data,
                source="gemini"
            )
        except Exception as e:
            print(f"[AI Roof Assessment Warning] Failed parsing Gemini output: {e}")

    # Fallback to deterministic calculation
    deterministic_calc = calculate_roof_assessment_deterministic(
        monthly_bill=bill,
        roof_area_sqft=area,
        state=state_str,
        roof_type=roof_type_str,
        obstacles=obstacles_str,
        panel_type=panel_type_str
    )
    return RoofAssessmentResponse(
        success=True,
        data=RoofAssessmentData(**deterministic_calc),
        source="deterministic_fallback"
    )


# ============================================================================
# CARBON FOOTPRINT CALCULATION ENDPOINT (CEA 0.82 KG CO2/KWH BASELINE)
# ============================================================================

@app.post("/api/carbon/calculate", response_model=CarbonFootprintCalculationResponse, tags=["Carbon Footprint"])
def calculate_carbon_footprint_endpoint(req: CarbonFootprintCalculationRequest):
    """
    Computes household carbon footprint and rooftop solar greenhouse gas offsets
    using the official Central Electricity Authority (CEA) National Grid Baseline
    Emission Factor of 0.82 kg CO2/kWh.
    """
    result = calculate_carbon_footprint(
        system_capacity_kw=req.systemCapacityKw,
        years_installed=req.yearsInstalled,
        monthly_units_kwh=req.monthlyUnitsKwh,
        commute_mode=req.commuteMode,
        daily_commute_km=req.dailyCommuteKm,
        diet_preference=req.dietPreference,
        household_members=req.householdMembers
    )
    return CarbonFootprintCalculationResponse(**result)


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    # Run the server on port 8000 with auto-reload
    uvicorn.run("main:app", host="127.0.0.1", port=port, reload=True)


