# GradPath

GradPath is a full-stack AI-powered platform for students planning postgraduate education abroad.

## Stack
- Frontend: React + TypeScript + Vite
- Backend: FastAPI + Pydantic + modular AI services
- AI: Gemini API integration for mentorship and SOP generation
- OCR: pluggable OCR adapter (Tesseract / cloud OCR ready)
- Deployment: Dockerized services

## Core Capabilities
- AI university recommendation engine
- ROI calculator
- Admit predictor
- SOP generator
- Education loan eligibility engine
- EMI planner
- Personalized loan offers
- Document upload with OCR
- Student dashboard
- Admin dashboard
- Gamification and milestones
- AI mentor chatbot

## Quick Start

### 1) Backend
1. Copy `backend/.env.example` to `backend/.env`
2. Add Gemini key and optional OCR provider keys
3. Run:
   - `cd backend`
   - `pip install -r requirements.txt`
   - `uvicorn app.main:app --reload --port 8000`

### 2) Frontend
1. Run:
   - `cd frontend`
   - `npm install`
   - `npm run dev`

### 3) Docker
- `docker compose up --build`

## Production Notes
- Replace in-memory stores with PostgreSQL + Redis
- Add JWT refresh + secure cookie strategy
- Add S3-compatible object storage for documents
- Enable vector DB for long-term mentorship memory
- Add observability (OpenTelemetry + Prometheus + Grafana)
- Add background workers (Celery/RQ) for OCR and report generation
