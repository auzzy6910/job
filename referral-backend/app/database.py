import sqlite3
import os
from contextlib import contextmanager

DB_PATH = os.getenv("DATABASE_PATH", "/data/app.db")

def get_db_path():
    db_dir = os.path.dirname(DB_PATH)
    if db_dir and not os.path.exists(db_dir):
        os.makedirs(db_dir, exist_ok=True)
    return DB_PATH

def get_connection():
    conn = sqlite3.connect(get_db_path())
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn

@contextmanager
def get_db():
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db():
    with get_db() as conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            referral_code TEXT UNIQUE NOT NULL,
            referred_by INTEGER REFERENCES users(id),
            is_activated INTEGER DEFAULT 0,
            balance REAL DEFAULT 0.0,
            locked_bonus REAL DEFAULT 200.0,
            total_referrals INTEGER DEFAULT 0,
            first_referral_completed INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS referrals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            referrer_id INTEGER NOT NULL REFERENCES users(id),
            referred_id INTEGER NOT NULL REFERENCES users(id),
            deposit_made INTEGER DEFAULT 0,
            bonus_paid INTEGER DEFAULT 0,
            amount_paid REAL DEFAULT 0.0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id),
            amount REAL NOT NULL,
            type TEXT NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS spin_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id),
            amount REAL NOT NULL,
            spun_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS stars (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id),
            value REAL NOT NULL,
            collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP NOT NULL,
            claimed INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS star_gifts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_id INTEGER NOT NULL REFERENCES users(id),
            receiver_id INTEGER NOT NULL REFERENCES users(id),
            star_value REAL NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS microtasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            reward REAL NOT NULL,
            is_active INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS microtask_completions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id),
            task_id INTEGER NOT NULL REFERENCES microtasks(id),
            completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, task_id)
        );

        CREATE TABLE IF NOT EXISTS boosters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id),
            amount REAL NOT NULL DEFAULT 200.0,
            deposited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            withdrawable_at TIMESTAMP NOT NULL,
            withdrawn INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS daily_credits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id),
            amount REAL NOT NULL,
            claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS diamond_draw_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id),
            month TEXT NOT NULL,
            entered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, month)
        );

        CREATE TABLE IF NOT EXISTS diamond_draw_winners (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id),
            month TEXT NOT NULL UNIQUE,
            amount REAL DEFAULT 20000.0,
            won_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Seed microtasks if empty
        INSERT OR IGNORE INTO microtasks (id, title, description, reward) VALUES
            (1, 'Watch Video Ad', 'Watch a short promotional video to earn rewards', 5.0),
            (2, 'Complete Survey', 'Answer a quick 5-question survey', 10.0),
            (3, 'Share on Social Media', 'Share our platform link on any social media', 15.0),
            (4, 'Rate Our App', 'Leave a rating and review for our platform', 8.0),
            (5, 'Daily Check-in', 'Log in and check in to earn daily bonus', 3.0),
            (6, 'Invite Friend Challenge', 'Send invitation to 3 friends via SMS or WhatsApp', 20.0),
            (7, 'Profile Completion', 'Complete all profile fields for a bonus', 12.0),
            (8, 'Newsletter Signup', 'Subscribe to our weekly newsletter', 5.0);
        """)
