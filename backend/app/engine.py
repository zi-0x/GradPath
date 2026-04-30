import math
from .schemas import (
    AdmitPredictRequest,
    AdmitPredictResponse,
    EMIRequest,
    EMIResponse,
    LoanEligibilityRequest,
    LoanEligibilityResponse,
    ROIRequest,
    ROIResponse,
    StudentProfile,
    UniversityRecommendation,
)


def recommend_universities(profile: StudentProfile) -> list[UniversityRecommendation]:
    sample = [
        ("University of Toronto", "Canada", "MS Computer Science", 88),
        ("TU Munich", "Germany", "MSc Data Engineering", 84),
        ("University of Melbourne", "Australia", "Master of IT", 80),
        ("Arizona State University", "USA", "MS Software Engineering", 78),
        ("University College Dublin", "Ireland", "MSc AI", 76),
    ]
    results: list[UniversityRecommendation] = []
    for uni, country, program, base_score in sample:
        score = base_score + (profile.gpa - 7.5) * 3 + (profile.gre - 310) * 0.2
        score += 3 if country in profile.preferred_countries else -2
        score = max(50, min(98, score))
        tuition = 18000 + int((100 - score) * 120)
        living = 9000 + int((100 - score) * 90)
        admit = max(15, min(92, score - 8))
        results.append(
            UniversityRecommendation(
                university=uni,
                country=country,
                program=program,
                fit_score=round(score, 2),
                estimated_tuition_usd=tuition,
                estimated_living_usd=living,
                admit_chance_pct=round(admit, 2),
            )
        )
    return sorted(results, key=lambda x: x.fit_score, reverse=True)


def calculate_roi(req: ROIRequest) -> ROIResponse:
    total_cost = req.tuition_usd + req.living_usd
    earnings = 0.0
    salary = req.expected_salary_usd
    for _ in range(req.horizon_years):
        earnings += salary
        salary *= 1 + req.salary_growth_pct / 100
    roi_pct = ((earnings - total_cost) / total_cost) * 100 if total_cost else 0
    payback = total_cost / req.expected_salary_usd if req.expected_salary_usd else float("inf")
    return ROIResponse(
        total_cost_usd=round(total_cost, 2),
        projected_earnings_usd=round(earnings, 2),
        roi_pct=round(roi_pct, 2),
        payback_years=round(payback, 2),
    )


def predict_admit(req: AdmitPredictRequest) -> AdmitPredictResponse:
    score = (
        (req.gpa / 10) * 35
        + ((req.gre - 260) / 80) * 30
        + (req.ielts / 9) * 20
        + min(req.work_ex_years, 5) * 2
        + req.sop_quality_score
    )
    probability = max(5, min(95, score))
    band = "high" if probability >= 75 else "medium" if probability >= 45 else "low"
    return AdmitPredictResponse(admit_probability_pct=round(probability, 2), confidence_band=band)


def evaluate_loan_eligibility(req: LoanEligibilityRequest) -> LoanEligibilityResponse:
    affordability = req.annual_family_income_usd * 4 + req.collateral_available_usd * 0.9
    credit_factor = (req.credit_score - 300) / 600
    max_loan = affordability * (0.6 + 0.4 * credit_factor)
    interest = 8.4 + (1 - credit_factor) * 3.2
    eligible = max_loan >= req.total_required_usd * 0.55
    reason = "Strong profile" if eligible else "Increase co-applicant income or collateral"
    return LoanEligibilityResponse(
        eligible=eligible,
        max_loan_amount_usd=round(max_loan, 2),
        likely_interest_pct=round(interest, 2),
        reason=reason,
    )


def plan_emi(req: EMIRequest) -> EMIResponse:
    r = req.annual_interest_pct / (12 * 100)
    n = req.tenure_months
    if r == 0:
        emi = req.principal_usd / n
    else:
        emi = req.principal_usd * r * math.pow(1 + r, n) / (math.pow(1 + r, n) - 1)
    total = emi * n
    interest = total - req.principal_usd
    return EMIResponse(
        monthly_emi_usd=round(emi, 2),
        total_payment_usd=round(total, 2),
        total_interest_usd=round(interest, 2),
    )
