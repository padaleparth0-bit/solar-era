# ☀️ Sol-Era — Indian Rooftop Solar Intelligence Platform

Sol-Era is a full-stack web application that helps Indian households evaluate rooftop solar viability, calculate government subsidies, track carbon savings, and take the Mission LiFE Green Citizen pledge.

---

## Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                          Sol-Era                                   │
│                                                                    │
│  ┌──────────────────────┐         ┌───────────────────────────┐   │
│  │   Frontend (Vite)    │  HTTP   │    Backend (FastAPI)      │   │
│  │   React + TypeScript │◄───────►│    Python 3.11+           │   │
│  │   Port 5173          │  /api/* │    Port 8000              │   │
│  │                      │         │                           │   │
│  │  Components:         │         │  Routes:                  │   │
│  │  ├ SolarCalculator   │         │  ├ POST /api/calculate    │   │
│  │  ├ RoofVisualizer    │         │  ├ POST /api/quotes       │   │
│  │  ├ CarbonFootprint   │         │  ├ POST /api/carbon/      │   │
│  │  │   Tracker         │         │  │        calculate       │   │
│  │  ├ GovernmentSchemes │         │  ├ GET  /api/installers   │   │
│  │  ├ GreenCitizen      │         │  ├ GET  /api/schemes      │   │
│  │  ├ InstallerNetwork  │         │  ├ POST /api/citizens/    │   │
│  │  ├ QuizSection       │         │  │        pledge          │   │
│  │  └ CertificateModal  │         │  ├ POST /api/ai/          │   │
│  │                      │         │  │        assess-roof     │   │
│  │  Services:           │         │  ├ POST /api/ai/          │   │
│  │  └ api.ts            │         │  │        generate-quiz   │   │
│  │    (all fetch calls) │         │  └ POST /api/ai/          │   │
│  │                      │         │      personalized-advice  │   │
│  └──────────────────────┘         │                           │   │
│                                   │  Core Modules:            │   │
│                                   │  ├ calculator.py          │   │
│                                   │  │   (solar engine)       │   │
│                                   │  ├ models.py (SQLAlchemy) │   │
│                                   │  ├ schemas.py (Pydantic)  │   │
│                                   │  └ database.py (SQLite)   │   │
│                                   │                           │   │
│                                   │  AI:                      │   │
│                                   │  └ Gemini Flash           │   │
│                                   │    (quiz + roof + advice) │   │
│                                   │    w/ deterministic       │   │
│                                   │    fallback on error      │   │
│                                   │                           │   │
│                                   │  Data:                    │   │
│                                   │  └ solar_era.db (SQLite)  │   │
│                                   └───────────────────────────┘   │
└────────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer    | Technology                                                  |
|----------|-------------------------------------------------------------|
| Frontend | React 19, TypeScript, Vite, TailwindCSS v4, Lucide React   |
| Backend  | FastAPI, Uvicorn, SQLAlchemy, Pydantic v2, Python-dotenv   |
| Database | SQLite (single-file, `backend/solar_era.db`)                |
| AI       | Google Gemini Flash via AI Studio free API                  |
| Testing  | pytest, FastAPI TestClient                                  |
| Dev      | concurrently (runs both servers with one command)           |

---

## Quick Setup

### Prerequisites
- **Node.js** v18+ with npm
- **Python** 3.11+
- A free **Google AI Studio** API key (for AI features)

---

### 1. Clone and navigate

```bash
git clone <your-repo-url>
cd Sol-Era
```

---

### 2. Backend setup

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS / Linux

# Install dependencies (includes pytest)
pip install -r requirements.txt

# Create .env from example
copy .env.example .env          # Windows
# cp .env.example .env          # macOS / Linux
```

Edit `backend/.env` and fill in your values:

```env
# Required: Get a free key at https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: protect the admin leads endpoint
ADMIN_API_KEY=solar_era_admin_secret_2026

# Auto-set by the app — leave as-is
DATABASE_URL=sqlite:///./solar_era.db
```

> **Never put `GEMINI_API_KEY` in any frontend file.** It is read only by the FastAPI backend.

Seed the database with states, installers, schemes, and quiz questions:

```bash
python -m app.seed
```

---

### 3. Frontend setup

```bash
cd ../frontend
npm install
```

Verify `frontend/.env` (or `frontend/.env.local`):
```env
VITE_API_BASE_URL=http://localhost:8000
```

---

### 4. Run everything with one command

From the `frontend/` directory:

```bash
npm run dev:all
```

This uses [`concurrently`](https://github.com/open-cli-tools/concurrently) to start both servers simultaneously:

| Service  | URL                         |
|----------|-----------------------------|
| Frontend | http://localhost:5173        |
| Backend  | http://localhost:8000        |
| API docs | http://localhost:8000/docs   |

To run each server independently:

```bash
# Terminal 1 — Backend
cd backend
.venv\Scripts\python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload

# Terminal 2 — Frontend
cd frontend
npm run dev
```

---

## Running Tests

All tests live in `backend/tests/`. No live server is required — FastAPI's `TestClient` runs the app in-process.

```bash
cd backend
.venv\Scripts\activate

# Run all tests
python -m pytest tests/ -v

# Run only unit tests (no DB needed)
python -m pytest tests/test_calculator.py -v

# Run only endpoint integration tests
python -m pytest tests/test_endpoints.py -v
```

### Test coverage

| File | What it tests |
|---|---|
| [`tests/test_calculator.py`](backend/tests/test_calculator.py) | CEA constant (0.82 kg CO₂/kWh), `calculate_carbon_footprint()` maths across all 4 commute modes, diet types, household sizes, edge cases; `calculate_roof_assessment_deterministic()` subsidy slabs, CO₂ formula, inverter selection |
| [`tests/test_endpoints.py`](backend/tests/test_endpoints.py) | `POST /api/quotes` — validation, 404 for bad installer; `POST /api/citizens/pledge` — creation, upsert, cert ID format; `POST /api/carbon/calculate` — CEA factor, defaults, net-zero; `POST /api/ai/assess-roof` — fallback response shape |

> **Note:** The endpoint tests use the real `solar_era.db`. Run `python -m app.seed` before running `test_endpoints.py`.

---

## Emission Factor Reference

The CO₂ emission factor used throughout Sol-Era is:

```
CEA_GRID_EMISSION_FACTOR_KG_PER_KWH = 0.82  # kg CO₂ avoided per kWh generated
```

**Source:** [Central Electricity Authority (CEA), Ministry of Power, Government of India —  
"CO₂ Baseline Database for the Indian Power Sector"](https://cea.nic.in/old/god/cdm/baseline_doc.pdf)  
*(Weighted Average Grid Emission Factor — updated periodically; verify the latest value before production use.)*

---

## Key API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/calculate` | Solar potential & subsidy calculation |
| `POST` | `/api/quotes` | Submit quote / lead request |
| `POST` | `/api/carbon/calculate` | Household carbon footprint |
| `POST` | `/api/citizens/pledge` | Register Green Citizen pledge |
| `POST` | `/api/ai/assess-roof` | AI rooftop assessment (Gemini + deterministic fallback) |
| `POST` | `/api/ai/generate-quiz` | AI-generated solar knowledge quiz |
| `POST` | `/api/ai/personalized-eco-advice` | Personalised eco action advice |
| `GET`  | `/api/states` | All 36 Indian states/UTs with data |
| `GET`  | `/api/installers` | Empanelled MNRE installers |
| `GET`  | `/api/schemes` | Government solar schemes |
| `GET`  | `/docs` | Swagger / OpenAPI interactive docs |

---

## Project Structure

```
Sol-Era/
├── frontend/
│   ├── src/
│   │   ├── components/        # All React components
│   │   ├── services/api.ts    # All backend fetch calls
│   │   └── utils/             # citizenStorage, etc.
│   ├── package.json           # includes dev:all script
│   └── vite.config.ts
│
├── backend/
│   ├── main.py                # FastAPI app & all routes
│   ├── app/
│   │   ├── calculator.py      # Solar & carbon engine (CEA constants)
│   │   ├── models.py          # SQLAlchemy ORM models
│   │   ├── schemas.py         # Pydantic v2 request/response schemas
│   │   ├── database.py        # DB engine & session
│   │   └── seed.py            # Database seeder
│   ├── tests/
│   │   ├── test_calculator.py # Pure unit tests
│   │   └── test_endpoints.py  # Integration tests (TestClient)
│   ├── requirements.txt
│   ├── .env                   # Secret keys (git-ignored)
│   └── .env.example           # Safe template to commit
│
└── README.md
```

---

## Environment Variables Reference

### `backend/.env`

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Yes (for AI) | Free key from [AI Studio](https://aistudio.google.com/app/apikey) |
| `ADMIN_API_KEY` | No | Protects `GET /api/quotes` admin endpoint |
| `DATABASE_URL` | No | Defaults to `sqlite:///./solar_era.db` |

### `frontend/.env`

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8000` | Backend base URL |

---

## Gemini Model & Free-Tier Limits

The app uses **`gemini-2.0-flash-lite`** (check `backend/main.py` for the exact model string).

Current free-tier limits (verify at [ai.google.dev/pricing](https://ai.google.dev/pricing)):
- **15 requests/minute** per project
- **1,500 requests/day**
- **1 million tokens/minute**

All three AI endpoints include deterministic fallbacks — if Gemini is rate-limited or unreachable, the backend returns a valid pre-computed response so the frontend never shows an error.
