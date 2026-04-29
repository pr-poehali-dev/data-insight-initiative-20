
CREATE TABLE IF NOT EXISTS wave_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  avatar TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  is_banned BOOLEAN NOT NULL DEFAULT FALSE,
  is_online BOOLEAN NOT NULL DEFAULT FALSE,
  rainbow_nick BOOLEAN NOT NULL DEFAULT FALSE,
  badges TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wave_messages (
  id TEXT PRIMARY KEY,
  from_user_id TEXT NOT NULL REFERENCES wave_users(id),
  to_user_id TEXT NOT NULL REFERENCES wave_users(id),
  text TEXT NOT NULL,
  is_voice BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wave_messages_pair ON wave_messages (
  LEAST(from_user_id, to_user_id),
  GREATEST(from_user_id, to_user_id),
  created_at
);

INSERT INTO wave_users (id, name, username, phone, avatar, description, is_admin, is_online, badges)
VALUES (
  'admin-001',
  'Админ',
  '@admin',
  '+79000000000',
  'А',
  'Основатель 19 Wave 🌊',
  TRUE,
  TRUE,
  ARRAY['Основатель','Разработчик']
) ON CONFLICT (id) DO NOTHING;
