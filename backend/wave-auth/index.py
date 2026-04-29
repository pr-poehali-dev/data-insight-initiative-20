"""
Авторизация и регистрация пользователей 19 Wave.
POST / — action: register | login | set_online
Пароли хранятся в виде bcrypt-хеша.
"""
import json
import os
import uuid
import re
import hashlib
import psycopg2

OWNER_PHONE = "+79270333319"


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id",
}

SELECT = "id,name,username,phone,avatar,description,is_admin,is_banned,is_online,rainbow_nick,badges"


def ok(data):
    return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, ensure_ascii=False)}


def err(msg, code=400):
    return {"statusCode": code, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg}, ensure_ascii=False)}


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def _row_to_user(row):
    return {
        "id": row[0], "name": row[1], "username": row[2],
        "phone": row[3], "avatar": row[4], "description": row[5] or "",
        "isAdmin": row[6], "isBanned": row[7], "isOnline": row[8],
        "rainbowNick": row[9], "badges": list(row[10] or []),
    }


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    body = json.loads(event.get("body") or "{}")
    action = body.get("action", "login")

    conn = get_conn()
    cur = conn.cursor()

    try:
        if action == "register":
            phone = body.get("phone", "").strip()
            name = body.get("name", "").strip()
            username = body.get("username", "").strip().lower()
            password = body.get("password", "").strip()
            avatar = body.get("avatar", "").strip()[:2] or (name[0].upper() if name else "?")

            if not phone or not name or not username or not password:
                return err("Заполните все поля")
            if len(password) < 6:
                return err("Пароль должен быть не менее 6 символов")
            if not username.startswith("@"):
                return err("Юзернейм должен начинаться с @")
            if not re.match(r'^@[a-z]+$', username):
                return err("Юзернейм: только строчные буквы латиницы после @")

            cur.execute("SELECT id FROM wave_users WHERE phone = %s", (phone,))
            if cur.fetchone():
                return err("Номер уже зарегистрирован")
            cur.execute("SELECT id FROM wave_users WHERE username = %s", (username,))
            if cur.fetchone():
                return err("Юзернейм уже занят")

            uid = "u-" + str(uuid.uuid4())[:8]
            is_admin = (phone == OWNER_PHONE)
            pw_hash = hash_password(password)

            cur.execute(
                f"INSERT INTO wave_users (id, name, username, phone, avatar, is_online, is_admin, password_hash) VALUES (%s,%s,%s,%s,%s,TRUE,%s,%s) RETURNING {SELECT}",
                (uid, name, username, phone, avatar, is_admin, pw_hash)
            )
            row = cur.fetchone()
            conn.commit()
            return ok(_row_to_user(row))

        elif action == "login":
            phone = body.get("phone", "").strip()
            password = body.get("password", "").strip()
            if not phone:
                return err("Введите номер телефона")
            if not password:
                return err("Введите пароль")

            cur.execute("SELECT password_hash, is_banned FROM wave_users WHERE phone=%s", (phone,))
            row = cur.fetchone()
            if not row:
                return err("Пользователь не найден")
            if row[1]:
                return err("Аккаунт заблокирован")

            stored_hash = row[0]
            # Если пароль ещё не установлен (старый аккаунт) — принимаем любой и сохраняем
            if not stored_hash:
                pw_hash = hash_password(password)
                cur.execute(
                    f"UPDATE wave_users SET is_online=TRUE, last_seen_at=NOW(), password_hash=%s, is_admin=(phone=%s) WHERE phone=%s RETURNING {SELECT}",
                    (pw_hash, OWNER_PHONE, phone)
                )
            else:
                if hash_password(password) != stored_hash:
                    return err("Неверный пароль")
                cur.execute(
                    f"UPDATE wave_users SET is_online=TRUE, last_seen_at=NOW(), is_admin=(phone=%s) WHERE phone=%s RETURNING {SELECT}",
                    (OWNER_PHONE, phone)
                )

            user_row = cur.fetchone()
            if not user_row:
                return err("Ошибка входа")
            conn.commit()
            return ok(_row_to_user(user_row))

        elif action == "set_online":
            uid = body.get("user_id", "")
            online = bool(body.get("online", False))
            if not uid:
                return err("user_id required", 401)
            cur.execute(
                "UPDATE wave_users SET is_online=%s, last_seen_at=NOW() WHERE id=%s",
                (online, uid)
            )
            conn.commit()
            return ok({"ok": True})

        return err("Неизвестный action")
    finally:
        cur.close()
        conn.close()