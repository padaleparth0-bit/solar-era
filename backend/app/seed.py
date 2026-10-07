import sys
from pathlib import Path

# Make sure the backend root is on the path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.database import engine, SessionLocal, Base
from app.models import State, GovernmentScheme, Installer, Myth, QuizQuestion
from app.solar_seed_data import STATES, INSTALLERS, MYTHS, QUIZ_QUESTIONS, GOVERNMENT_SCHEMES


def seed_database():
    """
    Reads data from solar_seed_data.py (a Python mirror of solarData.ts)
    and inserts all records into the SQLite database.
    Safe to run multiple times — skips existing rows.
    """
    print("==================================================")
    print("Solar Era: SQLite Database Seeder")
    print("==================================================")

    print("Step 1: Creating all database tables (if not exist)...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    # --- Seed Indian States ---
    print(f"Step 2: Seeding {len(STATES)} Indian States solar profiles...")
    for s in STATES:
        if not db.query(State).filter_by(code=s["code"]).first():
            db.add(State(
                code=s["code"],
                name=s["name"],
                capital=s["capital"],
                avg_sun_hours_per_day=float(s["avgSunHoursPerDay"]),
                avg_tariff_per_kwh=float(s["avgTariffPerKwh"]),
                discoms=s["discoms"],
                state_subsidy_per_kw=float(s.get("stateSubsidyPerKw", 0)),
                state_policy_highlight=s["statePolicyHighlight"],
                net_metering_policy=s["netMeteringPolicy"],
                portalUrl=s["portalUrl"]
            ))

    # --- Seed Certified Installers ---
    print(f"Step 3: Seeding {len(INSTALLERS)} Certified Solar Installers...")
    for inst in INSTALLERS:
        if not db.query(Installer).filter_by(id=inst["id"]).first():
            db.add(Installer(
                id=inst["id"],
                name=inst["name"],
                brand=inst["brand"],
                badge=inst["badge"],
                rating=float(inst["rating"]),
                reviews_count=int(inst["reviewsCount"]),
                completed_installations=int(inst["completedInstallations"]),
                states_served=inst["statesServed"],
                contact_phone=inst["contactPhone"],
                email=inst["email"],
                location_city=inst["locationCity"],
                headquarters=inst["headquarters"],
                avg_quote_per_kw=float(inst["avgQuotePerKw"]),
                warranty_years=int(inst["warrantyYears"]),
                finance_partner=inst["financePartner"],
                features=inst["features"],
                verified=bool(inst["verified"])
            ))

    # --- Seed Solar Myths ---
    # TODO: Verify myth facts with National Institute of Solar Energy (NISE) reports
    print(f"Step 4: Seeding {len(MYTHS)} Solar Myths vs Facts...")
    for m in MYTHS:
        if not db.query(Myth).filter_by(id=m["id"]).first():
            db.add(Myth(
                id=m["id"],
                myth=m["myth"],
                fact=m["fact"],
                detailed_truth=m["detailedTruth"],
                category=m["category"],
                icon=m["icon"],
                source="Ministry of New & Renewable Energy (MNRE) Technical FAQs & NISE Solar Handbook"
            ))

    # --- Seed Quiz Questions ---
    print(f"Step 5: Seeding {len(QUIZ_QUESTIONS)} Preset Quiz Questions...")
    for q in QUIZ_QUESTIONS:
        if not db.query(QuizQuestion).filter_by(id=q["id"]).first():
            db.add(QuizQuestion(
                id=q["id"],
                question=q["question"],
                options=q["options"],
                correct_index=int(q["correctIndex"]),
                explanation=q["explanation"],
                category=q["category"]
            ))

    # --- Seed Government Schemes ---
    # TODO: Verify subsidy slabs with latest MNRE circulars at https://pmsuryaghar.gov.in
    print(f"Step 6: Seeding {len(GOVERNMENT_SCHEMES)} Government Schemes & Loans...")
    for sch in GOVERNMENT_SCHEMES:
        if not db.query(GovernmentScheme).filter_by(id=sch["id"]).first():
            db.add(GovernmentScheme(
                id=sch["id"],
                name=sch["name"],
                short_name=sch["shortName"],
                target_audience=sch["targetAudience"],
                ministry=sch["ministry"],
                badge_text=sch["badgeText"],
                subsidy_structure=sch["subsidyStructure"],
                key_benefits=sch["keyBenefits"],
                application_steps=sch["applicationSteps"],
                official_portal_url=sch["officialPortalUrl"],
                helpline=sch.get("helpline"),
                direct_apply_url=sch["directApplyUrl"],
                source="Ministry of New & Renewable Energy (MNRE) / PM Surya Ghar Portal (pmsuryaghar.gov.in)"
            ))

    db.commit()
    db.close()

    print("==================================================")
    print("[SUCCESS] Database seeded: backend/solar_era.db")
    print("Tables populated: states, installers, myths, quiz_questions, government_schemes")
    print("==================================================")


if __name__ == "__main__":
    seed_database()
