from typing import Dict, Any
from ..models import Goal


def format_goal_data(goal: Goal) -> Dict[str, Any]:
    remaining = max(0.0, round(goal.target_amount - goal.saved_amount, 2))
    progress = 0.0
    if goal.target_amount > 0:
        progress = min(100.0, round((goal.saved_amount / goal.target_amount) * 100, 1))

    return {
        "id": goal.id,
        "user_id": goal.user_id,
        "name": goal.name,
        "target_amount": goal.target_amount,
        "saved_amount": goal.saved_amount,
        "remaining_amount": remaining,
        "progress_percentage": progress,
        "deadline": goal.deadline,
        "status": "COMPLETED" if remaining == 0 else goal.status,
        "created_at": goal.created_at
    }
