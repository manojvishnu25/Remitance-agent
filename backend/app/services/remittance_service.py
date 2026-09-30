from typing import List, Dict, Any
from ..models import Corridor


def compute_corridor_comparisons(corridors: List[Corridor], amount: float) -> List[Dict[str, Any]]:
    """
    Compare corridors for a given remittance amount.
    Computes:
      - fee
      - speed_days
      - fx_rate
      - estimated_recipient_amount = (amount - fee) * fx_rate
      - total_cost = amount + fee
      - descriptive badges: LOWER FEE, FASTER, HIGHER ESTIMATED VALUE
    """
    if not corridors:
        return []

    results = []
    min_fee = min(c.fee for c in corridors)
    min_speed = min(c.speed_days for c in corridors)

    # First pass: calculate values
    for c in corridors:
        net_send = max(0.0, amount - c.fee)
        est_recipient = round(net_send * c.fx_rate, 2)
        total_cost = round(amount + c.fee, 2)

        results.append({
            "id": c.id,
            "name": c.name,
            "country": getattr(c, "country", "United States") or "United States",
            "country_code": getattr(c, "country_code", "US") or "US",
            "fee": c.fee,
            "speed_days": c.speed_days,
            "fx_rate": c.fx_rate,
            "destination_currency": c.destination_currency,
            "currency_symbol": getattr(c, "currency_symbol", "$") or "$",
            "estimated_recipient_amount": est_recipient,
            "total_cost": total_cost,
            "description": c.description,
            "badges": []
        })

    max_est = max(r["estimated_recipient_amount"] for r in results)

    # Second pass: assign badges
    for r in results:
        badges = []
        if r["fee"] == min_fee:
            badges.append("LOWER FEE")
        if r["speed_days"] == min_speed:
            badges.append("FASTER")
        if r["estimated_recipient_amount"] == max_est and max_est > 0:
            badges.append("HIGHER ESTIMATED VALUE")
        r["badges"] = badges

    return results
