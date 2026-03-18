from fastapi import APIRouter, Depends
from app.database import get_db
from app.auth import get_current_user

router = APIRouter(prefix="/api/referrals", tags=["referrals"])

@router.get("/my-referrals")
def get_my_referrals(user: dict = Depends(get_current_user)):
    user_id = user["user_id"]
    with get_db() as conn:
        referrals = conn.execute(
            """SELECT r.*, u.username as referred_username, u.is_activated
               FROM referrals r
               JOIN users u ON u.id = r.referred_id
               WHERE r.referrer_id = ?
               ORDER BY r.created_at DESC""",
            (user_id,)
        ).fetchall()

        stats = conn.execute(
            """SELECT
                COUNT(*) as total,
                SUM(CASE WHEN deposit_made = 1 THEN 1 ELSE 0 END) as deposits_made,
                SUM(CASE WHEN bonus_paid = 1 THEN 1 ELSE 0 END) as bonuses_paid,
                COALESCE(SUM(amount_paid), 0) as total_earned
               FROM referrals WHERE referrer_id = ?""",
            (user_id,)
        ).fetchone()

        user_data = conn.execute(
            "SELECT referral_code, locked_bonus, first_referral_completed FROM users WHERE id = ?",
            (user_id,)
        ).fetchone()

    return {
        "referral_code": user_data["referral_code"],
        "locked_bonus": user_data["locked_bonus"],
        "first_referral_completed": bool(user_data["first_referral_completed"]),
        "stats": dict(stats),
        "referrals": [dict(r) for r in referrals]
    }
