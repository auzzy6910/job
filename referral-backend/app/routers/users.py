import uuid
from fastapi import APIRouter, HTTPException, Depends
from app.models import UserSignup, UserLogin, ActivateAccount
from app.database import get_db
from app.auth import hash_password, verify_password, create_token, get_current_user

router = APIRouter(prefix="/api/users", tags=["users"])

@router.post("/signup")
def signup(data: UserSignup):
    referral_code = uuid.uuid4().hex[:8].upper()
    password_hash = hash_password(data.password)

    with get_db() as conn:
        # Check if user exists
        existing = conn.execute(
            "SELECT id FROM users WHERE email = ? OR username = ?",
            (data.email, data.username)
        ).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="Email or username already exists")

        referred_by = None
        if data.referral_code:
            referrer = conn.execute(
                "SELECT id FROM users WHERE referral_code = ?",
                (data.referral_code,)
            ).fetchone()
            if not referrer:
                raise HTTPException(status_code=400, detail="Invalid referral code")
            referred_by = referrer["id"]

        cursor = conn.execute(
            """INSERT INTO users (username, email, password_hash, referral_code, referred_by, locked_bonus)
               VALUES (?, ?, ?, ?, ?, 200.0)""",
            (data.username, data.email, password_hash, referral_code, referred_by)
        )
        user_id = cursor.lastrowid

        # Create referral record
        if referred_by:
            conn.execute(
                "INSERT INTO referrals (referrer_id, referred_id) VALUES (?, ?)",
                (referred_by, user_id)
            )

        # Log signup bonus transaction (locked)
        conn.execute(
            "INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)",
            (user_id, 200.0, "signup_bonus", "Signup bonus (locked until referral task completed)")
        )

        token = create_token(user_id, data.username)

    return {
        "message": "Account created successfully! You have 200 KES locked bonus. Activate your account (50 KES) and invite a friend to unlock it.",
        "token": token,
        "user_id": user_id,
        "referral_code": referral_code,
        "locked_bonus": 200.0
    }

@router.post("/login")
def login(data: UserLogin):
    with get_db() as conn:
        user = conn.execute(
            "SELECT * FROM users WHERE email = ?",
            (data.email,)
        ).fetchone()
        if not user or not verify_password(data.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        token = create_token(user["id"], user["username"])

    return {
        "token": token,
        "user_id": user["id"],
        "username": user["username"],
        "referral_code": user["referral_code"],
        "is_activated": bool(user["is_activated"]),
        "balance": user["balance"],
        "locked_bonus": user["locked_bonus"]
    }

@router.post("/activate")
def activate_account(user: dict = Depends(get_current_user)):
    user_id = user["user_id"]
    with get_db() as conn:
        u = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        if not u:
            raise HTTPException(status_code=404, detail="User not found")
        if u["is_activated"]:
            raise HTTPException(status_code=400, detail="Account already activated")
        if u["balance"] < 50:
            raise HTTPException(status_code=400, detail="Insufficient balance. You need 50 KES to activate.")

        conn.execute(
            "UPDATE users SET balance = balance - 50, is_activated = 1 WHERE id = ?",
            (user_id,)
        )
        conn.execute(
            "INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)",
            (user_id, -50.0, "activation_fee", "Account activation fee")
        )

    return {"message": "Account activated successfully!", "activation_fee": 50.0}

@router.get("/me")
def get_profile(user: dict = Depends(get_current_user)):
    user_id = user["user_id"]
    with get_db() as conn:
        u = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        if not u:
            raise HTTPException(status_code=404, detail="User not found")

        referral_count = conn.execute(
            "SELECT COUNT(*) as count FROM referrals WHERE referrer_id = ?",
            (user_id,)
        ).fetchone()["count"]

        total_earned = conn.execute(
            "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND amount > 0",
            (user_id,)
        ).fetchone()["total"]

    return {
        "id": u["id"],
        "username": u["username"],
        "email": u["email"],
        "referral_code": u["referral_code"],
        "is_activated": bool(u["is_activated"]),
        "balance": u["balance"],
        "locked_bonus": u["locked_bonus"],
        "total_referrals": referral_count,
        "first_referral_completed": bool(u["first_referral_completed"]),
        "total_earned": total_earned,
        "created_at": u["created_at"]
    }

@router.get("/transactions")
def get_transactions(user: dict = Depends(get_current_user)):
    user_id = user["user_id"]
    with get_db() as conn:
        txns = conn.execute(
            "SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
            (user_id,)
        ).fetchall()

    return [dict(t) for t in txns]

@router.post("/deposit")
def deposit(amount: float, user: dict = Depends(get_current_user)):
    user_id = user["user_id"]
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    with get_db() as conn:
        conn.execute(
            "UPDATE users SET balance = balance + ? WHERE id = ?",
            (amount, user_id)
        )
        conn.execute(
            "INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)",
            (user_id, amount, "deposit", f"Deposit of {amount} KES")
        )

        # Check if this user was referred and deposit is >= 200
        u = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        if u["referred_by"] and amount >= 200:
            referral = conn.execute(
                "SELECT * FROM referrals WHERE referrer_id = ? AND referred_id = ? AND deposit_made = 0",
                (u["referred_by"], user_id)
            ).fetchone()
            if referral:
                conn.execute(
                    "UPDATE referrals SET deposit_made = 1 WHERE id = ?",
                    (referral["id"],)
                )

                # Check if this is the referrer's first completed referral
                referrer = conn.execute(
                    "SELECT * FROM users WHERE id = ?", (u["referred_by"],)
                ).fetchone()

                if not referrer["first_referral_completed"]:
                    # First referral: unlock 200 KES bonus
                    bonus = 200.0
                    conn.execute(
                        "UPDATE users SET balance = balance + locked_bonus, locked_bonus = 0, first_referral_completed = 1, total_referrals = total_referrals + 1 WHERE id = ?",
                        (u["referred_by"],)
                    )
                    conn.execute(
                        "UPDATE referrals SET bonus_paid = 1, amount_paid = ? WHERE id = ?",
                        (bonus, referral["id"])
                    )
                    conn.execute(
                        "INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)",
                        (u["referred_by"], bonus, "referral_bonus", f"First referral bonus unlocked - 200 KES from {u['username']}")
                    )
                else:
                    # Subsequent referrals: 100 KES each
                    bonus = 100.0
                    conn.execute(
                        "UPDATE users SET balance = balance + ?, total_referrals = total_referrals + 1 WHERE id = ?",
                        (bonus, u["referred_by"])
                    )
                    conn.execute(
                        "UPDATE referrals SET bonus_paid = 1, amount_paid = ? WHERE id = ?",
                        (bonus, referral["id"])
                    )
                    conn.execute(
                        "INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)",
                        (u["referred_by"], bonus, "referral_bonus", f"Referral bonus - 100 KES from {u['username']}")
                    )

    return {"message": f"Deposited {amount} KES successfully"}

@router.post("/withdraw")
def withdraw(amount: float, user: dict = Depends(get_current_user)):
    user_id = user["user_id"]
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    with get_db() as conn:
        u = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        if not u:
            raise HTTPException(status_code=404, detail="User not found")
        if u["balance"] < amount:
            raise HTTPException(status_code=400, detail="Insufficient balance")

        conn.execute(
            "UPDATE users SET balance = balance - ? WHERE id = ?",
            (amount, user_id)
        )
        conn.execute(
            "INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)",
            (user_id, -amount, "withdrawal", f"Withdrawal of {amount} KES")
        )

    return {"message": f"Withdrawn {amount} KES successfully"}
