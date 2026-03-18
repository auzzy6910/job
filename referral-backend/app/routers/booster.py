import datetime
from fastapi import APIRouter, HTTPException, Depends
from app.database import get_db
from app.auth import get_current_user

router = APIRouter(prefix="/api/booster", tags=["booster"])

@router.post("/deposit")
def booster_deposit(user: dict = Depends(get_current_user)):
    user_id = user["user_id"]
    amount = 200.0
    now = datetime.datetime.utcnow()
    withdrawable_at = now + datetime.timedelta(hours=24)

    with get_db() as conn:
        u = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        if not u:
            raise HTTPException(status_code=404, detail="User not found")
        if u["balance"] < amount:
            raise HTTPException(status_code=400, detail="Insufficient balance. You need 200 KES to boost.")

        # Check if already has an active booster
        active = conn.execute(
            "SELECT id FROM boosters WHERE user_id = ? AND withdrawn = 0",
            (user_id,)
        ).fetchone()
        if active:
            raise HTTPException(status_code=400, detail="You already have an active booster deposit")

        conn.execute(
            "UPDATE users SET balance = balance - ? WHERE id = ?",
            (amount, user_id)
        )
        conn.execute(
            "INSERT INTO boosters (user_id, amount, deposited_at, withdrawable_at) VALUES (?, ?, ?, ?)",
            (user_id, amount, now.isoformat(), withdrawable_at.isoformat())
        )
        conn.execute(
            "INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)",
            (user_id, -amount, "booster_deposit", f"Booster deposit of {amount} KES - withdrawable after 24 hours")
        )

    return {
        "message": f"Booster deposit of {amount} KES placed! Withdrawable after 24 hours.",
        "withdrawable_at": withdrawable_at.isoformat()
    }

@router.post("/withdraw")
def booster_withdraw(user: dict = Depends(get_current_user)):
    user_id = user["user_id"]
    now = datetime.datetime.utcnow().isoformat()

    with get_db() as conn:
        booster = conn.execute(
            "SELECT * FROM boosters WHERE user_id = ? AND withdrawn = 0 ORDER BY deposited_at DESC LIMIT 1",
            (user_id,)
        ).fetchone()
        if not booster:
            raise HTTPException(status_code=400, detail="No active booster deposit found")

        if now < booster["withdrawable_at"]:
            raise HTTPException(
                status_code=400,
                detail=f"Booster not yet withdrawable. Available at {booster['withdrawable_at']}"
            )

        conn.execute("UPDATE boosters SET withdrawn = 1 WHERE id = ?", (booster["id"],))
        conn.execute(
            "UPDATE users SET balance = balance + ? WHERE id = ?",
            (booster["amount"], user_id)
        )
        conn.execute(
            "INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)",
            (user_id, booster["amount"], "booster_withdraw", f"Booster withdrawal of {booster['amount']} KES")
        )

    return {"message": f"Booster withdrawal of {booster['amount']} KES successful!"}

@router.get("/status")
def booster_status(user: dict = Depends(get_current_user)):
    user_id = user["user_id"]
    now = datetime.datetime.utcnow().isoformat()

    with get_db() as conn:
        active = conn.execute(
            "SELECT * FROM boosters WHERE user_id = ? AND withdrawn = 0 ORDER BY deposited_at DESC LIMIT 1",
            (user_id,)
        ).fetchone()

        history = conn.execute(
            "SELECT * FROM boosters WHERE user_id = ? ORDER BY deposited_at DESC LIMIT 10",
            (user_id,)
        ).fetchall()

    result = {
        "has_active_booster": active is not None,
        "active_booster": None,
        "history": [dict(h) for h in history]
    }

    if active:
        result["active_booster"] = {
            **dict(active),
            "can_withdraw": now >= active["withdrawable_at"]
        }

    return result
