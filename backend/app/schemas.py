from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator


# User Schemas
class UserBase(BaseModel):
    name: str
    balance: float
    currency: str = "INR"


class UserResponse(UserBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


# Corridor Schemas
class CorridorResponse(BaseModel):
    id: int
    name: str
    country: Optional[str] = "United States"
    country_code: Optional[str] = "US"
    fee: float
    speed_days: int
    fx_rate: float
    destination_currency: str
    currency_symbol: Optional[str] = "$"
    description: Optional[str] = None
    is_active: bool

    model_config = {"from_attributes": True}


class DestinationResponse(BaseModel):
    country: str
    country_code: str
    currency: str
    currency_symbol: str
    corridor_count: int


# Remittance Comparison Schemas
class RemittanceCompareRequest(BaseModel):
    amount: float = Field(..., gt=0, description="Remittance amount in INR (must be > 0)")
    deadline: str = Field(..., description="Target delivery deadline (YYYY-MM-DD)")
    country: Optional[str] = Field(default="United States", description="Destination country or currency")

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError("Amount must be greater than 0")
        return round(v, 2)


class CorridorCompareOption(BaseModel):
    id: int
    name: str
    country: Optional[str] = "United States"
    country_code: Optional[str] = "US"
    fee: float
    speed_days: int
    fx_rate: float
    destination_currency: str
    currency_symbol: Optional[str] = "$"
    estimated_recipient_amount: float
    total_cost: float
    badges: List[str]
    description: Optional[str] = None


class RemittanceCompareResponse(BaseModel):
    amount: float
    deadline: str
    country: Optional[str] = "United States"
    options: List[CorridorCompareOption]
    note: str = "SIMULATION DATA — No real banking transactions"


# Draft Schemas
class DraftCreateRequest(BaseModel):
    user_id: int = Field(default=1, description="ID of the simulated user")
    corridor_id: int = Field(..., description="Selected corridor ID")
    amount: float = Field(..., gt=0, description="Transfer amount in INR")
    deadline: str = Field(..., description="Deadline date (YYYY-MM-DD)")

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError("Amount must be greater than 0")
        return round(v, 2)


class DraftResponse(BaseModel):
    id: int
    user_id: int
    corridor_id: int
    corridor_name: Optional[str] = None
    destination_currency: Optional[str] = "USD"
    currency_symbol: Optional[str] = "$"
    amount: float
    fee: float
    fx_rate: float
    total_deducted: float
    estimated_recipient_amount: float
    suggested_send_start: str
    suggested_send_end: str
    suggested_window_display: str
    deadline: str
    status: str
    created_at: datetime
    approved_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# Goal Schemas
class GoalCreateRequest(BaseModel):
    user_id: int = Field(default=1)
    name: str = Field(..., min_length=2, max_length=100)
    target_amount: float = Field(..., gt=0)
    deadline: str = Field(..., description="Deadline date (YYYY-MM-DD)")


class GoalResponse(BaseModel):
    id: int
    user_id: int
    name: str
    target_amount: float
    saved_amount: float
    remaining_amount: float
    progress_percentage: float
    deadline: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class GoalAllocateRequest(BaseModel):
    user_id: int = Field(default=1)
    amount: float = Field(..., gt=0, description="Amount to allocate towards goal in INR")

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError("Allocation amount must be greater than 0")
        return round(v, 2)


class GoalAllocateResponse(BaseModel):
    goal: GoalResponse
    updated_balance: float
    message: str


# Activity Log Schemas
class ActivityLogResponse(BaseModel):
    id: int
    user_id: int
    action: str
    description: str
    created_at: datetime
    time_display: Optional[str] = None

    model_config = {"from_attributes": True}


# Simulated Transaction Schemas
class SimulatedTransactionResponse(BaseModel):
    id: int
    user_id: int
    draft_id: int
    amount: float
    fee: float
    total_deducted: float
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


# Dashboard Schemas
class DashboardResponse(BaseModel):
    user_id: int
    user_name: str
    available_balance: float
    currency: str
    goal_reserved: float
    active_goals_count: int
    simulated_transfers_count: int
    current_goals: List[GoalResponse]
    recent_activity: List[ActivityLogResponse]
    recent_drafts: List[DraftResponse]
    simulation_notice: str = "SIMULATION MODE — No real money is transferred."


# Demo Reset Schema
class ResetResponse(BaseModel):
    success: bool
    message: str
