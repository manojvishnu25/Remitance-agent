from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..seed import seed_database
from ..schemas import ResetResponse

router = APIRouter(prefix="/api/demo", tags=["Demo Management"])


@router.post("/reset", response_model=ResetResponse, summary="Reset demo environment to pristine state")
def reset_demo_data(db: Session = Depends(get_db)):
    """
    Resets the database state to:
    - User: Demo Student with ₹20,000 balance
    - Corridors: Corridor A (Fee 150, Speed 1d, FX 83.10), Corridor B (Fee 80, Speed 2d, FX 82.80)
    - Goals: Exam Fee (₹2,000 / ₹5,000), Hostel Rent (₹2,000 / ₹8,000)
    - Clears drafts, simulated transactions, and allocations
    """
    seed_database(db, reset=True)
    return ResetResponse(
        success=True,
        message="Demo simulation environment reset successfully to default initial state."
    )
