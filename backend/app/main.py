from pathlib import Path
from fastapi import APIRouter, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .engine import (
    calculate_roi,
    evaluate_loan_eligibility,
    plan_emi,
    predict_admit,
    recommend_universities,
)
from .schemas import (
    AdmitPredictRequest,
    ChatRequest,
    EMIRequest,
    LoanEligibilityRequest,
    ROIRequest,
    SOPRequest,
    StudentProfile,
)
from .services_ai import generate_sop, mentor_reply
from .services_ocr import extract_text_from_document
from .store import ADMIN_STATS, LOAN_OFFERS, NOTIFICATIONS, STUDENT_PROGRESS

settings = get_settings()
Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)

app = FastAPI(title=settings.app_name, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

router = APIRouter(prefix=settings.api_prefix)


@router.get("/health")
def health() -> dict:
    return {"status": "ok", "env": settings.app_env}


@router.post("/recommendations")
def recommendations(profile: StudentProfile):
    return {"items": recommend_universities(profile)}


@router.post("/roi")
def roi(req: ROIRequest):
    return calculate_roi(req)


@router.post("/admit-predictor")
def admit(req: AdmitPredictRequest):
    return predict_admit(req)


@router.post("/sop/generate")
async def sop(req: SOPRequest):
    text = await generate_sop(
        req.name,
        req.program,
        req.university_type,
        req.achievements,
        req.motivation,
        req.long_term_goal,
    )
    return {"sop": text}


@router.post("/loan/eligibility")
def loan_eligibility(req: LoanEligibilityRequest):
    return evaluate_loan_eligibility(req)


@router.post("/loan/emi")
def emi(req: EMIRequest):
    return plan_emi(req)


@router.get("/loan/offers")
def loan_offers():
    return {"offers": LOAN_OFFERS}


@router.post("/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Invalid file")
    body = await file.read()
    size_mb = len(body) / (1024 * 1024)
    if size_mb > settings.max_upload_mb:
        raise HTTPException(status_code=413, detail=f"File too large. Max {settings.max_upload_mb} MB")

    save_path = Path(settings.upload_dir) / file.filename
    save_path.write_bytes(body)

    file.file.seek(0)
    extracted = await extract_text_from_document(file)

    STUDENT_PROGRESS["documents_uploaded"] += 1
    STUDENT_PROGRESS["points"] += 20

    return {
        "filename": file.filename,
        "size_mb": round(size_mb, 2),
        "ocr_text_preview": extracted[:500],
    }


@router.post("/mentor/chat")
async def mentor_chat(req: ChatRequest):
    reply = await mentor_reply(req.message, req.context)
    return {"reply": reply}


@router.get("/dashboard/student")
def student_dashboard():
    return {
        "progress": STUDENT_PROGRESS,
        "notifications": NOTIFICATIONS,
        "quick_actions": [
            "Complete profile",
            "Generate SOP",
            "Upload financial documents",
            "Compare loan offers",
        ],
    }


@router.get("/dashboard/admin")
def admin_dashboard():
    return {
        "stats": ADMIN_STATS,
        "funnels": {
            "recommendations_generated": 2420,
            "sop_generated": 1332,
            "loans_applied": 420,
            "visas_in_progress": 118,
        },
    }


@router.get("/gamification")
def gamification():
    return {
        "badges": ["Profile Pro", "Loan Ninja", "SOP Architect"],
        "leaderboard_rank": 57,
        "next_reward_at": 250,
    }


app.include_router(router)
