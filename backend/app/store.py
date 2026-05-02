from datetime import datetime
from copy import deepcopy
from secrets import token_urlsafe
from uuid import uuid4

from .engine import recommend_universities
from .schemas import StudentProfile
from .db import SessionLocal
from .models import User as DBUser, SessionToken as DBSession, University as DBUniversity, LoanOffer as DBLoanOffer, Nudge as DBNudge

STUDENT_PROGRESS = {
    "profile_completed": False,
    "documents_uploaded": 0,
    "points": 120,
    "level": "Explorer",
    "streak_days": 3,
}

NOTIFICATIONS = [
    {"id": 1, "title": "Scholarship alert", "message": "3 new scholarships matched your profile."},
    {"id": 2, "title": "Deadline reminder", "message": "SOP draft due in 2 days."},
]

LOAN_OFFERS = [
    {"bank": "GlobalEdu Finance", "interest_pct": 9.1, "max_amount_usd": 62000, "processing_fee_pct": 0.8},
    {"bank": "Nova Student Loans", "interest_pct": 8.7, "max_amount_usd": 58000, "processing_fee_pct": 0.5},
    {"bank": "FuturePath Bank", "interest_pct": 9.4, "max_amount_usd": 70000, "processing_fee_pct": 1.1},
]

ADMIN_STATS = {
    "active_students": 3124,
    "applications_started": 891,
    "applications_submitted": 506,
    "total_loan_volume_usd": 16800000,
    "updated_at": datetime.utcnow().isoformat(),
}

PERSONA_LIBRARY = [
    {
        "id": "anushka",
        "name": "Anushka Sharma",
        "email": "anushka@gradpath.demo",
        "password": "demo1234",
        "program": "MS Computer Science",
        "cgpa": 8.6,
        "ielts": 7.5,
        "work_experience_years": 2,
        "budget_usd": 45000,
        "funding_need_usd": 28000,
        "stage": "shortlisting",
        "intake": "Fall 2027",
        "preferred_countries": ["Canada", "Germany"],
        "gre": 321,
    },
    {
        "id": "arnav",
        "name": "Arnav",
        "email": "arnav@gradpath.demo",
        "password": "demo1234",
        "program": "Master of Data Science",
        "cgpa": 8.9,
        "ielts": 8.0,
        "work_experience_years": 3,
        "budget_usd": 52000,
        "funding_need_usd": 25000,
        "stage": "applying",
        "intake": "Spring 2027",
        "preferred_countries": ["Australia", "Canada"],
        "gre": 325,
    },
    {
        "id": "riya",
        "name": "Riya Patel",
        "email": "riya@gradpath.demo",
        "password": "demo1234",
        "program": "MBA",
        "cgpa": 7.9,
        "ielts": 7.0,
        "work_experience_years": 5,
        "budget_usd": 60000,
        "funding_need_usd": 35000,
        "stage": "researching",
        "intake": "Fall 2028",
        "preferred_countries": ["USA", "Ireland"],
        "gre": 312,
    },
]

UNIVERSITY_CATALOG = [
    {
        "id": "toronto",
        "name": "University of Toronto",
        "country": "Canada",
        "ranking": 21,
        "programs": ["MS Computer Science", "Master of Data Science"],
        "tuition_usd": 42000,
        "placement_salary_usd": 102000,
        "roi_pct": 141.0,
        "admission_rate_pct": 18.0,
        "website": "https://www.utoronto.ca",
        "location": "Toronto, Ontario",
        "description": "Research-heavy program with strong AI and systems exposure.",
    },
    {
        "id": "tum",
        "name": "TU Munich",
        "country": "Germany",
        "ranking": 28,
        "programs": ["MSc Data Engineering", "MS Computer Science"],
        "tuition_usd": 18000,
        "placement_salary_usd": 91000,
        "roi_pct": 305.0,
        "admission_rate_pct": 24.0,
        "website": "https://www.tum.de",
        "location": "Munich, Bavaria",
        "description": "Strong engineering brand with a lower-cost route to Europe.",
    },
    {
        "id": "melbourne",
        "name": "University of Melbourne",
        "country": "Australia",
        "ranking": 39,
        "programs": ["Master of IT", "Master of Data Science"],
        "tuition_usd": 38000,
        "placement_salary_usd": 89000,
        "roi_pct": 134.0,
        "admission_rate_pct": 27.0,
        "website": "https://www.unimelb.edu.au",
        "location": "Melbourne, Victoria",
        "description": "Balanced choice for career growth and international exposure.",
    },
    {
        "id": "asu",
        "name": "Arizona State University",
        "country": "USA",
        "ranking": 121,
        "programs": ["MS Software Engineering", "MBA"],
        "tuition_usd": 34000,
        "placement_salary_usd": 96000,
        "roi_pct": 182.0,
        "admission_rate_pct": 64.0,
        "website": "https://www.asu.edu",
        "location": "Tempe, Arizona",
        "description": "Accessible public university with broad program options.",
    },
    {
        "id": "dublin",
        "name": "University College Dublin",
        "country": "Ireland",
        "ranking": 98,
        "programs": ["MSc AI", "MBA"],
        "tuition_usd": 30000,
        "placement_salary_usd": 86000,
        "roi_pct": 186.0,
        "admission_rate_pct": 36.0,
        "website": "https://www.ucd.ie",
        "location": "Dublin, Ireland",
        "description": "Good fit for candidates targeting Europe and AI roles.",
    },
    {
        "id": "nus",
        "name": "National University of Singapore",
        "country": "Singapore",
        "ranking": 8,
        "programs": ["Master of Data Science", "MS Computer Science"],
        "tuition_usd": 39000,
        "placement_salary_usd": 118000,
        "roi_pct": 202.0,
        "admission_rate_pct": 12.0,
        "website": "https://www.nus.edu.sg",
        "location": "Singapore",
        "description": "Highly selective option with strong employer pull in Asia.",
    },
]

LOAN_OFFER_TEMPLATES = [
    {"id": "globaledu", "lender": "GlobalEdu Finance", "amount_usd": 62000, "interest_rate_pct": 9.1, "tenor_months": 120, "eligibility_score": 84},
    {"id": "nova", "lender": "Nova Student Loans", "amount_usd": 58000, "interest_rate_pct": 8.7, "tenor_months": 108, "eligibility_score": 88},
    {"id": "futurepath", "lender": "FuturePath Bank", "amount_usd": 70000, "interest_rate_pct": 9.4, "tenor_months": 120, "eligibility_score": 79},
]

NUDGE_TEMPLATES = [
    {"title": "Scholarship alert", "message": "3 scholarships matched your shortlisting stage this week.", "action_text": "Review scholarships", "category": "opportunity"},
    {"title": "Deadline reminder", "message": "Your SOP draft is due in 2 days for the first priority university.", "action_text": "Open SOP checklist", "category": "deadline"},
    {"title": "Funding nudge", "message": "You can reduce risk by comparing one more loan offer.", "action_text": "Compare loans", "category": "finance"},
]

USERS: dict[str, dict] = {}
SESSIONS: dict[str, str] = {}


def _build_student_profile(user: dict) -> StudentProfile:
    return StudentProfile(
        name=user["name"],
        degree_target=user["program"],
        preferred_countries=user.get("preferred_countries") or ["Canada"],
        gpa=float(user.get("cgpa", 8.0)),
        gre=int(user.get("gre", 315)),
        ielts=float(user.get("ielts", 7.5)),
        work_ex_years=float(user.get("work_experience_years", 0)),
        budget_usd=int(user.get("budget_usd", 40000)),
        risk_appetite=str(user.get("risk_appetite", "balanced")),
    )


def _clone_offers(user_id: str) -> list[dict]:
    offers = []
    for template in LOAN_OFFER_TEMPLATES:
        monthly_rate = template["interest_rate_pct"] / (12 * 100)
        principal = template["amount_usd"]
        tenor_months = template["tenor_months"]
        if monthly_rate == 0:
            emi = principal / tenor_months
        else:
            emi = principal * monthly_rate * ((1 + monthly_rate) ** tenor_months) / (((1 + monthly_rate) ** tenor_months) - 1)
        offers.append({**template, "monthly_emi_usd": round(emi, 2), "status": "available", "user_id": user_id})
    return offers


def _clone_nudges(user_id: str) -> list[dict]:
    nudges = []
    for index, template in enumerate(NUDGE_TEMPLATES, start=1):
        nudges.append({"id": f"{user_id}-nudge-{index}", "user_id": user_id, "read": False, "created_at": datetime.utcnow().isoformat(), **template})
    return nudges


def _next_user_id() -> str:
    return str(uuid4())


def create_user(payload: dict, password: str) -> dict:
    user_id = payload.get("id") or _next_user_id()
    user = {
        "id": user_id,
        "name": payload["name"],
        "email": payload["email"].lower(),
        "password": password,
        "program": payload.get("program") or "MS Computer Science",
        "cgpa": payload.get("cgpa", 8.0),
        "ielts": payload.get("ielts", 7.5),
        "work_experience_years": payload.get("work_experience_years", 0.0),
        "budget_usd": payload.get("budget_usd", 45000),
        "funding_need_usd": payload.get("funding_need_usd", 25000),
        "stage": payload.get("stage", "onboarding"),
        "intake": payload.get("intake", "Fall 2027"),
        "preferred_countries": payload.get("preferred_countries", ["Canada"]),
        "gre": payload.get("gre", 315),
        "risk_appetite": payload.get("risk_appetite", "balanced"),
        "shortlist": [],
        "accepted_offer_id": None,
        "recommendations": [],
        "loan_offers": _clone_offers(user_id),
        "nudges": _clone_nudges(user_id),
        "engagement_points": payload.get("engagement_points", 120),
        "streak_days": payload.get("streak_days", 3),
        "profile_completed": True,
        "recent_activity": [{"title": "Profile created", "message": "Welcome to GradPath.", "time": datetime.utcnow().isoformat()}],
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }

    # write to in-memory store
    USERS[user_id] = user

    # attempt to persist to DB (best-effort; keeps demo backwards-compatible)
    try:
        db = SessionLocal()
        db_user = DBUser(
            id=user_id,
            name=user["name"],
            email=user["email"],
            password=user["password"],
            program=user.get("program"),
            cgpa=user.get("cgpa"),
            ielts=user.get("ielts"),
            work_experience_years=user.get("work_experience_years"),
            budget_usd=user.get("budget_usd"),
            funding_need_usd=user.get("funding_need_usd"),
            stage=user.get("stage"),
            intake=user.get("intake"),
            preferred_countries=user.get("preferred_countries"),
            gre=user.get("gre"),
            risk_appetite=user.get("risk_appetite"),
            shortlist=user.get("shortlist"),
            accepted_offer_id=user.get("accepted_offer_id"),
            recommendations=user.get("recommendations"),
            loan_offers=user.get("loan_offers"),
            nudges=user.get("nudges"),
            engagement_points=user.get("engagement_points"),
            streak_days=user.get("streak_days"),
            profile_completed=user.get("profile_completed"),
            recent_activity=user.get("recent_activity"),
        )
        db.add(db_user)
        db.commit()
    except Exception:
        pass
    finally:
        try:
            db.close()
        except Exception:
            pass

    return user


def find_user_by_email(email: str) -> dict | None:
    target = email.lower()
    # try DB first
    try:
        db = SessionLocal()
        db_user = db.query(DBUser).filter(DBUser.email == target).first()
        if db_user:
            return {
                "id": db_user.id,
                "name": db_user.name,
                "email": db_user.email,
                "password": db_user.password,
                "program": db_user.program,
                "cgpa": db_user.cgpa,
                "ielts": db_user.ielts,
                "work_experience_years": db_user.work_experience_years,
                "budget_usd": db_user.budget_usd,
                "funding_need_usd": db_user.funding_need_usd,
                "stage": db_user.stage,
                "intake": db_user.intake,
                "preferred_countries": db_user.preferred_countries,
                "gre": db_user.gre,
                "risk_appetite": db_user.risk_appetite,
                "shortlist": db_user.shortlist or [],
                "accepted_offer_id": db_user.accepted_offer_id,
                "recommendations": db_user.recommendations or [],
                "loan_offers": db_user.loan_offers or [],
                "nudges": db_user.nudges or [],
                "engagement_points": db_user.engagement_points or 0,
                "streak_days": db_user.streak_days or 0,
                "profile_completed": db_user.profile_completed,
                "recent_activity": db_user.recent_activity or [],
                "created_at": getattr(db_user, "created_at", None),
                "updated_at": getattr(db_user, "updated_at", None),
            }
    except Exception:
        pass
    finally:
        try:
            db.close()
        except Exception:
            pass

    # fallback to in-memory
    for user in USERS.values():
        if user["email"] == target:
            return user
    return None


def create_session(user_id: str) -> str:
    token = token_urlsafe(24)
    SESSIONS[token] = user_id

    # persist session token to DB
    try:
        db = SessionLocal()
        db_session = DBSession(token=token, user_id=user_id)
        db.add(db_session)
        db.commit()
    except Exception:
        pass
    finally:
        try:
            db.close()
        except Exception:
            pass

    return token


def get_user_by_token(token: str | None) -> dict | None:
    if not token:
        return None
    # try DB-backed session first
    try:
        db = SessionLocal()
        sess = db.query(DBSession).filter(DBSession.token == token).first()
        if sess:
            db_user = db.query(DBUser).filter(DBUser.id == sess.user_id).first()
            if db_user:
                return {
                    "id": db_user.id,
                    "name": db_user.name,
                    "email": db_user.email,
                    "password": db_user.password,
                    "program": db_user.program,
                    "cgpa": db_user.cgpa,
                    "ielts": db_user.ielts,
                    "work_experience_years": db_user.work_experience_years,
                    "budget_usd": db_user.budget_usd,
                    "funding_need_usd": db_user.funding_need_usd,
                    "stage": db_user.stage,
                    "intake": db_user.intake,
                    "preferred_countries": db_user.preferred_countries,
                    "gre": db_user.gre,
                    "risk_appetite": db_user.risk_appetite,
                    "shortlist": db_user.shortlist or [],
                    "accepted_offer_id": db_user.accepted_offer_id,
                    "recommendations": db_user.recommendations or [],
                    "loan_offers": db_user.loan_offers or [],
                    "nudges": db_user.nudges or [],
                    "engagement_points": db_user.engagement_points or 0,
                    "streak_days": db_user.streak_days or 0,
                    "profile_completed": db_user.profile_completed,
                    "recent_activity": db_user.recent_activity or [],
                    "created_at": getattr(db_user, "created_at", None),
                    "updated_at": getattr(db_user, "updated_at", None),
                }
    except Exception:
        pass
    finally:
        try:
            db.close()
        except Exception:
            pass

    # fallback to in-memory
    user_id = SESSIONS.get(token)
    if not user_id:
        return None
    return USERS.get(user_id)


def get_demo_user() -> dict:
    return next(iter(USERS.values()))


def seed_persona(persona_id: str) -> dict:
    persona = next((item for item in PERSONA_LIBRARY if item["id"] == persona_id), None)
    if persona is None:
        raise KeyError(persona_id)
    existing = find_user_by_email(persona["email"])
    if existing is not None:
        return existing
    return create_user(persona, persona["password"])


def reset_demo_state() -> None:
    USERS.clear()
    SESSIONS.clear()
    # clear DB demo rows if DB is present
    try:
        db = SessionLocal()
        db.query(DBSession).delete()
        db.query(DBNudge).delete()
        db.query(DBLoanOffer).delete()
        db.query(DBUser).delete()
        db.query(DBUniversity).delete()
        db.commit()
    except Exception:
        pass
    finally:
        try:
            db.close()
        except Exception:
            pass

    for persona in PERSONA_LIBRARY:
        seed_persona(persona["id"])


def build_recommendations_for_user(user: dict) -> list[dict]:
    recommendations = []
    profile = _build_student_profile(user)
    catalog = {item["name"]: item for item in UNIVERSITY_CATALOG}
    for rank, item in enumerate(recommend_universities(profile), start=1):
        university = catalog.get(item.university)
        if university is None:
            continue
        tuition_gap = max(0, university["tuition_usd"] - int(user.get("budget_usd", 0)))
        recommendations.append({
            "id": f"{user['id']}-{university['id']}",
            "university_id": university["id"],
            "university": item.university,
            "country": item.country,
            "program": item.program,
            "fit_score": item.fit_score,
            "estimated_tuition_usd": item.estimated_tuition_usd,
            "estimated_living_usd": item.estimated_living_usd,
            "admit_chance_pct": item.admit_chance_pct,
            "roi_estimate_pct": round((university["placement_salary_usd"] / max(university["tuition_usd"], 1)) * 100, 2),
            "reason": f"Strong match for {user['program']} applicants in {item.country}.",
            "key_drivers": [f"Ranking #{university['ranking']}", f"{item.fit_score}% fit", f"{item.admit_chance_pct}% admit", f"Budget gap ${tuition_gap}"],
            "rank": rank,
        })
    user["recommendations"] = recommendations
    user["updated_at"] = datetime.utcnow().isoformat()
    user["recent_activity"].insert(0, {"title": "Recommendations refreshed", "message": f"Generated {len(recommendations)} universities for your profile.", "time": datetime.utcnow().isoformat()})
    return recommendations


def shortlist_university(user: dict, university_id: str, value: bool) -> dict:
    shortlist = set(user.get("shortlist", []))
    if value:
        shortlist.add(university_id)
        message = "University added to shortlist."
    else:
        shortlist.discard(university_id)
        message = "University removed from shortlist."
    user["shortlist"] = sorted(shortlist)
    user["recent_activity"].insert(0, {"title": "Shortlist updated", "message": message, "time": datetime.utcnow().isoformat()})
    user["updated_at"] = datetime.utcnow().isoformat()
    return {"updated": True, "shortlist": user["shortlist"]}


def accept_offer(user: dict, offer_id: str) -> dict:
    offer = next((item for item in user.get("loan_offers", []) if item["id"] == offer_id), None)
    if offer is None:
        raise KeyError(offer_id)
    for item in user.get("loan_offers", []):
        item["status"] = "accepted" if item["id"] == offer_id else item["status"]
    user["accepted_offer_id"] = offer_id
    user["engagement_points"] = int(user.get("engagement_points", 0)) + 35
    user["recent_activity"].insert(0, {"title": "Loan offer accepted", "message": f"{offer['lender']} offer marked as accepted.", "time": datetime.utcnow().isoformat()})
    user["updated_at"] = datetime.utcnow().isoformat()
    return {"updated": True, "offer": offer}


def mark_nudge_read(user: dict, nudge_id: str) -> dict:
    nudge = next((item for item in user.get("nudges", []) if item["id"] == nudge_id), None)
    if nudge is None:
        raise KeyError(nudge_id)
    nudge["read"] = True
    user["recent_activity"].insert(0, {"title": "Nudge read", "message": nudge["title"], "time": datetime.utcnow().isoformat()})
    user["updated_at"] = datetime.utcnow().isoformat()
    return {"updated": True}


def filter_universities(
    query: str | None = None,
    country: str | None = None,
    program: str | None = None,
    min_ranking: int | None = None,
    max_ranking: int | None = None,
    sort: str = "ranking",
) -> list[dict]:
    items = deepcopy(UNIVERSITY_CATALOG)
    if query:
        needle = query.lower()
        items = [item for item in items if needle in item["name"].lower() or needle in item["description"].lower()]
    if country:
        items = [item for item in items if item["country"].lower() == country.lower()]
    if program:
        items = [item for item in items if any(program.lower() in value.lower() for value in item["programs"])]
    if min_ranking is not None:
        items = [item for item in items if item["ranking"] >= min_ranking]
    if max_ranking is not None:
        items = [item for item in items if item["ranking"] <= max_ranking]
    if sort == "roi":
        items.sort(key=lambda item: item["roi_pct"], reverse=True)
    elif sort == "ranking":
        items.sort(key=lambda item: item["ranking"])
    else:
        items.sort(key=lambda item: item["name"])
    return items


def build_dashboard(user: dict) -> dict:
    if not user.get("recommendations"):
        build_recommendations_for_user(user)
    unread_nudges = [item for item in user.get("nudges", []) if not item.get("read")]
    accepted_offer = next((item for item in user.get("loan_offers", []) if item.get("status") == "accepted"), None)
    return {
        "profile": {key: user.get(key) for key in ["id", "name", "email", "program", "cgpa", "ielts", "work_experience_years", "budget_usd", "funding_need_usd", "stage", "intake", "preferred_countries", "profile_completed"]},
        "stats": {
            "engagement_points": user.get("engagement_points", 0),
            "streak_days": user.get("streak_days", 0),
            "recommendation_count": len(user.get("recommendations", [])),
            "loan_offers_count": len(user.get("loan_offers", [])),
            "unread_nudges": len(unread_nudges),
            "shortlisted_universities": len(user.get("shortlist", [])),
            "accepted_offer": accepted_offer["lender"] if accepted_offer else "None",
        },
        "recent_activity": user.get("recent_activity", [])[:5],
        "quick_actions": ["Update profile", "Generate recommendations", "Review loan offers", "Open Growth OS"],
    }


def build_admin_dashboard() -> dict:
    accepted_offers = [offer for user in USERS.values() for offer in user.get("loan_offers", []) if offer.get("status") == "accepted"]
    return {
        "stats": {
            "active_students": len(USERS),
            "universities": len(UNIVERSITY_CATALOG),
            "unread_nudges": sum(1 for user in USERS.values() for item in user.get("nudges", []) if not item.get("read")),
            "accepted_offers": len(accepted_offers),
            "recommendations_generated": sum(len(user.get("recommendations", [])) for user in USERS.values()),
            "updated_at": datetime.utcnow().isoformat(),
        },
        "funnels": {
            "profile_completed": sum(1 for user in USERS.values() if user.get("profile_completed")),
            "applications_started": sum(len(user.get("shortlist", [])) for user in USERS.values()),
            "applications_submitted": len(accepted_offers),
            "total_loan_volume_usd": sum(offer.get("amount_usd", 0) for offer in accepted_offers),
        },
    }


def build_gamification(user: dict) -> dict:
    points = int(user.get("engagement_points", 0))
    return {
        "badges": ["Profile Pro", "Loan Navigator", "SOP Architect"],
        "leaderboard_rank": max(1, 100 - points // 5),
        "next_reward_at": points + 50,
        "level": "Explorer" if points < 180 else "Strategist",
        "streak_days": user.get("streak_days", 0),
    }


def build_user_snapshot(user: dict) -> dict:
    snapshot = deepcopy(user)
    snapshot.pop("password", None)
    return snapshot


def seed_default_state() -> None:
    if USERS:
        return
    for persona in PERSONA_LIBRARY:
        create_user(persona, persona["password"])


seed_default_state()

DEFAULT_DEMO_USER = get_demo_user()
STUDENT_PROGRESS = {
    "profile_completed": DEFAULT_DEMO_USER.get("profile_completed", False),
    "documents_uploaded": 0,
    "points": DEFAULT_DEMO_USER.get("engagement_points", 0),
    "level": build_gamification(DEFAULT_DEMO_USER)["level"],
    "streak_days": DEFAULT_DEMO_USER.get("streak_days", 0),
}

NOTIFICATIONS = DEFAULT_DEMO_USER.get("nudges", [])
LOAN_OFFERS = DEFAULT_DEMO_USER.get("loan_offers", [])
ADMIN_STATS = build_admin_dashboard()["stats"]
