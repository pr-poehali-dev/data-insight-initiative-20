"""
Управление пользователями 19 Wave.
POST / — action: list | get | update_me | admin_action
"""
import json
import os
import psycopg2


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id",
}


def ok(data):
    return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, ensure_ascii=False, default=str)}


def err(msg, code=400):
    return {"statusCode": code, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg}, ensure_ascii=False)}


def _row_to_user(row):
    return {
        "id": row[0], "name": row[1], "username": row[2],
        "phone": row[3], "avatar": row[4], "description": row[5] or "",
        "isAdmin": row[6], "isBanned": row[7], "isOnline": row[8],
        "rainbowNick": row[9], "badges": list(row[10] or []),
    }


SELECT_FIELDS = "id,name,username,phone,avatar,description,is_admin,is_banned,is_online,rainbow_nick,badges"


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    headers = event.get("headers") or {}
    uid = headers.get("X-User-Id", "")
    body = json.loads(event.get("body") or "{}")
    action = body.get("action", "list")

    conn = get_conn()
    cur = conn.cursor()

    try:
        if action == "list":
            cur.execute(
                f"SELECT {SELECT_FIELDS} FROM wave_users WHERE is_banned=FALSE ORDER BY is_online DESC, name"
            )
            return ok([_row_to_user(r) for r in cur.fetchall()])

        elif action == "get":
            target_id = body.get("target_id", "")
            cur.execute(f"SELECT {SELECT_FIELDS} FROM wave_users WHERE id=%s", (target_id,))
            row = cur.fetchone()
            if not row:
                return err("Пользователь не найден", 404)
            return ok(_row_to_user(row))

        elif action == "update_me":
            if not uid:
                return err("Не авторизован", 401)
            name = body.get("name")
            avatar = body.get("avatar")
            description = body.get("description")
            updates = []
            vals = []
            if name is not None:
                updates.append("name=%s")
                vals.append(name.strip())
            if avatar is not None:
                updates.append("avatar=%s")
                vals.append(avatar.strip()[:2])
            if description is not None:
                updates.append("description=%s")
                vals.append(description.strip())
            if not updates:
                return err("Нечего обновлять")
            vals.append(uid)
            cur.execute(
                f"UPDATE wave_users SET {', '.join(updates)} WHERE id=%s RETURNING {SELECT_FIELDS}",
                vals
            )
            row = cur.fetchone()
            conn.commit()
            return ok(_row_to_user(row))

        elif action in ("ban", "unban", "rainbow_on", "rainbow_off", "add_badge", "remove_badge"):
            cur.execute("SELECT is_admin FROM wave_users WHERE id=%s", (uid,))
            admin_row = cur.fetchone()
            if not admin_row or not admin_row[0]:
                return err("Нет прав", 403)

            target_id = body.get("target_id")
            if not target_id:
                return err("target_id required")

            if action == "ban":
                cur.execute("UPDATE wave_users SET is_banned=TRUE WHERE id=%s", (target_id,))
            elif action == "unban":
                cur.execute("UPDATE wave_users SET is_banned=FALSE WHERE id=%s", (target_id,))
            elif action == "rainbow_on":
                cur.execute("UPDATE wave_users SET rainbow_nick=TRUE WHERE id=%s", (target_id,))
            elif action == "rainbow_off":
                cur.execute("UPDATE wave_users SET rainbow_nick=FALSE WHERE id=%s", (target_id,))
            elif action == "add_badge":
                badge = body.get("badge", "").strip()
                if not badge:
                    return err("badge required")
                cur.execute(
                    "UPDATE wave_users SET badges = array_append(badges, %s) WHERE id=%s AND NOT (%s = ANY(badges))",
                    (badge, target_id, badge)
                )
            elif action == "remove_badge":
                badge = body.get("badge", "").strip()
                cur.execute(
                    "UPDATE wave_users SET badges = array_remove(badges, %s) WHERE id=%s",
                    (badge, target_id)
                )

            conn.commit()
            cur.execute(f"SELECT {SELECT_FIELDS} FROM wave_users WHERE id=%s", (target_id,))
            row = cur.fetchone()
            return ok(_row_to_user(row))

        return err("Неизвестный action", 404)
    finally:
        cur.close()
        conn.close()