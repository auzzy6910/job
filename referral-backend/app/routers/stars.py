import random
import datetime
from fastapi import APIRouter, HTTPException, Depends
from app.database import get_db
from app.auth import get_current_user
from app.models import StarGiftRequest

router = APIRouter(prefix="/api/stars", tags=["stars"])

@router.post("/collect")
def collect_daily_star(user: dict = Depends(get_current_user)):
    user_id = user["user_id"]
    today = datetime.date.today().isoformat()
    now = datetime.datetime.utcnow()

    with get_db() as conn:
        # Check if already collected today
        existing = conn.execute(
            "SELECT id FROM stars WHERE user_id = ? AND DATE(collected_at) = ?",
            (user_id, today)
        ).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="You already collected your star today!")

        # Random star value 1-5 KES
        star_value = random.randint(1, 5)
        expires_at = now + datetime.timedelta(hours=3)

        conn.execute(
            "INSERT INTO stars (user_id, value, collected_at, expires_at) VALUES (?, ?, ?, ?)",
            (user_id, star_value, now.isoformat(), expires_at.isoformat())
        )

    return {
        "star_value": star_value,
        "expires_at": expires_at.isoformat(),
        "message": f"You collected a star worth {star_value} KES! Claim it before it expires in 3 hours."
    }

@router.post("/claim")
def claim_star(user: dict = Depends(get_current_user)):
    user_id = user["user_id"]
    now = datetime.datetime.utcnow().isoformat()

    with get_db() as conn:
        # Find unclaimed, non-expired stars
        stars = conn.execute(
            "SELECT * FROM stars WHERE user_id = ? AND claimed = 0 AND expires_at > ?",
            (user_id, now)
        ).fetchall()

        if not stars:
            raise HTTPException(status_code=400, detail="No claimable stars available. Stars expire after 3 hours!")

        total = 0
        for star in stars:
            total += star["value"]
            conn.execute("UPDATE stars SET claimed = 1 WHERE id = ?", (star["id"],))

        conn.execute(
            "UPDATE users SET balance = balance + ? WHERE id = ?",
            (total, user_id)
        )
        conn.execute(
            "INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)",
            (user_id, total, "star_claim", f"Claimed {len(stars)} star(s) worth {total} KES")
        )

    return {"claimed": total, "stars_count": len(stars), "message": f"Claimed {total} KES from {len(stars)} star(s)!"}

@router.get("/status")
def star_status(user: dict = Depends(get_current_user)):
    user_id = user["user_id"]
    now = datetime.datetime.utcnow().isoformat()
    today = datetime.date.today().isoformat()

    with get_db() as conn:
        collected_today = conn.execute(
            "SELECT * FROM stars WHERE user_id = ? AND DATE(collected_at) = ?",
            (user_id, today)
        ).fetchone()

        unclaimed = conn.execute(
            "SELECT * FROM stars WHERE user_id = ? AND claimed = 0 AND expires_at > ?",
            (user_id, now)
        ).fetchall()

        history = conn.execute(
            "SELECT * FROM stars WHERE user_id = ? ORDER BY collected_at DESC LIMIT 10",
            (user_id,)
        ).fetchall()

    return {
        "collected_today": collected_today is not None,
        "today_star": dict(collected_today) if collected_today else None,
        "unclaimed_stars": [dict(s) for s in unclaimed],
        "history": [dict(h) for h in history]
    }

@router.post("/gift")
def gift_star(data: StarGiftRequest, user: dict = Depends(get_current_user)):
    sender_id = user["user_id"]

    if data.star_value < 1 or data.star_value > 5:
        raise HTTPException(status_code=400, detail="Star value must be between 1 and 5 KES")

    with get_db() as conn:
        sender = conn.execute("SELECT * FROM users WHERE id = ?", (sender_id,)).fetchone()
        if sender["balance"] < data.star_value:
            raise HTTPException(status_code=400, detail="Insufficient balance to gift star")

        receiver = conn.execute(
            "SELECT * FROM users WHERE username = ?",
            (data.receiver_username,)
        ).fetchone()
        if not receiver:
            raise HTTPException(status_code=404, detail="Receiver not found")
        if receiver["id"] == sender_id:
            raise HTTPException(status_code=400, detail="Cannot gift stars to yourself")

        # Deduct from sender
        conn.execute("UPDATE users SET balance = balance - ? WHERE id = ?", (data.star_value, sender_id))
        # Add to receiver
        conn.execute("UPDATE users SET balance = balance + ? WHERE id = ?", (data.star_value, receiver["id"]))

        # Record gift
        conn.execute(
            "INSERT INTO star_gifts (sender_id, receiver_id, star_value) VALUES (?, ?, ?)",
            (sender_id, receiver["id"], data.star_value)
        )
        conn.execute(
            "INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)",
            (sender_id, -data.star_value, "star_gift_sent", f"Gifted {data.star_value} KES star to {data.receiver_username}")
        )
        conn.execute(
            "INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)",
            (receiver["id"], data.star_value, "star_gift_received", f"Received {data.star_value} KES star from {sender['username']}")
        )

    return {"message": f"Successfully gifted {data.star_value} KES star to {data.receiver_username}!"}

@router.get("/gifts")
def get_gift_dashboard(user: dict = Depends(get_current_user)):
    user_id = user["user_id"]

    with get_db() as conn:
        sent = conn.execute(
            """SELECT sg.*, u.username as receiver_name
               FROM star_gifts sg JOIN users u ON u.id = sg.receiver_id
               WHERE sg.sender_id = ? ORDER BY sg.created_at DESC LIMIT 20""",
            (user_id,)
        ).fetchall()

        received = conn.execute(
            """SELECT sg.*, u.username as sender_name
               FROM star_gifts sg JOIN users u ON u.id = sg.sender_id
               WHERE sg.receiver_id = ? ORDER BY sg.created_at DESC LIMIT 20""",
            (user_id,)
        ).fetchall()

        total_sent = conn.execute(
            "SELECT COALESCE(SUM(star_value), 0) as total FROM star_gifts WHERE sender_id = ?",
            (user_id,)
        ).fetchone()["total"]

        total_received = conn.execute(
            "SELECT COALESCE(SUM(star_value), 0) as total FROM star_gifts WHERE receiver_id = ?",
            (user_id,)
        ).fetchone()["total"]

    return {
        "sent": [dict(s) for s in sent],
        "received": [dict(r) for r in received],
        "total_sent": total_sent,
        "total_received": total_received
    }
