from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import RemittanceDraft, Corridor, User, SimulatedTransaction, ActivityLog
from ..schemas import DraftCreateRequest, DraftResponse
from ..services.send_window_service import calculate_send_window

router = APIRouter(prefix="/api/drafts", tags=["Send Window & Drafts"])


def format_draft_response(draft: RemittanceDraft) -> DraftResponse:
    corridor_name = draft.corridor.name if draft.corridor else "Unknown Corridor"
    total_deducted = round(draft.amount + draft.fee, 2)
    # Construct display string
    suggested_display = f"{draft.suggested_send_start} - {draft.suggested_send_end}"
    if hasattr(draft, "_display_str") and draft._display_str:
        suggested_display = draft._display_str

    dest_currency = draft.corridor.destination_currency if draft.corridor else "USD"
    curr_symbol = draft.corridor.currency_symbol if draft.corridor else "$"

    return DraftResponse(
        id=draft.id,
        user_id=draft.user_id,
        corridor_id=draft.corridor_id,
        corridor_name=corridor_name,
        destination_currency=dest_currency,
        currency_symbol=curr_symbol,
        amount=draft.amount,
        fee=draft.fee,
        fx_rate=draft.fx_rate,
        total_deducted=total_deducted,
        estimated_recipient_amount=draft.estimated_recipient_amount,
        suggested_send_start=draft.suggested_send_start,
        suggested_send_end=draft.suggested_send_end,
        suggested_window_display=suggested_display,
        deadline=draft.deadline,
        status=draft.status,
        created_at=draft.created_at,
        approved_at=draft.approved_at
    )


@router.post("", response_model=DraftResponse, status_code=status.HTTP_201_CREATED, summary="Create a send draft")
def create_draft(request: DraftCreateRequest, db: Session = Depends(get_db)):
    """
    Creates a simulated remittance draft with calculated send window.
    Does NOT move money.
    """
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    corridor = db.query(Corridor).filter(Corridor.id == request.corridor_id, Corridor.is_active == True).first()
    if not corridor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Corridor not found or inactive.")

    if request.amount <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Amount must be greater than zero.")

    total_cost = request.amount + corridor.fee
    if user.balance < total_cost:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient available balance (₹{user.balance:,.2f}) for transfer of ₹{request.amount:,.2f} plus fee of ₹{corridor.fee:,.2f}."
        )

    # Calculate deterministic send window
    window_data = calculate_send_window(request.deadline, corridor.speed_days)

    net_send = max(0.0, request.amount - corridor.fee)
    estimated_recipient = round(net_send * corridor.fx_rate, 2)

    draft = RemittanceDraft(
        user_id=user.id,
        corridor_id=corridor.id,
        amount=request.amount,
        fee=corridor.fee,
        fx_rate=corridor.fx_rate,
        estimated_recipient_amount=estimated_recipient,
        suggested_send_start=window_data["start"],
        suggested_send_end=window_data["end"],
        deadline=request.deadline,
        status="DRAFT",
        created_at=datetime.utcnow()
    )
    db.add(draft)
    db.flush()

    # Activity log
    log = ActivityLog(
        user_id=user.id,
        action="Created Send Draft",
        description=f"Created send draft #{draft.id} for ₹{request.amount:,.2f} via {corridor.name}."
    )
    db.add(log)
    db.commit()
    db.refresh(draft)

    resp = format_draft_response(draft)
    resp.suggested_window_display = window_data["display"]
    return resp


@router.get("/{draft_id}", response_model=DraftResponse, summary="Get send draft by ID")
def get_draft(draft_id: int, db: Session = Depends(get_db)):
    draft = db.query(RemittanceDraft).filter(RemittanceDraft.id == draft_id).first()
    if not draft:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Draft #{draft_id} not found.")

    window_data = calculate_send_window(draft.deadline, draft.corridor.speed_days)
    resp = format_draft_response(draft)
    resp.suggested_window_display = window_data["display"]
    return resp


@router.post("/{draft_id}/approve", response_model=DraftResponse, summary="Approve simulated remittance draft")
def approve_draft(draft_id: int, db: Session = Depends(get_db)):
    """
    Manually approve the remittance draft:
    - Deducts simulated balance
    - Records simulated transaction
    - Marks draft as APPROVED
    - NO real financial movement
    """
    draft = db.query(RemittanceDraft).filter(RemittanceDraft.id == draft_id).first()
    if not draft:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Draft not found.")

    if draft.status == "APPROVED":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Draft has already been approved.")

    if draft.status == "CANCELLED":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Draft has been cancelled and cannot be approved.")

    user = db.query(User).filter(User.id == draft.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    total_deducted = round(draft.amount + draft.fee, 2)
    if user.balance < total_deducted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient available balance (₹{user.balance:,.2f}) for transfer total of ₹{total_deducted:,.2f}."
        )

    # Deduct simulated balance
    user.balance = round(user.balance - total_deducted, 2)

    # Create simulated transaction
    tx = SimulatedTransaction(
        user_id=user.id,
        draft_id=draft.id,
        amount=draft.amount,
        fee=draft.fee,
        total_deducted=total_deducted,
        status="SIMULATED_APPROVED",
        created_at=datetime.utcnow()
    )
    db.add(tx)

    # Update draft
    draft.status = "APPROVED"
    draft.approved_at = datetime.utcnow()

    # Activity log
    log = ActivityLog(
        user_id=user.id,
        action="Approved Simulation",
        description=f"Approved transfer #{draft.id}: ₹{draft.amount:,.2f} + fee ₹{draft.fee:,.2f} (Total ₹{total_deducted:,.2f}) via {draft.corridor.name}."
    )
    db.add(log)

    db.commit()
    db.refresh(draft)

    window_data = calculate_send_window(draft.deadline, draft.corridor.speed_days)
    resp = format_draft_response(draft)
    resp.suggested_window_display = window_data["display"]
    return resp


@router.post("/{draft_id}/cancel", response_model=DraftResponse, summary="Cancel remittance draft")
def cancel_draft(draft_id: int, db: Session = Depends(get_db)):
    """Cancel a draft without affecting user balance."""
    draft = db.query(RemittanceDraft).filter(RemittanceDraft.id == draft_id).first()
    if not draft:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Draft not found.")

    if draft.status == "APPROVED":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot cancel an already approved simulation.")

    if draft.status == "CANCELLED":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Draft is already cancelled.")

    draft.status = "CANCELLED"

    log = ActivityLog(
        user_id=draft.user_id,
        action="Cancelled Send Draft",
        description=f"Cancelled send draft #{draft.id} for ₹{draft.amount:,.2f}."
    )
    db.add(log)

    db.commit()
    db.refresh(draft)

    window_data = calculate_send_window(draft.deadline, draft.corridor.speed_days)
    resp = format_draft_response(draft)
    resp.suggested_window_display = window_data["display"]
    return resp
