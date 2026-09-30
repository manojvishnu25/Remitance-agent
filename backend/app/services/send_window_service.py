from datetime import datetime, timedelta
from typing import Dict, Any


def calculate_send_window(deadline_str: str, speed_days: int) -> Dict[str, str]:
    """
    Deterministically calculate suggested send window based on deadline and corridor speed.
    Example:
      If deadline is 2026-10-10 and speed_days is 1 -> 2026-10-09, 10:00 AM - 02:00 PM
      If speed_days is 2 -> 2026-10-08, 10:00 AM - 02:00 PM
    """
    # Parse deadline
    clean_date = deadline_str.strip()
    parsed_date = None

    for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%Y/%m/%d", "%d/%m/%Y"):
        try:
            parsed_date = datetime.strptime(clean_date, fmt)
            break
        except ValueError:
            continue

    if not parsed_date:
        # Fallback to 7 days from now if format is irregular
        parsed_date = datetime.utcnow() + timedelta(days=7)

    # Send date must be at least speed_days before deadline
    suggested_date = parsed_date - timedelta(days=max(1, speed_days))

    # Window from 10:00 AM to 02:00 PM on suggested date
    start_dt = suggested_date.replace(hour=10, minute=0, second=0, microsecond=0)
    end_dt = suggested_date.replace(hour=14, minute=0, second=0, microsecond=0)

    date_formatted = suggested_date.strftime("%B %d, %Y")
    display_str = f"{date_formatted}, 10:00 AM - 02:00 PM"

    return {
        "start": start_dt.isoformat(),
        "end": end_dt.isoformat(),
        "display": display_str
    }
