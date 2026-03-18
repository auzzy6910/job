import random
import datetime
from fastapi import APIRouter, HTTPException, Depends
from app.database import get_db
from app.auth import get_current_user

router = APIRouter(prefix="/api", tags=["leaderboard", "gifts", "diamond"])

CROWN_PRIZES = {1: 5000, 2: 4000, 3: 3000, 4: 2000, 5: 1000}

@router.get("/leaderboard")
def get_leaderboard():
    with get_db() as conn:
        top_referrers = conn.execute(
            """SELECT u.id, u.username, COUNT(r.id) as referral_count,
                      COALESCE(SUM(r.amount_paid), 0) as total_earned
               FROM users u
               LEFT JOIN referrals r ON r.referrer_id = u.id AND r.bonus_paid = 1
               GROUP BY u.id
               HAVING referral_count > 0
               ORDER BY referral_count DESC
               LIMIT 5"""
        ).fetchall()

    leaderboard = []
    for i, user in enumerate(top_referrers, 1):
        leaderboard.append({
            "position": i,
            "username": user["username"],
            "referral_count": user["referral_count"],
            "total_earned": user["total_earned"],
            "crown_prize": CROWN_PRIZES.get(i, 0)
        })

    return {"leaderboard": leaderboard, "prizes": CROWN_PRIZES}

@router.get("/daily-credits")
def get_daily_credits(user: dict = Depends(get_current_user)):
    user_id = user["user_id"]
    today = datetime.date.today().isoformat()

    with get_db() as conn:
        existing = conn.execute(
            "SELECT * FROM daily_credits WHERE user_id = ? AND DATE(claimed_at) = ?",
            (user_id, today)
        ).fetchone()

    return {
        "claimed_today": existing is not None,
        "credit": dict(existing) if existing else None
    }

@router.post("/daily-credits/claim")
def claim_daily_credits(user: dict = Depends(get_current_user)):
    user_id = user["user_id"]
    today = datetime.date.today().isoformat()

    with get_db() as conn:
        existing = conn.execute(
            "SELECT id FROM daily_credits WHERE user_id = ? AND DATE(claimed_at) = ?",
            (user_id, today)
        ).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="Already claimed daily credits today!")

        # Random credit amount 1-10 KES
        amount = random.randint(1, 10)

        conn.execute(
            "INSERT INTO daily_credits (user_id, amount) VALUES (?, ?)",
            (user_id, amount)
        )
        conn.execute(
            "UPDATE users SET balance = balance + ? WHERE id = ?",
            (amount, user_id)
        )
        conn.execute(
            "INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)",
            (user_id, amount, "daily_credit", f"Daily free credit - {amount} KES")
        )

    return {"amount": amount, "message": f"Claimed {amount} KES daily credit!"}

@router.get("/diamond-draw")
def diamond_draw_status(user: dict = Depends(get_current_user)):
    user_id = user["user_id"]
    current_month = datetime.date.today().strftime("%Y-%m")

    with get_db() as conn:
        entry = conn.execute(
            "SELECT * FROM diamond_draw_entries WHERE user_id = ? AND month = ?",
            (user_id, current_month)
        ).fetchone()

        total_entries = conn.execute(
            "SELECT COUNT(*) as count FROM diamond_draw_entries WHERE month = ?",
            (current_month,)
        ).fetchone()["count"]

        past_winners = conn.execute(
            """SELECT dw.*, u.username
               FROM diamond_draw_winners dw
               JOIN users u ON u.id = dw.user_id
               ORDER BY dw.won_at DESC LIMIT 6"""
        ).fetchall()

    return {
        "current_month": current_month,
        "is_entered": entry is not None,
        "total_entries": total_entries,
        "prize": 20000,
        "past_winners": [dict(w) for w in past_winners]
    }

@router.post("/diamond-draw/enter")
def enter_diamond_draw(user: dict = Depends(get_current_user)):
    user_id = user["user_id"]
    current_month = datetime.date.today().strftime("%Y-%m")

    with get_db() as conn:
        existing = conn.execute(
            "SELECT id FROM diamond_draw_entries WHERE user_id = ? AND month = ?",
            (user_id, current_month)
        ).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="Already entered this month's diamond draw!")

        u = conn.execute("SELECT is_activated FROM users WHERE id = ?", (user_id,)).fetchone()
        if not u or not u["is_activated"]:
            raise HTTPException(status_code=403, detail="You must activate your account to enter the diamond draw")

        conn.execute(
            "INSERT INTO diamond_draw_entries (user_id, month) VALUES (?, ?)",
            (user_id, current_month)
        )

    return {"message": "Successfully entered this month's diamond draw! Prize: 20,000 KES"}

@router.post("/diamond-draw/draw")
def perform_diamond_draw():
    """Admin endpoint to perform the monthly draw"""
    current_month = datetime.date.today().strftime("%Y-%m")

    with get_db() as conn:
        existing_winner = conn.execute(
            "SELECT * FROM diamond_draw_winners WHERE month = ?",
            (current_month,)
        ).fetchone()
        if existing_winner:
            raise HTTPException(status_code=400, detail="Draw already performed for this month")

        entries = conn.execute(
            "SELECT user_id FROM diamond_draw_entries WHERE month = ?",
            (current_month,)
        ).fetchall()
        if not entries:
            raise HTTPException(status_code=400, detail="No entries for this month")

        winner_id = random.choice(entries)["user_id"]

        conn.execute(
            "INSERT INTO diamond_draw_winners (user_id, month) VALUES (?, ?)",
            (winner_id, current_month)
        )
        conn.execute(
            "UPDATE users SET balance = balance + 20000 WHERE id = ?",
            (winner_id,)
        )
        conn.execute(
            "INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)",
            (winner_id, 20000.0, "diamond_draw", "Monthly Diamond Draw Winner - 20,000 KES!")
        )

        winner = conn.execute("SELECT username FROM users WHERE id = ?", (winner_id,)).fetchone()

    return {"winner": winner["username"], "prize": 20000, "month": current_month}
