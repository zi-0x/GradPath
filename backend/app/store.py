from datetime import datetime

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
