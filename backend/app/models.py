from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    balance = Column(Float, nullable=False, default=50000.0)
    currency = Column(String(10), nullable=False, default="INR")
    created_at = Column(DateTime, default=datetime.utcnow)

    goals = relationship("Goal", back_populates="user", cascade="all, delete-orphan")
    drafts = relationship("RemittanceDraft", back_populates="user", cascade="all, delete-orphan")
    transactions = relationship("SimulatedTransaction", back_populates="user", cascade="all, delete-orphan")
    allocations = relationship("GoalAllocation", back_populates="user", cascade="all, delete-orphan")
    activities = relationship("ActivityLog", back_populates="user", cascade="all, delete-orphan")


class Corridor(Base):
    __tablename__ = "corridors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    country = Column(String(100), nullable=True, default="United States")
    country_code = Column(String(10), nullable=True, default="US")
    fee = Column(Float, nullable=False)
    speed_days = Column(Integer, nullable=False)
    fx_rate = Column(Float, nullable=False)
    destination_currency = Column(String(10), nullable=False, default="USD")
    currency_symbol = Column(String(10), nullable=True, default="$")
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)

    drafts = relationship("RemittanceDraft", back_populates="corridor")


class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(120), nullable=False)
    target_amount = Column(Float, nullable=False)
    saved_amount = Column(Float, nullable=False, default=0.0)
    deadline = Column(String(50), nullable=False)
    status = Column(String(30), nullable=False, default="IN_PROGRESS")  # IN_PROGRESS, COMPLETED
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="goals")
    allocations = relationship("GoalAllocation", back_populates="goal", cascade="all, delete-orphan")


class RemittanceDraft(Base):
    __tablename__ = "remittance_drafts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    corridor_id = Column(Integer, ForeignKey("corridors.id"), nullable=False)
    amount = Column(Float, nullable=False)
    fee = Column(Float, nullable=False)
    fx_rate = Column(Float, nullable=False)
    estimated_recipient_amount = Column(Float, nullable=False)
    suggested_send_start = Column(String(100), nullable=False)
    suggested_send_end = Column(String(100), nullable=False)
    deadline = Column(String(50), nullable=False)
    status = Column(String(30), nullable=False, default="DRAFT")  # DRAFT, APPROVED, CANCELLED
    created_at = Column(DateTime, default=datetime.utcnow)
    approved_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="drafts")
    corridor = relationship("Corridor", back_populates="drafts")
    transaction = relationship("SimulatedTransaction", back_populates="draft", uselist=False)


class SimulatedTransaction(Base):
    __tablename__ = "simulated_transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    draft_id = Column(Integer, ForeignKey("remittance_drafts.id"), nullable=False)
    amount = Column(Float, nullable=False)
    fee = Column(Float, nullable=False)
    total_deducted = Column(Float, nullable=False)
    status = Column(String(40), nullable=False, default="SIMULATED_APPROVED")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="transactions")
    draft = relationship("RemittanceDraft", back_populates="transaction")


class GoalAllocation(Base):
    __tablename__ = "goal_allocations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    goal_id = Column(Integer, ForeignKey("goals.id"), nullable=False)
    amount = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="allocations")
    goal = relationship("Goal", back_populates="allocations")


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="activities")
