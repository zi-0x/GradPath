from pathlib import Path
from datetime import datetime

from fastapi import APIRouter, Depends, FastAPI, File, Header, HTTPException, Query, UploadFile
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
    AuthRequest,
    AuthResponse,
    AdmitPredictRequest,
    ChatRequest,
    DemoSeedResponse,
    EMIRequest,
    LoanEligibilityRequest,
    LoanOffer,
    Nudge,
    NudgeActionResponse,
    OfferActionResponse,
    PersonaTemplate,
    ProfileUpdateRequest,
    ROIRequest,
    SOPRequest,
    StudentProfile,
    University,
)
from .services_ai import generate_sop, mentor_reply
from .services_ocr import extract_text_from_document
from .store import (
    ADMIN_STATS,
    LOAN_OFFERS,
    NOTIFICATIONS,
    PERSONA_LIBRARY,
    STUDENT_PROGRESS,
    UNIVERSITY_CATALOG,
    accept_offer,
    build_admin_dashboard,
    build_dashboard,
    build_gamification,
    build_recommendations_for_user,
    build_user_snapshot,
    create_session,
    create_user,
    filter_universities,
    find_user_by_email,
    get_demo_user,
    get_user_by_token,
    mark_nudge_read,
    reset_demo_state,
    seed_persona,
    shortlist_university,
)
from . import db
from .models import Base as ModelsBase, User as DBUser, University as DBUniversity, LoanOffer as DBLoanOffer, Nudge as DBNudge

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


def current_user(session_token: str | None = Header(default=None, alias="X-Session-Token")) -> dict:
    user = get_user_by_token(session_token)
    if user is None:
        return get_demo_user()
    return user


def _profile_payload(user: dict) -> dict:
    snapshot = build_user_snapshot(user)
    snapshot.pop("password", None)
    return snapshot


@router.get("/health")
def health() -> dict:
    return {"status": "ok", "env": settings.app_env}


@router.get("/demo/personas", response_model=list[PersonaTemplate])
def demo_personas():
    return PERSONA_LIBRARY


@router.post("/auth/register", response_model=AuthResponse)
def register(payload: AuthRequest):
    if find_user_by_email(payload.email):
        raise HTTPException(status_code=409, detail="Email already registered")
    user = create_user(
        {
            "name": payload.name or payload.email.split("@")[0],
            "email": payload.email,
            "program": payload.program or "MS Computer Science",
        },
        payload.password,
    )
    token = create_session(user["id"])
    return {"token": token, "user": _profile_payload(user)}


@router.post("/auth/login", response_model=AuthResponse)
def login(payload: AuthRequest):
    user = find_user_by_email(payload.email)
    if user is None or user.get("password") != payload.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_session(user["id"])
    return {"token": token, "user": _profile_payload(user)}


@router.post("/demo/personas/{persona_id}/activate", response_model=AuthResponse)
def activate_persona(persona_id: str):
    persona = next((item for item in PERSONA_LIBRARY if item["id"] == persona_id), None)
    if persona is None:
        raise HTTPException(status_code=404, detail="Persona not found")
    user = seed_persona(persona_id)
    token = create_session(user["id"])
    return {"token": token, "user": _profile_payload(user)}


@router.get("/users/me")
def read_me(user: dict = Depends(current_user)):
    return _profile_payload(user)


@router.patch("/users/me")
def update_me(payload: ProfileUpdateRequest, user: dict = Depends(current_user)):
    updates = payload.model_dump(exclude_unset=True)
    user.update(updates)
    user["profile_completed"] = True
    user["updated_at"] = datetime.utcnow().isoformat()
    user.setdefault("recent_activity", []).insert(0, {"title": "Profile updated", "message": "Your profile was saved.", "time": datetime.utcnow().isoformat()})
    return _profile_payload(user)


@router.post("/users/me/onboarding")
def onboarding(payload: ProfileUpdateRequest, user: dict = Depends(current_user)):
    return update_me(payload, user)


@router.get("/universities", response_model=list[University])
def universities(
    query: str | None = None,
    country: str | None = None,
    program: str | None = None,
    min_ranking: int | None = None,
    max_ranking: int | None = None,
    sort: str = Query(default="ranking", pattern="^(ranking|roi|name)$"),
):
    return filter_universities(query=query, country=country, program=program, min_ranking=min_ranking, max_ranking=max_ranking, sort=sort)


@router.get("/universities/{university_id}")
def university_detail(university_id: str):
    university = next((item for item in UNIVERSITY_CATALOG if item["id"] == university_id), None)
    if university is None:
        raise HTTPException(status_code=404, detail="University not found")
    return university


@router.post("/universities/{university_id}/shortlist")
def shortlist_add(university_id: str, user: dict = Depends(current_user)):
    return shortlist_university(user, university_id, True)


@router.delete("/universities/{university_id}/shortlist")
def shortlist_remove(university_id: str, user: dict = Depends(current_user)):
    return shortlist_university(user, university_id, False)


@router.post("/recommendations/generate")
def generate_recommendations(user: dict = Depends(current_user)):
    return {"items": build_recommendations_for_user(user)}


@router.get("/recommendations/me")
def my_recommendations(user: dict = Depends(current_user)):
    if not user.get("recommendations"):
        build_recommendations_for_user(user)
    return {"items": user.get("recommendations", [])}


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
def loan_eligibility(req: dict | LoanEligibilityRequest):
    # Accept older/alternative payload shapes (tests use requested_amount_usd/annual_income_usd)
    if isinstance(req, dict):
        annual = req.get("annual_income_usd") or req.get("annual_family_income_usd")
        requested = req.get("requested_amount_usd") or req.get("total_required_usd")
        mapped = {
            "annual_family_income_usd": float(annual or 0),
            "collateral_available_usd": float(req.get("collateral_available_usd", 0)),
            "credit_score": int(req.get("credit_score", 650)),
            "target_country": req.get("target_country", req.get("target_country", "USA")),
            "total_required_usd": float(requested or 0),
        }
        model = LoanEligibilityRequest(**mapped)
        return evaluate_loan_eligibility(model)
    return evaluate_loan_eligibility(req)


@router.post("/loan/emi")
def emi(req: dict | EMIRequest):
    # Accept alternative payload keys used in tests: interest_rate_annual_pct, tenor_years
    if isinstance(req, dict):
        principal = req.get("principal_usd") or req.get("amount") or 0
        annual_interest = req.get("interest_rate_annual_pct") or req.get("annual_interest_pct") or req.get("interest_rate_pct") or 0
        tenure_years = req.get("tenor_years") or req.get("tenure_years")
        if tenure_years:
            tenure_months = int(tenure_years) * 12
        else:
            tenure_months = int(req.get("tenure_months", 0))
        mapped = {
            "principal_usd": float(principal),
            "annual_interest_pct": float(annual_interest),
            "tenure_months": int(tenure_months),
        }
        model = EMIRequest(**mapped)
        return plan_emi(model)
    return plan_emi(req)


@router.get("/loan/offers")
def loan_offers(user: dict = Depends(current_user)):
    return {"offers": user.get("loan_offers", LOAN_OFFERS)}


@router.post("/loan/offers/{offer_id}/accept", response_model=OfferActionResponse)
def accept_loan_offer(offer_id: str, user: dict = Depends(current_user)):
    try:
        return accept_offer(user, offer_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Loan offer not found")


@router.get("/nudges/me")
def nudges_me(user: dict = Depends(current_user)):
    return {"items": user.get("nudges", NOTIFICATIONS)}


@router.post("/nudges/{nudge_id}/read", response_model=NudgeActionResponse)
def read_nudge(nudge_id: str, user: dict = Depends(current_user)):
    try:
        return mark_nudge_read(user, nudge_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Nudge not found")


@router.post("/admin/reset-demo", response_model=DemoSeedResponse)
def admin_reset_demo():
    reset_demo_state()
    return {
        "status": "reset",
        "users": len(PERSONA_LIBRARY),
        "universities": len(UNIVERSITY_CATALOG),
        "nudges": sum(len(user.get("nudges", [])) for user in [get_demo_user()]),
        "offers": len(LOAN_OFFERS),
    }


@router.post("/admin/init-db")
def admin_init_db():
    """Create DB tables and seed demo personas and universities into the database."""
    ModelsBase.metadata.create_all(bind=db.engine)
    # simple idempotent seed: insert if missing
    from sqlalchemy.orm import Session

    session = Session(bind=db.engine)
    try:
        # seed personas
        existing_users = {u.email for u in session.query(DBUser).all()}
        for p in PERSONA_LIBRARY:
            if p["email"] in existing_users:
                continue
            user = DBUser(
                id=p.get("id") or p.get("email"),
                name=p.get("name"),
                email=p.get("email"),
                password=p.get("password", "demo"),
                program=p.get("program"),
                cgpa=p.get("cgpa"),
                ielts=p.get("ielts"),
                work_experience_years=p.get("work_experience_years"),
                budget_usd=p.get("budget_usd"),
                funding_need_usd=p.get("funding_need_usd"),
                stage=p.get("stage"),
                intake=p.get("intake"),
                preferred_countries=p.get("preferred_countries"),
                gre=p.get("gre"),
            )
            session.add(user)

        # seed universities
        existing_unis = {u.id for u in session.query(DBUniversity).all()}
        for u in UNIVERSITY_CATALOG:
            if u["id"] in existing_unis:
                continue
            uni = DBUniversity(
                id=u.get("id"),
                name=u.get("name"),
                country=u.get("country"),
                ranking=u.get("ranking"),
                programs=u.get("programs"),
                tuition_usd=u.get("tuition_usd"),
                placement_salary_usd=u.get("placement_salary_usd"),
                roi_pct=u.get("roi_pct"),
                admission_rate_pct=u.get("admission_rate_pct"),
                website=u.get("website"),
                location=u.get("location"),
                description=u.get("description"),
            )
            session.add(uni)

        session.commit()
    finally:
        session.close()

    return {"status": "db_initialized", "seeded_users": len(PERSONA_LIBRARY), "seeded_universities": len(UNIVERSITY_CATALOG)}


# Admin CRUD: Loan Offers
@router.get("/admin/loan-offers")
def admin_list_loan_offers(page: int = Query(default=1, ge=1), page_size: int = Query(default=20, ge=1, le=200)):
    try:
        from .db import SessionLocal
        session = SessionLocal()
        total = session.query(DBLoanOffer).count()
        items = session.query(DBLoanOffer).offset((page - 1) * page_size).limit(page_size).all()
        result = [
            {
                "id": o.id,
                "user_id": o.user_id,
                "lender": o.lender,
                "amount_usd": o.amount_usd,
                "interest_rate_pct": o.interest_rate_pct,
                "tenor_months": o.tenor_months,
                "monthly_emi_usd": o.monthly_emi_usd,
                "status": o.status,
            }
            for o in items
        ]
        session.close()
        return {"total": total, "page": page, "page_size": page_size, "items": result}
    except Exception:
        # fallback to in-memory
        total = len(LOAN_OFFER_TEMPLATES)
        start = (page - 1) * page_size
        items = LOAN_OFFER_TEMPLATES[start : start + page_size]
        return {"total": total, "page": page, "page_size": page_size, "items": items}

@router.post("/admin/loan-offers", response_model=LoanOffer)
def admin_create_loan_offer(payload: LoanOffer):
    obj = payload.model_dump()
    try:
        from .db import SessionLocal
        session = SessionLocal()
        dbo = DBLoanOffer(**obj)
        session.add(dbo)
        session.commit()
        session.close()
        return obj
    except Exception:
        LOAN_OFFER_TEMPLATES.append(obj)
        return obj

@router.patch("/admin/loan-offers/{offer_id}", response_model=LoanOffer)
def admin_update_loan_offer(offer_id: str, payload: LoanOffer):
    updates = payload.model_dump(exclude_unset=True)
    try:
        from .db import SessionLocal
        session = SessionLocal()
        dbo = session.query(DBLoanOffer).filter(DBLoanOffer.id == offer_id).first()
        if not dbo:
            raise HTTPException(status_code=404, detail="Loan offer not found")
        for k, v in updates.items():
            setattr(dbo, k, v)
        session.add(dbo)
        session.commit()
        session.close()
        return {**{"id": offer_id}, **updates}
    except HTTPException:
        raise
    except Exception:
        offer = next((o for o in LOAN_OFFER_TEMPLATES if o["id"] == offer_id), None)
        if not offer:
            raise HTTPException(status_code=404, detail="Loan offer not found")
        offer.update(updates)
        return offer

@router.delete("/admin/loan-offers/{offer_id}")
def admin_delete_loan_offer(offer_id: str):
    try:
        from .db import SessionLocal
        session = SessionLocal()
        deleted = session.query(DBLoanOffer).filter(DBLoanOffer.id == offer_id).delete()
        session.commit()
        session.close()
        if not deleted:
            raise HTTPException(status_code=404, detail="Loan offer not found")
        return {"deleted": True}
    except HTTPException:
        raise
    except Exception:
        before = len(LOAN_OFFER_TEMPLATES)
        LOAN_OFFER_TEMPLATES[:] = [o for o in LOAN_OFFER_TEMPLATES if o["id"] != offer_id]
        after = len(LOAN_OFFER_TEMPLATES)
        if before == after:
            raise HTTPException(status_code=404, detail="Loan offer not found")
        return {"deleted": True}


# Admin CRUD: Nudges
@router.get("/admin/nudges")
def admin_list_nudges(page: int = Query(default=1, ge=1), page_size: int = Query(default=20, ge=1, le=200)):
    try:
        from .db import SessionLocal
        session = SessionLocal()
        total = session.query(DBNudge).count()
        items = session.query(DBNudge).offset((page - 1) * page_size).limit(page_size).all()
        result = [
            {
                "id": n.id,
                "user_id": n.user_id,
                "title": n.title,
                "message": n.message,
                "action_text": n.action_text,
                "category": n.category,
                "read": n.read,
                "created_at": n.created_at.isoformat() if n.created_at else None,
            }
            for n in items
        ]
        session.close()
        return {"total": total, "page": page, "page_size": page_size, "items": result}
    except Exception:
        # fallback to in-memory
        total = len(NUDGE_TEMPLATES)
        start = (page - 1) * page_size
        items = NUDGE_TEMPLATES[start : start + page_size]
        return {"total": total, "page": page, "page_size": page_size, "items": items}

@router.post("/admin/nudges", response_model=Nudge)
def admin_create_nudge(payload: Nudge):
    obj = payload.model_dump()
    try:
        from .db import SessionLocal
        session = SessionLocal()
        dbn = DBNudge(**obj)
        session.add(dbn)
        session.commit()
        session.close()
        return obj
    except Exception:
        NUDGE_TEMPLATES.append(obj)
        return obj

@router.patch("/admin/nudges/{nudge_id}", response_model=Nudge)
def admin_update_nudge(nudge_id: str, payload: Nudge):
    updates = payload.model_dump(exclude_unset=True)
    try:
        from .db import SessionLocal
        session = SessionLocal()
        dbn = session.query(DBNudge).filter(DBNudge.id == nudge_id).first()
        if not dbn:
            raise HTTPException(status_code=404, detail="Nudge not found")
        for k, v in updates.items():
            setattr(dbn, k, v)
        session.add(dbn)
        session.commit()
        session.close()
        return {**{"id": nudge_id}, **updates}
    except HTTPException:
        raise
    except Exception:
        nudge = next((n for n in NUDGE_TEMPLATES if n["id"] == nudge_id), None)
        if not nudge:
            raise HTTPException(status_code=404, detail="Nudge not found")
        nudge.update(updates)
        return nudge

@router.delete("/admin/nudges/{nudge_id}")
def admin_delete_nudge(nudge_id: str):
    try:
        from .db import SessionLocal
        session = SessionLocal()
        deleted = session.query(DBNudge).filter(DBNudge.id == nudge_id).delete()
        session.commit()
        session.close()
        if not deleted:
            raise HTTPException(status_code=404, detail="Nudge not found")
        return {"deleted": True}
    except HTTPException:
        raise
    except Exception:
        before = len(NUDGE_TEMPLATES)
        NUDGE_TEMPLATES[:] = [n for n in NUDGE_TEMPLATES if n["id"] != nudge_id]
        after = len(NUDGE_TEMPLATES)
        if before == after:
            raise HTTPException(status_code=404, detail="Nudge not found")
        return {"deleted": True}

async def upload_document(file: UploadFile = File(...), user: dict = Depends(current_user)):
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

    user["documents_uploaded"] = int(user.get("documents_uploaded", 0)) + 1
    user["engagement_points"] = int(user.get("engagement_points", 0)) + 20
    user.setdefault("recent_activity", []).insert(0, {"title": "Document uploaded", "message": file.filename, "time": datetime.utcnow().isoformat()})

    return {
        "filename": file.filename,
        "size_mb": round(size_mb, 2),
        "ocr_text_preview": extracted[:500],
    }


@router.post("/mentor/chat")
async def mentor_chat(req: ChatRequest, user: dict = Depends(current_user)):
    context = dict(req.context or {})
    context.setdefault("stage", user.get("stage"))
    context.setdefault("program", user.get("program"))
    context.setdefault("budget_usd", user.get("budget_usd"))
    context.setdefault("preferred_countries", user.get("preferred_countries", []))
    reply = await mentor_reply(req.message, context)
    return {"reply": reply}


@router.get("/dashboard/student")
def student_dashboard(user: dict = Depends(current_user)):
    dashboard = build_dashboard(user)
    dashboard["notifications"] = user.get("nudges", NOTIFICATIONS)
    dashboard["loan_offers"] = user.get("loan_offers", LOAN_OFFERS)
    dashboard["recommendations"] = user.get("recommendations", []) or build_recommendations_for_user(user)
    dashboard["shortlist"] = user.get("shortlist", [])
    return dashboard


@router.get("/dashboard/admin")
def admin_dashboard():
    return build_admin_dashboard()


@router.get("/gamification")
def gamification(user: dict = Depends(current_user)):
    return build_gamification(user)


# Admin CRUD: Universities (DB-backed if available)
@router.get("/admin/universities")
def admin_list_universities(page: int = Query(default=1, ge=1), page_size: int = Query(default=20, ge=1, le=200)):
    try:
        from .db import SessionLocal
        session = SessionLocal()
        total = session.query(DBUniversity).count()
        items = session.query(DBUniversity).offset((page - 1) * page_size).limit(page_size).all()
        result = [
            {
                "id": u.id,
                "name": u.name,
                "country": u.country,
                "ranking": u.ranking,
                "programs": u.programs,
                "tuition_usd": u.tuition_usd,
                "placement_salary_usd": u.placement_salary_usd,
                "roi_pct": u.roi_pct,
                "admission_rate_pct": u.admission_rate_pct,
                "website": u.website,
                "location": u.location,
                "description": u.description,
            }
            for u in items
        ]
        session.close()
        return {"total": total, "page": page, "page_size": page_size, "items": result}
    except Exception:
        # fallback to in-memory list
        total = len(UNIVERSITY_CATALOG)
        start = (page - 1) * page_size
        items = UNIVERSITY_CATALOG[start : start + page_size]
        return {"total": total, "page": page, "page_size": page_size, "items": items}

@router.post("/admin/universities", response_model=University)
def admin_create_university(payload: University):
    obj = payload.model_dump()
    try:
        from .db import SessionLocal
        session = SessionLocal()
        dbu = DBUniversity(**obj)
        session.add(dbu)
        session.commit()
        session.close()
        return obj
    except Exception:
        # add to in-memory
        UNIVERSITY_CATALOG.append(obj)
        return obj

@router.patch("/admin/universities/{university_id}", response_model=University)
def admin_update_university(university_id: str, payload: University):
    updates = payload.model_dump(exclude_unset=True)
    try:
        from .db import SessionLocal
        session = SessionLocal()
        dbu = session.query(DBUniversity).filter(DBUniversity.id == university_id).first()
        if not dbu:
            raise HTTPException(status_code=404, detail="University not found")
        for k, v in updates.items():
            setattr(dbu, k, v)
        session.add(dbu)
        session.commit()
        obj = updates
        session.close()
        return {**{"id": university_id}, **obj}
    except HTTPException:
        raise
    except Exception:
        # fallback to in-memory
        uni = next((u for u in UNIVERSITY_CATALOG if u["id"] == university_id), None)
        if not uni:
            raise HTTPException(status_code=404, detail="University not found")
        uni.update(updates)
        return uni

@router.delete("/admin/universities/{university_id}")
def admin_delete_university(university_id: str):
    try:
        from .db import SessionLocal
        session = SessionLocal()
        deleted = session.query(DBUniversity).filter(DBUniversity.id == university_id).delete()
        session.commit()
        session.close()
        if not deleted:
            raise HTTPException(status_code=404, detail="University not found")
        return {"deleted": True}
    except HTTPException:
        raise
    except Exception:
        # fallback to in-memory
        before = len(UNIVERSITY_CATALOG)
        UNIVERSITY_CATALOG[:] = [u for u in UNIVERSITY_CATALOG if u["id"] != university_id]
        after = len(UNIVERSITY_CATALOG)
        if before == after:
            raise HTTPException(status_code=404, detail="University not found")
        return {"deleted": True}

app.include_router(router)
