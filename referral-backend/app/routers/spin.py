import random
import datetime
from fastapi import APIRouter, HTTPException, Depends
from app.database import get_db
from app.auth import get_current_user

router = APIRouter(prefix="/api/spin", tags=["spin"])

SPIN_AMOUNTS = [0, 1, 2, 3, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50]

@router.post("/wheel")
def spin_wheel(user: dict = Depends(get_current_user)):
    user_id = user["user_id"]
    today = datetime.date.today().isoformat()

    with get_db() as conn:
        # Check if already spun today
        existing = conn.execute(
            "SELECT id FROM spin_records WHERE user_id = ? AND DATE(spun_at) = ?",
            (user_id, today)
        ).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="You have already spun the wheel today. Come back tomorrow!")

        # Random amount with weighted distribution (lower amounts more likely)
        weights = [20, 15, 12, 10, 8, 7, 6, 5, 4, 4, 3, 3, 2, 1]
        amount = random.choices(SPIN_AMOUNTS, weights=weights, k=1)[0]

        conn.execute(
            "INSERT INTO spin_records (user_id, amount) VALUES (?, ?)",
            (user_id, amount)
        )

        if amount > 0:
            conn.execute(
                "UPDATE users SET balance = balance + ? WHERE id = ?",
                (amount, user_id)
            )
            conn.execute(
                "INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)",
                (user_id, amount, "spin_wheel", f"Spin wheel win - {amount} KES")
            )

    return {
        "amount": amount,
        "message": f"You won {amount} KES!" if amount > 0 else "Better luck next time!",
        "amounts": SPIN_AMOUNTS
    }

@router.get("/status")
def spin_status(user: dict = Depends(get_current_user)):
    user_id = user["user_id"]
    today = datetime.date.today().isoformat()

    with get_db() as conn:
        existing = conn.execute(
            "SELECT * FROM spin_records WHERE user_id = ? AND DATE(spun_at) = ?",
            (user_id, today)
        ).fetchone()

        history = conn.execute(
            "SELECT * FROM spin_records WHERE user_id = ? ORDER BY spun_at DESC LIMIT 10",
            (user_id,)
        ).fetchall()

    return {
        "can_spin": existing is None,
        "last_spin": dict(existing) if existing else None,
        "history": [dict(h) for h in history],
        "amounts": SPIN_AMOUNTS
    }
