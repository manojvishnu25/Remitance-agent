from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, Goal, SimulatedTransaction, ActivityLog, RemittanceDraft
from ..schemas import DashboardResponse, GoalResponse, ActivityLogResponse, DraftResponse
from ..services.goal_service import format_goal_data
from ..services.send_window_service import calculate_send_window

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/{user_id}", response_model=DashboardResponse, summary="Get consolidated dashboard metrics")
def get_dashboard(user_id: int = 1, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    goals = db.query(Goal).filter(Goal.user_id == user_id).all()
    goal_reserved = round(sum(g.saved_amount for g in goals), 2)
    active_goals_count = len([g for g in goals if g.status != "COMPLETED"])

    tx_count = db.query(SimulatedTransaction).filter(SimulatedTransaction.user_id == user_id).count()

    # Recent activities (up to 10)
    recent_logs = (
        db.query(ActivityLog)
        .filter(ActivityLog.user_id == user_id)
        .order_by(ActivityLog.created_at.desc(), ActivityLog.id.desc())
        .limit(10)
        .all()
    )

    formatted_logs = [
        ActivityLogResponse(
            id=log.id,
            user_id=log.user_id,
            action=log.action,
            description=log.description,
            created_at=log.created_at,
            time_display=log.created_at.strftime("%I:%M %p, %b %d")
        )
        for log in recent_logs
    ]

    # Recent drafts (up to 5)
    recent_drafts_raw = (
        db.query(RemittanceDraft)
        .filter(RemittanceDraft.user_id == user_id)
        .order_by(RemittanceDraft.created_at.desc())
        .limit(5)
        .all()
    )

    formatted_drafts = []
    for d in recent_drafts_raw:
        window_data = calculate_send_window(d.deadline, d.corridor.speed_days if d.corridor else 1)
        formatted_drafts.append(
            DraftResponse(
                id=d.id,
                user_id=d.user_id,
                corridor_id=d.corridor_id,
                corridor_name=d.corridor.name if d.corridor else "Unknown",
                amount=d.amount,
                fee=d.fee,
                fx_rate=d.fx_rate,
                total_deducted=round(d.amount + d.fee, 2),
                estimated_recipient_amount=d.estimated_recipient_amount,
                suggested_send_start=d.suggested_send_start,
                suggested_send_end=d.suggested_send_end,
                suggested_window_display=window_data["display"],
                deadline=d.deadline,
                status=d.status,
                created_at=d.created_at,
                approved_at=d.approved_at
            )
        )

    formatted_goals = [GoalResponse(**format_goal_data(g)) for g in goals]

    return DashboardResponse(
        user_id=user.id,
        user_name=user.name,
        available_balance=user.balance,
        currency=user.currency,
        goal_reserved=goal_reserved,
        active_goals_count=active_goals_count,
        simulated_transfers_count=tx_count,
        current_goals=formatted_goals,
        recent_activity=formatted_logs,
        recent_drafts=formatted_drafts,
        simulation_notice="SIMULATION MODE — No real money is transferred."
    )
