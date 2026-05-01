from typing import Literal
from pydantic import BaseModel, Field


class StudentProfile(BaseModel):
    name: str
    degree_target: str
    preferred_countries: list[str]
    gpa: float = Field(ge=0, le=10)
    gre: int = Field(ge=260, le=340)
    ielts: float = Field(ge=0, le=9)
    work_ex_years: float = Field(ge=0, le=20)
    budget_usd: int = Field(ge=5000)
    risk_appetite: Literal["safe", "balanced", "ambitious"]


class UniversityRecommendation(BaseModel):
    university: str
    country: str
    program: str
    fit_score: float
    estimated_tuition_usd: int
    estimated_living_usd: int
    admit_chance_pct: float


class ROIRequest(BaseModel):
    tuition_usd: float
    living_usd: float
    loan_interest_pct: float
    expected_salary_usd: float
    salary_growth_pct: float = 7
    horizon_years: int = 5


class ROIResponse(BaseModel):
    total_cost_usd: float
    projected_earnings_usd: float
    roi_pct: float
    payback_years: float


class AdmitPredictRequest(BaseModel):
    gpa: float
    gre: int
    ielts: float
    work_ex_years: float
    sop_quality_score: float = Field(ge=0, le=10)


class AdmitPredictResponse(BaseModel):
    admit_probability_pct: float
    confidence_band: str


class SOPRequest(BaseModel):
    name: str
    program: str
    university_type: str
    achievements: list[str]
    motivation: str
    long_term_goal: str


class LoanEligibilityRequest(BaseModel):
    annual_family_income_usd: float
    collateral_available_usd: float
    credit_score: int = Field(ge=300, le=900)
    target_country: str
    total_required_usd: float


class LoanEligibilityResponse(BaseModel):
    eligible: bool
    max_loan_amount_usd: float
    likely_interest_pct: float
    reason: str


class EMIRequest(BaseModel):
    principal_usd: float
    annual_interest_pct: float
    tenure_months: int


class EMIResponse(BaseModel):
    monthly_emi_usd: float
    total_payment_usd: float
    total_interest_usd: float


class ChatRequest(BaseModel):
    message: str
    context: dict | None = None


class ChatResponse(BaseModel):
    reply: str


class AuthRequest(BaseModel):
    name: str | None = None
    email: str
    password: str
    program: str | None = None


class AuthResponse(BaseModel):
    token: str
    user: dict


class PersonaTemplate(BaseModel):
    id: str
    name: str
    email: str
    program: str
    cgpa: float
    ielts: float
    work_experience_years: float
    budget_usd: int
    funding_need_usd: int
    stage: str
    intake: str
    preferred_countries: list[str]
    gre: int


class ProfileUpdateRequest(BaseModel):
    name: str | None = None
    program: str | None = None
    cgpa: float | None = Field(default=None, ge=0, le=10)
    ielts: float | None = Field(default=None, ge=0, le=9)
    work_experience_years: float | None = Field(default=None, ge=0, le=20)
    budget_usd: int | None = Field(default=None, ge=0)
    funding_need_usd: int | None = Field(default=None, ge=0)
    stage: str | None = None
    intake: str | None = None
    preferred_countries: list[str] | None = None
    gre: int | None = Field(default=None, ge=260, le=340)


class University(BaseModel):
    id: str
    name: str
    country: str
    ranking: int
    programs: list[str]
    tuition_usd: int
    placement_salary_usd: int
    roi_pct: float
    admission_rate_pct: float
    website: str
    location: str
    description: str


class RecommendationItem(BaseModel):
    id: str
    university_id: str
    university: str
    country: str
    program: str
    fit_score: float
    estimated_tuition_usd: int
    estimated_living_usd: int
    admit_chance_pct: float
    roi_estimate_pct: float
    reason: str
    key_drivers: list[str]


class Nudge(BaseModel):
    id: str
    title: str
    message: str
    action_text: str
    read: bool = False
    category: str


class LoanOffer(BaseModel):
    id: str
    lender: str
    amount_usd: int
    interest_rate_pct: float
    tenor_months: int
    monthly_emi_usd: float
    eligibility_score: int
    status: str
    user_id: str | None = None


class EligibilityCheckRequest(BaseModel):
    annual_family_income_usd: float
    collateral_available_usd: float
    credit_score: int = Field(ge=300, le=900)
    target_country: str
    total_required_usd: float


class NudgeActionResponse(BaseModel):
    updated: bool


class OfferActionResponse(BaseModel):
    updated: bool
    offer: dict


class DemoSeedResponse(BaseModel):
    status: str
    users: int
    universities: int
    nudges: int
    offers: int
