"""
Сообщения 19 Wave.
POST / — action: get_chats | get_messages | send
"""
import json
import os
import uuid
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


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    headers = event.get("headers") or {}
    uid = headers.get("X-User-Id", "")
    body = json.loads(event.get("body") or "{}")
    action = body.get("action", "get_chats")

    if not uid:
        return err("Не авторизован", 401)

    conn = get_conn()
    cur = conn.cursor()

    try:
        if action == "get_chats":
            cur.execute("""
                SELECT DISTINCT ON (partner_id)
                    partner_id,
                    u.name, u.username, u.avatar, u.is_online, u.rainbow_nick, u.badges,
                    m.id, m.text, m.is_voice, m.created_at, m.from_user_id
                FROM (
                    SELECT CASE WHEN from_user_id=%s THEN to_user_id ELSE from_user_id END as partner_id,
                           id, text, is_voice, created_at, from_user_id
                    FROM wave_messages
                    WHERE from_user_id=%s OR to_user_id=%s
                ) m
                JOIN wave_users u ON u.id=m.partner_id
                WHERE NOT u.is_banned
                ORDER BY partner_id, m.created_at DESC
            """, (uid, uid, uid))

            chats = []
            for row in cur.fetchall():
                partner_id, name, username, avatar, is_online, rainbow_nick, badges, \
                    msg_id, text, is_voice, created_at, from_uid = row
                chats.append({
                    "partnerId": partner_id,
                    "partnerName": name,
                    "partnerUsername": username,
                    "partnerAvatar": avatar,
                    "isOnline": is_online,
                    "rainbowNick": rainbow_nick,
                    "badges": list(badges or []),
                    "lastMessage": ("🎤 Голосовое" if is_voice else text),
                    "lastTime": created_at.strftime("%H:%M") if created_at else "",
                    "lastTs": created_at.isoformat() if created_at else "",
                    "isMine": from_uid == uid,
                    "unread": 0,
                })
            chats.sort(key=lambda c: c["lastTs"], reverse=True)
            return ok(chats)

        elif action == "get_messages":
            partner_id = body.get("partner_id", "")
            if not partner_id:
                return err("partner_id required")
            cur.execute("""
                SELECT id, from_user_id, text, is_voice, created_at
                FROM wave_messages
                WHERE (from_user_id=%s AND to_user_id=%s)
                   OR (from_user_id=%s AND to_user_id=%s)
                ORDER BY created_at ASC
                LIMIT 100
            """, (uid, partner_id, partner_id, uid))
            msgs = []
            for row in cur.fetchall():
                mid, from_id, text, is_voice, created_at = row
                msgs.append({
                    "id": mid,
                    "from": from_id,
                    "text": text,
                    "isVoice": is_voice,
                    "time": created_at.strftime("%H:%M") if created_at else "",
                })
            return ok(msgs)

        elif action == "send":
            to_id = body.get("to_user_id", "").strip()
            text = body.get("text", "").strip()
            is_voice = bool(body.get("is_voice", False))
            if not to_id:
                return err("to_user_id required")
            if not text and not is_voice:
                return err("text required")
            if is_voice:
                text = "🎤 Голосовое сообщение (0:03)"

            cur.execute("SELECT id, is_banned FROM wave_users WHERE id=%s", (to_id,))
            target = cur.fetchone()
            if not target:
                return err("Получатель не найден", 404)
            if target[1]:
                return err("Нельзя писать заблокированному пользователю")

            mid = "m-" + str(uuid.uuid4())[:8]
            cur.execute(
                "INSERT INTO wave_messages (id, from_user_id, to_user_id, text, is_voice) VALUES (%s,%s,%s,%s,%s) RETURNING id, from_user_id, text, is_voice, created_at",
                (mid, uid, to_id, text, is_voice)
            )
            row = cur.fetchone()
            conn.commit()
            return ok({
                "id": row[0],
                "from": row[1],
                "text": row[2],
                "isVoice": row[3],
                "time": row[4].strftime("%H:%M"),
            })

        return err("Неизвестный action", 404)
    finally:
        cur.close()
        conn.close()