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
