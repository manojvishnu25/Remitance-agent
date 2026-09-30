from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Goal, GoalAllocation, User, ActivityLog
from ..schemas import GoalResponse, GoalCreateRequest, GoalAllocateRequest, GoalAllocateResponse
from ..services.goal_service import format_goal_data

router = APIRouter(prefix="/api/goals", tags=["Goal Allocation"])


@router.get("/{user_id}", response_model=List[GoalResponse], summary="Get all goals for a user")
def get_user_goals(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    goals = db.query(Goal).filter(Goal.user_id == user_id).order_by(Goal.id.asc()).all()
    return [format_goal_data(g) for g in goals]


@router.post("", response_model=GoalResponse, status_code=status.HTTP_201_CREATED, summary="Create a new goal")
def create_goal(request: GoalCreateRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    if request.target_amount <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Target amount must be greater than zero.")

    goal = Goal(
        user_id=user.id,
        name=request.name.strip(),
        target_amount=request.target_amount,
        saved_amount=0.0,
        deadline=request.deadline,
        status="IN_PROGRESS",
        created_at=datetime.utcnow()
    )
    db.add(goal)
    db.flush()

    log = ActivityLog(
        user_id=user.id,
        action="Created Goal",
        description=f"Created savings goal '{goal.name}' with target ₹{goal.target_amount:,.2f}."
    )
    db.add(log)
    db.commit()
    db.refresh(goal)

    return format_goal_data(goal)


@router.post("/{goal_id}/allocate", response_model=GoalAllocateResponse, summary="Allocate leftover funds to a goal")
def allocate_goal(goal_id: int, request: GoalAllocateRequest, db: Session = Depends(get_db)):
    """
    Parks simulated leftover money into a designated savings goal.
    Validations:
      - amount > 0
      - amount <= user available balance
      - amount <= goal remaining amount
    """
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Goal #{goal_id} not found.")

    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    if request.amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Allocation amount must be greater than 0."
        )

    if request.amount > user.balance:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient available balance (₹{user.balance:,.2f}) to park ₹{request.amount:,.2f}."
        )

    remaining_goal = round(goal.target_amount - goal.saved_amount, 2)
    if remaining_goal <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Goal '{goal.name}' is already 100% funded."
        )

    if request.amount > remaining_goal:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Allocation amount (₹{request.amount:,.2f}) exceeds remaining needed amount (₹{remaining_goal:,.2f}) for goal '{goal.name}'."
        )

    # Deduct from user available balance
    user.balance = round(user.balance - request.amount, 2)

    # Increase goal saved amount
    goal.saved_amount = round(goal.saved_amount + request.amount, 2)
    if goal.saved_amount >= goal.target_amount:
        goal.status = "COMPLETED"

    # Create allocation record
    alloc = GoalAllocation(
        user_id=user.id,
        goal_id=goal.id,
        amount=request.amount,
        created_at=datetime.utcnow()
    )
    db.add(alloc)

    # Activity log
    log = ActivityLog(
        user_id=user.id,
        action="Goal Funded",
        description=f"Parked ₹{request.amount:,.2f} into goal '{goal.name}' (Remaining: ₹{max(0.0, goal.target_amount - goal.saved_amount):,.2f})."
    )
    db.add(log)

    db.commit()
    db.refresh(goal)
    db.refresh(user)

    return GoalAllocateResponse(
        goal=format_goal_data(goal),
        updated_balance=user.balance,
        message=f"Successfully allocated ₹{request.amount:,.2f} to {goal.name}."
    )
