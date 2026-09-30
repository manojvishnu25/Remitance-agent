from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from ..database import get_db
from ..models import Corridor, ActivityLog, User
from ..schemas import CorridorResponse, RemittanceCompareRequest, RemittanceCompareResponse, DestinationResponse
from ..services.remittance_service import compute_corridor_comparisons

router = APIRouter(prefix="/api", tags=["Remittance Comparison"])


@router.get("/destinations", response_model=List[DestinationResponse], summary="Get supported destination corridors")
def get_destinations(db: Session = Depends(get_db)):
    """Fetch distinct destination countries and currencies available in the simulation."""
    corridors = db.query(Corridor).filter(Corridor.is_active == True).all()
    dest_map = {}
    for c in corridors:
        country = c.country or "United States"
        if country not in dest_map:
            dest_map[country] = {
                "country": country,
                "country_code": c.country_code or "US",
                "currency": c.destination_currency or "USD",
                "currency_symbol": c.currency_symbol or "$",
                "corridor_count": 0
            }
        dest_map[country]["corridor_count"] += 1

    return list(dest_map.values())


@router.get("/corridors", response_model=List[CorridorResponse], summary="Get active remittance corridors")
def get_corridors(country: Optional[str] = Query(None), db: Session = Depends(get_db)):
    """Fetch active mock corridors, optionally filtered by destination country or currency."""
    query = db.query(Corridor).filter(Corridor.is_active == True)
    if country:
        c_clean = country.strip()
        query = query.filter(
            or_(
                Corridor.country.ilike(f"%{c_clean}%"),
                Corridor.destination_currency.ilike(f"%{c_clean}%"),
                Corridor.country_code.ilike(f"%{c_clean}%")
            )
        )
    return query.all()


@router.post("/remittance/compare", response_model=RemittanceCompareResponse, summary="Compare remittance corridor options")
def compare_remittance(request: RemittanceCompareRequest, db: Session = Depends(get_db)):
    """
    Compare simulated remittance corridor options based on:
    - Destination Country
    - Fee
    - Speed (days)
    - FX rate
    - Estimated recipient amount
    """
    if request.amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transfer amount must be greater than zero."
        )

    # Filter corridors by destination country if specified
    query = db.query(Corridor).filter(Corridor.is_active == True)
    target_country = request.country or "United States"

    filtered_corridors = query.filter(
        or_(
            Corridor.country.ilike(f"%{target_country}%"),
            Corridor.destination_currency.ilike(f"%{target_country}%"),
            Corridor.country_code.ilike(f"%{target_country}%")
        )
    ).all()

    # If specific country corridors found, compare them; otherwise fallback to all active
    corridors = filtered_corridors if filtered_corridors else query.all()

    if not corridors:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No active remittance corridors available for destination '{target_country}'."
        )

    options = compute_corridor_comparisons(corridors, request.amount)

    # Log activity for Demo Student (user_id=1)
    user = db.query(User).filter(User.id == 1).first()
    if user:
        dest_display = corridors[0].country if corridors else target_country
        log = ActivityLog(
            user_id=user.id,
            action="Compared Corridors",
            description=f"Compared remittance options for ₹{request.amount:,.2f} to {dest_display} ({corridors[0].destination_currency}) due by {request.deadline}"
        )
        db.add(log)
        db.commit()

    return {
        "amount": request.amount,
        "deadline": request.deadline,
        "country": corridors[0].country if corridors else target_country,
        "options": options,
        "note": "SIMULATION DATA — No real banking transactions"
    }
