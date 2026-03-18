from fastapi import APIRouter, HTTPException, Depends
from app.database import get_db
from app.auth import get_current_user

router = APIRouter(prefix="/api/microtasks", tags=["microtasks"])

@router.get("/")
def list_tasks(user: dict = Depends(get_current_user)):
    user_id = user["user_id"]

    with get_db() as conn:
        u = conn.execute("SELECT is_activated FROM users WHERE id = ?", (user_id,)).fetchone()
        if not u or not u["is_activated"]:
            raise HTTPException(
                status_code=403,
                detail="You must activate your account (50 KES) to access microtasks"
            )

        tasks = conn.execute(
            "SELECT * FROM microtasks WHERE is_active = 1",
        ).fetchall()

        completed = conn.execute(
            "SELECT task_id FROM microtask_completions WHERE user_id = ?",
            (user_id,)
        ).fetchall()
        completed_ids = {c["task_id"] for c in completed}

    return {
        "tasks": [
            {**dict(t), "completed": t["id"] in completed_ids}
            for t in tasks
        ]
    }

@router.post("/{task_id}/complete")
def complete_task(task_id: int, user: dict = Depends(get_current_user)):
    user_id = user["user_id"]

    with get_db() as conn:
        u = conn.execute("SELECT is_activated FROM users WHERE id = ?", (user_id,)).fetchone()
        if not u or not u["is_activated"]:
            raise HTTPException(status_code=403, detail="Account not activated")

        task = conn.execute(
            "SELECT * FROM microtasks WHERE id = ? AND is_active = 1",
            (task_id,)
        ).fetchone()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        existing = conn.execute(
            "SELECT id FROM microtask_completions WHERE user_id = ? AND task_id = ?",
            (user_id, task_id)
        ).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="Task already completed")

        conn.execute(
            "INSERT INTO microtask_completions (user_id, task_id) VALUES (?, ?)",
            (user_id, task_id)
        )
        conn.execute(
            "UPDATE users SET balance = balance + ? WHERE id = ?",
            (task["reward"], user_id)
        )
        conn.execute(
            "INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)",
            (user_id, task["reward"], "microtask", f"Completed task: {task['title']} - {task['reward']} KES")
        )

    return {"message": f"Task completed! Earned {task['reward']} KES", "reward": task["reward"]}
