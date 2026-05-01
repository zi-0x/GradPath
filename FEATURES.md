# GradPath — Feature Specification

This document lists the product features, user flows, acceptance criteria, UX notes, non-functional requirements, testing checklist and deliverables for the GradPath prototype. It intentionally excludes any stack or implementation details — focus is on product functionality and behavior.

---

## 1. Overview
- Purpose: Help students discover universities, evaluate financing options, receive personalized recommendations and nudges, and interact with an AI Copilot assistant to guide decisions.
- Target users: prospective graduate students (multiple personas), and administrators who manage seed data and offers.

## 2. Primary User Personas
- Student Persona (e.g., Aarav, Meera, Riya): a prospective student who wants discovery, recommendations, financing guidance and a personalized growth path.
- Admin Persona: manages data such as universities, loan offers, nudges, and recommendations for demonstration or testing.

## 3. Core Features (MVP and core expectations)

Each feature below includes a brief description, user flow, and acceptance criteria.

### 3.1 Authentication & Profile
- Description: Users can register, log in, and maintain a personal profile with program, test scores, work experience, budget and financial need.
- User flow: Register → Verify account (if required) → Login → Complete/edit profile → Persisted across sessions.
- Acceptance criteria:
  - A user can register with name, email and program.
  - A user can log in and remain authenticated between page loads.
  - A user's profile fields (name, program, CGPA, IELTS, work experience, budget, funding need, stage, intake) can be read and updated.
  - Profile updates are immediately reflected in the dashboard and recommendations.

### 3.2 Onboarding & Persona Selection
- Description: Quick persona selection or custom onboarding to populate the initial profile for demonstration.
- Acceptance criteria:
  - Users can choose a sample persona to populate the app immediately.
  - New users can complete an onboarding form to set key profile fields.

### 3.3 Dashboard
- Description: Personalized home screen showing profile summary, engagement stats, quick actions and recent activity (nudges, offers).
- Acceptance criteria:
  - Dashboard displays the user's name, stage, intake, and key stats (engagement points, streak, recommendation count, loan offers count).
  - Quick actions link to Discover, Finance, and Growth OS.

### 3.4 University Discovery
- Description: Search, browse and shortlist universities with filtering and sorting.
- User flow: Discover tab → Search/Filter → View list → View details modal → Shortlist / Save.
- Acceptance criteria:
  - Users can view a paginated or scrollable list of universities.
  - Users can filter by country, program, ranking range and other attributes.
  - Clicking a university opens a detail view with programs, tuition, ROI, ranking and website link.

### 3.5 Recommendations Engine (Product-level feature)
- Description: Generate personalized university recommendations based on profile signals (program, CGPA, test scores, budget, stage).
- Acceptance criteria:
  - Users can request recommendations tied to their current profile.
  - Recommendations include match score, reason, ROI estimate and key drivers.
  - User can view and act upon recommendations (e.g., view university details, shortlist).

### 3.6 Search & Advanced Filters
- Description: Flexible search with query and advanced filters (country, program, ROI, admission rate, tuition range).
- Acceptance criteria:
  - Search input returns relevant university results.
  - Filters can be combined and applied client-side or via API.

### 3.7 Financing & Loan Offers
- Description: View and compare loan offers, check eligibility, accept an offer.
- Acceptance criteria:
  - Users can enter a requested loan amount and run an eligibility check that returns a score and factors.
  - Users can view available loan offers associated with their profile and accept an offer.
  - Accepting an offer changes its status and is reflected in the user's dashboard.

### 3.8 Nudges & Growth OS
- Description: AI-generated nudges and reminders tailored to a user's stage and activity (milestones, reminders, offers, insights).
- Acceptance criteria:
  - Users see a list of nudges on the Growth OS tab and in dashboard activity.
  - Nudges can be marked as read. Read/unread state is persisted.

### 3.9 Copilot Assistant (AI Helper)
- Description: Conversational assistant that answers common questions, suggests next steps, and can generate recommendations or identify deadlines.
- Requirements:
  - Must respond reliably and avoid overlapping responses (single-request-at-a-time UX).
  - Provide contextual answers based on current user's profile when available.
  - Provide quick prompt suggestions to help users ask useful questions.
- Acceptance criteria:
  - User can send questions and receive timely responses.
  - Copilot exposes suggestions/prompt chips and retains short-term conversation context for the session.

### 3.10 Notifications & Actions
- Description: Notify users of important events (new offers, unread nudges) and allow actions (accept offer, mark nudge read).
- Acceptance criteria:
  - Notification counts are visible in the UI (e.g., unread nudges).
  - Action buttons perform expected behavior and update the UI state immediately.

### 3.11 Admin / Data Management (Demo tools)
- Description: Simple admin abilities to seed and update universities, loan offers, recommendations and nudges for demonstration purposes.
- Acceptance criteria:
  - An admin can load or refresh demo data and perform basic CRUD on demo entities.

## 4. Non-functional Requirements
- Performance: Page interactions (search, filter, tab switching) should respond within sub-300ms on a local dev machine for typical demo data volumes. Heavy operations should be asynchronous with a progress state.
- Availability: Prototype should be able to run locally with the documented steps; demo availability for short demos is acceptable.
- Scalability: For demo scale, support a few hundred universities and several thousand recommendation rows with acceptable performance.
- Security & Privacy:
  - Authentication must protect user profile access (private data not exposed to other users). 
  - Personal data in demo should be sample/test data or user-provided; avoid shipping real PII.
  - Provide a way to clear demo user data.

## 5. UX / Accessibility Requirements
- Visual consistency: Use existing design tokens (colors, spacing, button styles) across all modals and forms.
- Form UX: Inputs must have labels, clear placeholders, inline validation messages and logical tab order.
- Responsive: All primary views (dashboard, discover, profile) must be usable on tablet and desktop widths; modals should be scrollable on smaller screens.
- Accessibility: Keyboard navigable, meaningful ARIA labels for interactive regions, sufficient color contrast for text and interactive elements.

## 6. Data & Entities (what data is required)
- Users: profile fields described in 3.1. 
- Universities: name, country, ranking, programs, tuition, placement salary, ROI, admission rate, website, location.
- Loan Offers: lender, amount, interest rate, tenor, monthly EMI, eligibility score, status, user association.
- Recommendations: userId, universityId, matchScore, reason, ROI score.
- Nudges: userId, title, message, action text, read flag.

## 7. API / Integration Expectations (feature-level)
- Authentication endpoints to register/login and return a session token for subsequent requests.
- Endpoints for user profile read/update that operate on the authenticated user principal when possible (e.g., `/users/me`).
- CRUD endpoints for universities, loans, recommendations and nudges (demo/admin use).
- Recommendation generation endpoint that consumes a user profile and returns scored suggestions.

## 8. Testing & QA Checklist
- Unit tests for core business logic (recommendation scoring, eligibility calculation).
- Integration tests for auth, profile update and read flows.
- Manual E2E scenarios to verify flows:
  1. Register -> Login -> Edit profile -> Generate recommendations -> Verify dashboard reflects recommendations.
  2. Login as persona -> Check eligibility -> View loan offers -> Accept offer -> Verify offer status and dashboard.
  3. Use Copilot: Ask a question, get response, then ask a follow-up that uses profile context.
  4. Mark nudges read and verify unread counts update.

## 9. Release & Verification Checklist (for demo readiness)
Before presenting the prototype, verify:
- Core flows function end-to-end: auth, profile update, discovery, recommendations, eligibility, offers, nudges, copilot.
- UI is visually consistent across modals and core pages (login/register modal, profile form, dashboard cards).
- Demo data present and easy to reset or seed.
- Basic accessibility checks (keyboard navigation and contrast) pass.

## 10. Roadmap & Prioritization
- MVP (short term): Authentication & profile, Dashboard, Discover list + details, Recommendations, Eligibility check, Loan offers, Nudges, Copilot with stable UX. Admin demo data management.
- Next (medium): Profile editor improvements, persistent demo seeds, more filters and sort, more robust conversation context for Copilot, basic analytics.
- Future (optional): Multi-user data persistence, real AI integration, reporting, multi-language support.

## 11. Deliverables (what to include in the repo for a handoff)
- This feature spec file (`FEATURES.md`).
- Updated `VERIFICATION.md` with explicit E2E steps and expected responses.
- Sample demo data for users, universities, loans, recommendations and nudges.
- Demo scripts / checklist for running the app locally and walking through core flows.
- UI assets (icons, any screenshots used in documentation).