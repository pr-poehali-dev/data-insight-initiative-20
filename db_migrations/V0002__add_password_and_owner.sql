
ALTER TABLE wave_users ADD COLUMN IF NOT EXISTS password_hash TEXT NOT NULL DEFAULT '';

INSERT INTO wave_users (id, name, username, phone, avatar, description, is_admin, is_online, badges, password_hash)
VALUES (
  'admin-owner',
  'Админ',
  '@owner',
  '+79270333319',
  '👑',
  'Основатель 19 Wave 🌊',
  TRUE,
  FALSE,
  ARRAY['Основатель','Разработчик'],
  ''
) ON CONFLICT (phone) DO UPDATE SET is_admin = TRUE;
