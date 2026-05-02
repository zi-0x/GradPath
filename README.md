# GradPath

GradPath is a full-stack AI-assisted platform for university discovery, financing checks, personalized recommendations, nudges, and an in-app Copilot assistant.

## What is included

- Authentication, profiles, and persistent sessions
- Demo personas for quick setup: Anushka, Arnav, and Riya
- University discovery with search, filters, shortlist, and details
- Recommendations based on profile inputs such as CGPA, GRE, budget, and preferred countries
- Financing tools including loan eligibility, EMI planning, and loan offers
- Nudges and growth tracking
- Copilot chat with context-aware responses and prompt chips
- Admin CRUD for universities, loan offers, and nudges
- SQLite by default, with Postgres support through `DATABASE_URL`
- Backend unit tests and a production frontend build

## Quick start

### 1. Backend

From the repo root:

```powershell
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Backend URL:

- API: http://127.0.0.1:8000
- Docs: http://127.0.0.1:8000/docs

### 2. Frontend

In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Frontend URL:

- App: http://localhost:5173

### 3. Optional DB seed

If you want to recreate the demo data in the database:

```powershell
Invoke-RestMethod -Method Post http://127.0.0.1:8000/api/v1/admin/init-db
```

## Recommended run order

1. Start the backend first.
2. Start the frontend second.
3. Open the frontend and activate a demo persona or register a new account.
4. Try Discover, Finance, Growth, Copilot, and Admin.

## Verification

Run backend tests from the backend folder:

```powershell
cd backend
pytest -q
```

Build the frontend for production from the frontend folder:

```powershell
cd frontend
npm run build
```

## Demo data

- Personas: Anushka, Arnav, Riya
- Universities: Toronto, TU Munich, Melbourne, ASU, Dublin, NUS
- Loan offers: three seeded lender options
- Nudges: scholarship, deadline, and funding reminders

## Configuration

Set these environment variables if you need non-default behavior:

- `DATABASE_URL`: `sqlite:///./gradpath.db` or a Postgres connection string
- `GEMINI_API_KEY`: optional, for AI-backed Copilot responses
- `VITE_API_BASE_URL`: defaults to `http://localhost:8000/api/v1`

Example PowerShell session:

```powershell
$env:DATABASE_URL = 'sqlite:///./gradpath.db'
$env:GEMINI_API_KEY = 'your_key_here'
$env:VITE_API_BASE_URL = 'http://localhost:8000/api/v1'
```

## Docker

Start both services with:

```powershell
docker-compose up --build
```

Backend: http://127.0.0.1:8000

Frontend: http://localhost:5173

## Troubleshooting

- If `uvicorn` cannot import `app`, make sure you run it from the `backend` folder.
- If the frontend cannot reach the API, confirm the backend is still running on port 8000.
- If the frontend shows stale data, refresh the page after activating a persona or resetting demo data.

## Notes

- Passwords are stored in plain text for demo purposes only.
- Production hardening is still needed before real deployment: HTTPS, password hashing, refresh tokens, and rate limiting.
