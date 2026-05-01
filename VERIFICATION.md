# GradPath Verification

Use this checklist before a demo or handoff.

## Local Startup
1. Start the backend.
   - `cd backend`
   - `pip install -r requirements.txt`
   - `uvicorn app.main:app --reload --port 8000`
2. Start the frontend.
   - `cd frontend`
   - `npm install`
   - `npm run dev`
3. Open the frontend in a browser and confirm the auth landing page loads.

## Core End-to-End Checks
1. Auth and profile
   - Register a new user or activate a seeded persona.
   - Log in and confirm the session persists after a browser refresh.
   - Open the Profile tab, update name, program, CGPA, IELTS, budget, funding need, stage, intake, and preferred countries.
   - Save the profile and confirm the dashboard and recommendation list refresh.

2. Discovery and recommendations
   - Open Discover.
   - Search by country and program.
   - Change ranking filters and sort order.
   - Open a university detail card.
   - Shortlist and remove a university.
   - Generate recommendations and verify the cards update with fit score, ROI estimate, and drivers.

3. Financing
   - Open Finance.
   - Run the eligibility check with a requested amount.
   - Verify a score, interest rate, and reason are returned.
   - Accept a loan offer.
   - Confirm the offer status changes to accepted and the dashboard counts update.

4. Nudges and Growth OS
   - Open Growth OS.
   - Confirm unread nudges are visible.
   - Mark a nudge as read.
   - Verify the unread count drops and the activity feed updates.

5. Copilot
   - Open Copilot.
   - Use a prompt chip or ask a custom question.
   - Confirm only one request is processed at a time.
   - Ask a follow-up and verify the response uses the current profile context.

6. Admin
   - Open Admin.
   - Confirm the aggregate counts render.
   - Use Reset demo data.
   - Verify the demo state is restored.

## Expected Demo Data
- Seed personas: Aarav, Meera, and Riya.
- Universities: Toronto, TU Munich, Melbourne, ASU, UCD, and NUS.
- Loan offers: three seeded lender options.
- Nudges: scholarship, deadline, and funding reminders.

## Useful Endpoints
- Auth: `/api/v1/auth/register`, `/api/v1/auth/login`
- Profile: `/api/v1/users/me`
- Discovery: `/api/v1/universities`
- Recommendations: `/api/v1/recommendations/generate`
- Finance: `/api/v1/loan/offers`, `/api/v1/loan/eligibility`
- Nudges: `/api/v1/nudges/me`
- Copilot: `/api/v1/mentor/chat`
