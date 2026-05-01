from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.sql import func
from .db import Base


class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    program = Column(String, nullable=True)
    cgpa = Column(Float, nullable=True)
    ielts = Column(Float, nullable=True)
    work_experience_years = Column(Float, nullable=True)
    budget_usd = Column(Integer, nullable=True)
    funding_need_usd = Column(Integer, nullable=True)
    stage = Column(String, nullable=True)
    intake = Column(String, nullable=True)
    preferred_countries = Column(JSON, nullable=True)
    gre = Column(Integer, nullable=True)
    risk_appetite = Column(String, nullable=True)
    shortlist = Column(JSON, nullable=True)
    accepted_offer_id = Column(String, nullable=True)
    recommendations = Column(JSON, nullable=True)
    loan_offers = Column(JSON, nullable=True)
    nudges = Column(JSON, nullable=True)
    engagement_points = Column(Integer, default=0)
    streak_days = Column(Integer, default=0)
    profile_completed = Column(Boolean, default=False)
    recent_activity = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class University(Base):
    __tablename__ = "universities"
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    country = Column(String, nullable=True)
    ranking = Column(Integer, nullable=True)
    programs = Column(JSON, nullable=True)
    tuition_usd = Column(Integer, nullable=True)
    placement_salary_usd = Column(Integer, nullable=True)
    roi_pct = Column(Float, nullable=True)
    admission_rate_pct = Column(Float, nullable=True)
    website = Column(String, nullable=True)
    location = Column(String, nullable=True)
    description = Column(Text, nullable=True)


class LoanOffer(Base):
    __tablename__ = "loan_offers"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    lender = Column(String, nullable=False)
    amount_usd = Column(Integer, nullable=False)
    interest_rate_pct = Column(Float, nullable=False)
    tenor_months = Column(Integer, nullable=False)
    monthly_emi_usd = Column(Float, nullable=True)
    status = Column(String, default="available")


class Nudge(Base):
    __tablename__ = "nudges"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=True)
    action_text = Column(String, nullable=True)
    category = Column(String, nullable=True)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SessionToken(Base):
    __tablename__ = "sessions"
    token = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
