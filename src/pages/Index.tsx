import { useState } from "react";
import Icon from "@/components/ui/icon";

// ─── TYPES ───────────────────────────────────────────────────────────────────
type Screen =
  | "auth"
  | "chats"
  | "contacts"
  | "ai"
  | "admin"
  | "settings"
  | "chat-open"
  | "profile-view";

interface User {
  id: string;
  name: string;
  username: string;
  phone: string;
  avatar: string;
  description: string;
  isAdmin?: boolean;
  isBanned?: boolean;
  isOnline?: boolean;
  rainbowNick?: boolean;
  badges: string[];
}

interface Message {
  id: string;
  from: string;
  text: string;
  time: string;
  isVoice?: boolean;
}

interface Chat {
  id: string;
  user: User;
  messages: Message[];
  lastMessage: string;
  lastTime: string;
  unread: number;
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const ADMIN_ID = "admin-001";

const mockUsers: User[] = [
  {
    id: ADMIN_ID,
    name: "Админ",
    username: "@admin",
    phone: "+79000000000",
    avatar: "А",
    description: "Основатель 19 Wave 🌊",
    isAdmin: true,
    isOnline: true,
    rainbowNick: false,
    badges: ["Основатель", "Разработчик"],
  },
  {
    id: "u-002",
    name: "Лена Смирнова",
    username: "@lena",
    phone: "+79111111111",
    avatar: "Л",
    description: "Всем привет!",
    isOnline: true,
    rainbowNick: false,
    badges: ["Ранний пользователь"],
  },
  {
    id: "u-003",
    name: "Максим Орлов",
    username: "@maxim",
    phone: "+79222222222",
    avatar: "М",
    description: "На волне 🏄",
    isOnline: false,
    rainbowNick: true,
    badges: ["Активист"],
  },
  {
    id: "u-004",
    name: "Аня Петрова",
    username: "@anya",
    phone: "+79333333333",
    avatar: "А",
    description: "Дизайнер интерфейсов",
    isOnline: true,
    rainbowNick: false,
    badges: [],
  },
];

const mockChats: Chat[] = [
  {
    id: "c-002",
    user: mockUsers[1],
    messages: [
      { id: "m1", from: "u-002", text: "Привет! Как дела?", time: "14:22" },
      { id: "m2", from: ADMIN_ID, text: "Всё отлично, спасибо!", time: "14:23" },
      { id: "m3", from: "u-002", text: "Круто! Уже попробовал 19 Wave?", time: "14:24" },
    ],
    lastMessage: "Круто! Уже попробовал 19 Wave?",
    lastTime: "14:24",
    unread: 1,
  },
  {
    id: "c-003",
    user: mockUsers[2],
    messages: [
      { id: "m4", from: "u-003", text: "Го в волну 🌊", time: "12:00" },
      { id: "m5", from: ADMIN_ID, text: "Погнали!", time: "12:01" },
    ],
    lastMessage: "Погнали!",
    lastTime: "12:01",
    unread: 0,
  },
  {
    id: "c-004",
    user: mockUsers[3],
    messages: [
      { id: "m6", from: "u-004", text: "Привет! Можешь выдать бейдж?", time: "09:15" },
    ],
    lastMessage: "Привет! Можешь выдать бейдж?",
    lastTime: "09:15",
    unread: 1,
  },
];

const BADGES_POOL = [
  "Ранний пользователь",
  "Активист",
  "Разработчик",
  "Основатель",
  "Звезда",
  "Помощник",
  "VIP",
  "Легенда",
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const avatarColors = [
  "bg-[#5865f2]",
  "bg-[#57f287]",
  "bg-[#eb459e]",
  "bg-[#fee75c]",
  "bg-[#ed4245]",
  "bg-[#3ba55c]",
];

function avatarColor(id: string) {
  const idx = id.charCodeAt(id.length - 1) % avatarColors.length;
  return avatarColors[idx];
}

function RainbowText({ text }: { text: string }) {
  return (
    <span
      style={{
        background:
          "linear-gradient(90deg,#ff0080,#ff8c00,#ffe600,#00ff88,#00cfff,#a855f7,#ff0080)",
        backgroundSize: "200%",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        animation: "rainbow 3s linear infinite",
      }}
    >
      {text}
    </span>
  );
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }: { onAuth: (u: User) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("");
  const [error, setError] = useState("");

  function submit() {
    setError("");
    if (!phone.trim()) return setError("Введите номер телефона");
    if (mode === "register") {
      if (!name.trim()) return setError("Введите имя");
      if (!username.startsWith("@"))
        return setError("Юзернейм должен начинаться с @");
      if (!/^@[a-z]+$/.test(username))
        return setError("Юзернейм: только строчные буквы латиницы после @");
      const exists = mockUsers.find((u) => u.username === username);
      if (exists) return setError("Этот юзернейм уже занят");
    }
    const found = mockUsers.find((u) => u.phone === phone);
    if (mode === "login") {
      if (!found) return setError("Пользователь не найден");
      onAuth(found);
    } else {
      const newUser: User = {
        id: "u-" + Date.now(),
        name,
        username,
        phone,
        avatar: avatar || name[0]?.toUpperCase() || "?",
        description: "",
        isOnline: true,
        rainbowNick: false,
        badges: [],
      };
      mockUsers.push(newUser);
      onAuth(newUser);
    }
  }

  return (
    <div className="min-h-screen bg-[#1a1d23] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-[#5865f2] to-[#eb459e] rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-[#5865f2]/30">
            <span className="text-white text-2xl font-black">19</span>
          </div>
          <h1 className="text-white text-2xl font-bold tracking-tight">19 Wave</h1>
          <p className="text-[#8e9297] text-sm mt-1">Мессенджер новой волны</p>
        </div>

        {/* Card */}
        <div className="bg-[#2f3136] rounded-xl p-6 shadow-xl">
          <div className="flex mb-6 bg-[#202225] rounded-lg p-1">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === "login" ? "bg-[#5865f2] text-white" : "text-[#8e9297] hover:text-white"}`}
            >
              Войти
            </button>
            <button
              onClick={() => setMode("register")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === "register" ? "bg-[#5865f2] text-white" : "text-[#8e9297] hover:text-white"}`}
            >
              Регистрация
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide mb-1.5 block">
                Номер телефона
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+7 999 000 00 00"
                className="w-full bg-[#202225] text-white placeholder-[#4f545c] rounded-md px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#5865f2] transition"
              />
            </div>

            {mode === "register" && (
              <>
                <div>
                  <label className="text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide mb-1.5 block">
                    Имя
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Любое имя"
                    className="w-full bg-[#202225] text-white placeholder-[#4f545c] rounded-md px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#5865f2] transition"
                  />
                </div>
                <div>
                  <label className="text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide mb-1.5 block">
                    Юзернейм
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="@username"
                    className="w-full bg-[#202225] text-white placeholder-[#4f545c] rounded-md px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#5865f2] transition"
                  />
                  <p className="text-[#72767d] text-xs mt-1">Только строчные буквы латиницы, начинается с @</p>
                </div>
                <div>
                  <label className="text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide mb-1.5 block">
                    Аватарка (эмодзи или буква)
                  </label>
                  <input
                    type="text"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value.slice(0, 2))}
                    placeholder="😎"
                    className="w-full bg-[#202225] text-white placeholder-[#4f545c] rounded-md px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#5865f2] transition"
                  />
                </div>
              </>
            )}

            {error && (
              <p className="text-[#ed4245] text-xs bg-[#ed4245]/10 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <button
              onClick={submit}
              className="w-full bg-[#5865f2] hover:bg-[#4752c4] text-white font-semibold rounded-md py-2.5 text-sm transition-all mt-2"
            >
              {mode === "login" ? "Войти" : "Зарегистрироваться"}
            </button>
          </div>
        </div>
        <p className="text-center text-[#4f545c] text-xs mt-4">
          19 Wave — мессенджер новой волны 🌊
        </p>
      </div>
    </div>
  );
}

// ─── BOTTOM NAV ───────────────────────────────────────────────────────────────
function BottomNav({
  screen,
  setScreen,
  isAdmin,
  currentUser,
  onProfileClick,
}: {
  screen: Screen;
  setScreen: (s: Screen) => void;
  isAdmin: boolean;
  currentUser: User;
  onProfileClick: () => void;
}) {
  const tabs = [
    { id: "contacts", icon: "Users", label: "Контакты" },
    { id: "chats", icon: "MessageCircle", label: "Чаты" },
    { id: "ai", icon: "Bot", label: "ИИ" },
    ...(isAdmin ? [{ id: "admin", icon: "ShieldCheck", label: "Админ" }] : []),
    { id: "settings", icon: "Settings", label: "Настройки" },
  ];

  return (
    <div className="bg-[#2f3136] border-t border-[#202225] flex items-center px-2 py-1 safe-bottom">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setScreen(tab.id as Screen)}
          className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-lg transition-all ${
            screen === tab.id
              ? "text-[#5865f2]"
              : "text-[#72767d] hover:text-[#b9bbbe]"
          }`}
        >
          <Icon name={tab.icon} size={20} />
          <span className="text-[10px] font-medium">{tab.label}</span>
        </button>
      ))}
      {/* Avatar button */}
      <button
        onClick={onProfileClick}
        className="flex-1 flex flex-col items-center gap-0.5 py-2"
      >
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${avatarColor(currentUser.id)}`}
        >
          {currentUser.avatar}
        </div>
        <span className="text-[10px] font-medium text-[#72767d]">Профиль</span>
      </button>
    </div>
  );
}

// ─── CONTACTS SCREEN ──────────────────────────────────────────────────────────
function ContactsScreen({
  currentUser,
  onOpenChat,
  onViewProfile,
}: {
  currentUser: User;
  onOpenChat: (chat: Chat) => void;
  onViewProfile: (user: User) => void;
}) {
  const others = mockUsers.filter((u) => u.id !== currentUser.id && !u.isBanned);
  const sorted = [...others].sort((a, b) => (b.isOnline ? 1 : 0) - (a.isOnline ? 1 : 0));

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-4 py-3 border-b border-[#202225]">
        <h2 className="text-white font-semibold">Контакты</h2>
        <p className="text-[#8e9297] text-xs mt-0.5">{sorted.filter(u => u.isOnline).length} в сети</p>
      </div>
      <div className="divide-y divide-[#202225]/50">
        {sorted.map((user) => {
          const chat = mockChats.find((c) => c.user.id === user.id);
          return (
            <div
              key={user.id}
              className="flex items-center gap-3 px-4 py-3 hover:bg-[#393c43] transition cursor-pointer"
              onClick={() => onViewProfile(user)}
            >
              <div className="relative flex-shrink-0">
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm ${avatarColor(user.id)}`}
                >
                  {user.avatar}
                </div>
                {user.isOnline && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#3ba55c] rounded-full border-2 border-[#36393f]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {user.rainbowNick ? (
                    <RainbowText text={user.name} />
                  ) : (
                    <span className="text-white text-sm font-medium">{user.name}</span>
                  )}
                </div>
                <p className="text-[#8e9297] text-xs truncate">{user.username}</p>
              </div>
              {chat && (
                <button
                  onClick={(e) => { e.stopPropagation(); onOpenChat(chat); }}
                  className="text-[#5865f2] hover:text-white bg-[#5865f2]/10 hover:bg-[#5865f2] rounded-full p-2 transition"
                >
                  <Icon name="MessageCircle" size={14} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── CHATS SCREEN ─────────────────────────────────────────────────────────────
function ChatsScreen({
  currentUser,
  onOpenChat,
}: {
  currentUser: User;
  onOpenChat: (chat: Chat) => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-4 py-3 border-b border-[#202225] flex items-center justify-between">
        <h2 className="text-white font-semibold">Чаты</h2>
        <button className="text-[#8e9297] hover:text-white transition">
          <Icon name="Search" size={18} />
        </button>
      </div>
      <div className="divide-y divide-[#202225]/50">
        {mockChats
          .filter((c) => !c.user.isBanned)
          .map((chat) => (
            <div
              key={chat.id}
              onClick={() => onOpenChat(chat)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-[#393c43] transition cursor-pointer"
            >
              <div className="relative flex-shrink-0">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${avatarColor(chat.user.id)}`}
                >
                  {chat.user.avatar}
                </div>
                {chat.user.isOnline && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#3ba55c] rounded-full border-2 border-[#36393f]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  {chat.user.rainbowNick ? (
                    <RainbowText text={chat.user.name} />
                  ) : (
                    <span className="text-white text-sm font-semibold">{chat.user.name}</span>
                  )}
                  <span className="text-[#72767d] text-xs">{chat.lastTime}</span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-[#8e9297] text-xs truncate max-w-[200px]">{chat.lastMessage}</p>
                  {chat.unread > 0 && (
                    <span className="bg-[#5865f2] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                      {chat.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

// ─── CHAT OPEN ────────────────────────────────────────────────────────────────
function ChatOpen({
  chat,
  currentUser,
  onBack,
  onViewProfile,
}: {
  chat: Chat;
  currentUser: User;
  onBack: () => void;
  onViewProfile: (user: User) => void;
}) {
  const [messages, setMessages] = useState<Message[]>(chat.messages);
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  function send() {
    if (!input.trim()) return;
    const msg: Message = {
      id: "m-" + Date.now(),
      from: currentUser.id,
      text: input.trim(),
      time: new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, msg]);
    chat.messages.push(msg);
    chat.lastMessage = msg.text;
    chat.lastTime = msg.time;
    setInput("");
  }

  function sendVoice() {
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      const msg: Message = {
        id: "m-" + Date.now(),
        from: currentUser.id,
        text: "🎤 Голосовое сообщение (0:03)",
        time: new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" }),
        isVoice: true,
      };
      setMessages((prev) => [...prev, msg]);
      chat.messages.push(msg);
    }, 2000);
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-[#2f3136] border-b border-[#202225] flex items-center gap-3 px-4 py-3">
        <button onClick={onBack} className="text-[#8e9297] hover:text-white transition">
          <Icon name="ChevronLeft" size={20} />
        </button>
        <button onClick={() => onViewProfile(chat.user)} className="flex items-center gap-2 flex-1">
          <div className="relative">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm ${avatarColor(chat.user.id)}`}>
              {chat.user.avatar}
            </div>
            {chat.user.isOnline && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#3ba55c] rounded-full border-2 border-[#2f3136]" />
            )}
          </div>
          <div className="text-left">
            {chat.user.rainbowNick ? (
              <RainbowText text={chat.user.name} />
            ) : (
              <span className="text-white text-sm font-semibold">{chat.user.name}</span>
            )}
            <p className="text-[#8e9297] text-xs">{chat.user.isOnline ? "В сети" : "Не в сети"}</p>
          </div>
        </button>
        <Icon name="Phone" size={18} className="text-[#8e9297]" />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => {
          const isMe = msg.from === currentUser.id;
          const sender = mockUsers.find((u) => u.id === msg.from);
          return (
            <div key={msg.id} className={`flex gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
              {!isMe && (
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold ${avatarColor(msg.from)}`}>
                  {sender?.avatar || "?"}
                </div>
              )}
              <div
                className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                  isMe
                    ? "bg-[#5865f2] text-white rounded-tr-sm"
                    : "bg-[#40444b] text-[#dcddde] rounded-tl-sm"
                }`}
              >
                {msg.isVoice ? (
                  <div className="flex items-center gap-2">
                    <Icon name="Mic" size={14} />
                    <div className="flex gap-0.5">
                      {[3,5,4,6,3,5,2,4,6,3].map((h, i) => (
                        <div key={i} className="w-0.5 rounded-full bg-current opacity-60" style={{height: h*3}} />
                      ))}
                    </div>
                    <span className="text-xs opacity-70">0:03</span>
                  </div>
                ) : (
                  <p>{msg.text}</p>
                )}
                <p className={`text-[10px] mt-1 ${isMe ? "text-white/60 text-right" : "text-[#72767d]"}`}>{msg.time}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="bg-[#2f3136] border-t border-[#202225] p-3 flex items-center gap-2">
        <div className="flex-1 bg-[#40444b] rounded-full flex items-center px-4 gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Написать сообщение..."
            className="flex-1 bg-transparent text-white placeholder-[#72767d] text-sm py-2.5 outline-none"
          />
        </div>
        {input.trim() ? (
          <button
            onClick={send}
            className="w-10 h-10 bg-[#5865f2] hover:bg-[#4752c4] rounded-full flex items-center justify-center transition"
          >
            <Icon name="Send" size={16} className="text-white" />
          </button>
        ) : (
          <button
            onClick={sendVoice}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
              isRecording ? "bg-[#ed4245] animate-pulse" : "bg-[#40444b] hover:bg-[#5865f2]"
            }`}
          >
            <Icon name="Mic" size={16} className="text-white" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── AI SCREEN ────────────────────────────────────────────────────────────────
function AiScreen() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div className="w-20 h-20 bg-gradient-to-br from-[#5865f2] to-[#eb459e] rounded-full flex items-center justify-center mb-6 opacity-60">
        <Icon name="Bot" size={36} className="text-white" />
      </div>
      <h2 className="text-white text-xl font-bold mb-3">ИИ Помощник</h2>
      <div className="bg-[#2f3136] rounded-xl p-5 max-w-sm">
        <p className="text-[#b9bbbe] text-sm leading-relaxed">
          Наш ИИ помощник уехал на Бали и пока не может работать, но мы надеемся что через неделю он вернётся 🌴
        </p>
      </div>
      <p className="text-[#4f545c] text-xs mt-4">Скоро вернётся загорелым и умным ☀️</p>
    </div>
  );
}

// ─── PROFILE VIEW ─────────────────────────────────────────────────────────────
function ProfileView({
  user,
  onBack,
  currentUser,
}: {
  user: User;
  onBack: () => void;
  currentUser: User;
}) {
  const isMe = user.id === currentUser.id;
  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="relative h-32 bg-gradient-to-br from-[#5865f2] to-[#eb459e]">
        <button
          onClick={onBack}
          className="absolute top-4 left-4 text-white/80 hover:text-white transition"
        >
          <Icon name="ChevronLeft" size={24} />
        </button>
      </div>
      <div className="px-5 pb-6">
        {/* Avatar */}
        <div className="flex items-end justify-between -mt-8 mb-4">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold border-4 border-[#36393f] ${avatarColor(user.id)}`}>
            {user.avatar}
          </div>
          {user.isOnline && (
            <span className="bg-[#3ba55c]/20 text-[#3ba55c] text-xs font-semibold px-3 py-1 rounded-full">
              В сети
            </span>
          )}
        </div>

        {/* Name & username */}
        <div className="mb-1">
          {user.rainbowNick ? (
            <span className="text-xl font-bold">
              <RainbowText text={user.name} />
            </span>
          ) : (
            <h2 className="text-white text-xl font-bold">{user.name}</h2>
          )}
          <p className="text-[#8e9297] text-sm">{user.username}</p>
        </div>

        {/* Description */}
        {user.description && (
          <div className="bg-[#2f3136] rounded-lg p-3 mt-3">
            <p className="text-[#dcddde] text-sm">{user.description}</p>
          </div>
        )}

        {/* Badges */}
        {user.badges.length > 0 && (
          <div className="mt-4">
            <p className="text-[#8e9297] text-xs font-semibold uppercase tracking-wide mb-2">Бейджи</p>
            <div className="flex flex-wrap gap-2">
              {user.badges.map((badge) => (
                <span
                  key={badge}
                  className="bg-gradient-to-r from-[#5865f2] to-[#eb459e] text-white text-xs font-semibold px-3 py-1 rounded-full"
                >
                  ✦ {badge}
                </span>
              ))}
            </div>
          </div>
        )}

        {!isMe && (
          <div className="mt-4 flex gap-2">
            <div className="bg-[#2f3136] rounded-lg p-3 flex-1 text-center">
              <p className="text-[#8e9297] text-xs">Телефон</p>
              <p className="text-white text-sm font-medium mt-0.5">{user.phone}</p>
            </div>
            {user.isAdmin && (
              <div className="bg-[#5865f2]/20 border border-[#5865f2]/30 rounded-lg p-3 flex-1 text-center">
                <p className="text-[#5865f2] text-xs font-semibold">👑 Администратор</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ADMIN SCREEN ─────────────────────────────────────────────────────────────
function AdminScreen({ currentUser }: { currentUser: User }) {
  const [users, setUsers] = useState<User[]>(mockUsers.filter((u) => u.id !== currentUser.id));
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [badgeInput, setBadgeInput] = useState("");
  const [tab, setTab] = useState<"users" | "chats">("users");

  function toggleBan(uid: string) {
    setUsers((prev) =>
      prev.map((u) => (u.id === uid ? { ...u, isBanned: !u.isBanned } : u))
    );
    const mu = mockUsers.find((u) => u.id === uid);
    if (mu) mu.isBanned = !mu.isBanned;
  }

  function giveRainbow(uid: string) {
    setUsers((prev) =>
      prev.map((u) => (u.id === uid ? { ...u, rainbowNick: !u.rainbowNick } : u))
    );
    const mu = mockUsers.find((u) => u.id === uid);
    if (mu) mu.rainbowNick = !mu.rainbowNick;
  }

  function addBadge(uid: string) {
    if (!badgeInput.trim()) return;
    setUsers((prev) =>
      prev.map((u) =>
        u.id === uid ? { ...u, badges: [...u.badges, badgeInput.trim()] } : u
      )
    );
    const mu = mockUsers.find((u) => u.id === uid);
    if (mu) mu.badges.push(badgeInput.trim());
    setBadgeInput("");
  }

  function removeBadge(uid: string, badge: string) {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === uid ? { ...u, badges: u.badges.filter((b) => b !== badge) } : u
      )
    );
    const mu = mockUsers.find((u) => u.id === uid);
    if (mu) mu.badges = mu.badges.filter((b) => b !== badge);
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-4 py-3 border-b border-[#202225] flex items-center gap-2">
        <Icon name="ShieldCheck" size={18} className="text-[#5865f2]" />
        <h2 className="text-white font-semibold">Панель администратора</h2>
      </div>

      {/* Tabs */}
      <div className="flex bg-[#202225] mx-4 mt-3 rounded-lg p-1">
        <button
          onClick={() => setTab("users")}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition ${tab === "users" ? "bg-[#5865f2] text-white" : "text-[#8e9297] hover:text-white"}`}
        >
          Пользователи
        </button>
        <button
          onClick={() => setTab("chats")}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition ${tab === "chats" ? "bg-[#5865f2] text-white" : "text-[#8e9297] hover:text-white"}`}
        >
          Чаты
        </button>
      </div>

      {tab === "users" && (
        <div className="p-4 space-y-3">
          {users.map((user) => (
            <div key={user.id} className="bg-[#2f3136] rounded-xl overflow-hidden">
              <div
                className="flex items-center gap-3 p-3 cursor-pointer hover:bg-[#393c43] transition"
                onClick={() => setSelectedUser(selectedUser?.id === user.id ? null : user)}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${avatarColor(user.id)} ${user.isBanned ? "opacity-40 grayscale" : ""}`}>
                  {user.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {user.rainbowNick ? (
                      <RainbowText text={user.name} />
                    ) : (
                      <span className={`text-sm font-medium ${user.isBanned ? "text-[#ed4245] line-through" : "text-white"}`}>
                        {user.name}
                      </span>
                    )}
                    {user.isBanned && <span className="text-[10px] bg-[#ed4245]/20 text-[#ed4245] px-1.5 py-0.5 rounded">Забанен</span>}
                  </div>
                  <p className="text-[#72767d] text-xs">{user.username} · {user.phone}</p>
                </div>
                <Icon name={selectedUser?.id === user.id ? "ChevronUp" : "ChevronDown"} size={16} className="text-[#72767d]" />
              </div>

              {selectedUser?.id === user.id && (
                <div className="border-t border-[#202225] p-3 space-y-3">
                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => toggleBan(user.id)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${user.isBanned ? "bg-[#3ba55c]/20 text-[#3ba55c]" : "bg-[#ed4245]/20 text-[#ed4245] hover:bg-[#ed4245]/30"}`}
                    >
                      {user.isBanned ? "Разбанить" : "Забанить"}
                    </button>
                    <button
                      onClick={() => giveRainbow(user.id)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#5865f2] to-[#eb459e] text-white"
                    >
                      {user.rainbowNick ? "Убрать радугу" : "🌈 Радужный ник"}
                    </button>
                  </div>

                  {/* Badges */}
                  <div>
                    <p className="text-[#8e9297] text-xs font-semibold uppercase mb-2">Бейджи</p>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {user.badges.map((b) => (
                        <span
                          key={b}
                          onClick={() => removeBadge(user.id, b)}
                          className="bg-[#5865f2]/20 text-[#5865f2] text-xs px-2 py-0.5 rounded-full cursor-pointer hover:bg-[#ed4245]/20 hover:text-[#ed4245] transition"
                          title="Нажмите чтобы удалить"
                        >
                          {b} ✕
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={badgeInput}
                        onChange={(e) => setBadgeInput(e.target.value)}
                        className="flex-1 bg-[#202225] text-white text-xs rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-[#5865f2]"
                      >
                        <option value="">Выбрать бейдж...</option>
                        {BADGES_POOL.map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => addBadge(user.id)}
                        className="bg-[#5865f2] text-white text-xs px-3 py-1.5 rounded-lg hover:bg-[#4752c4] transition"
                      >
                        Выдать
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "chats" && (
        <div className="p-4 space-y-3">
          {mockChats.map((chat) => (
            <div key={chat.id} className="bg-[#2f3136] rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${avatarColor(chat.user.id)}`}>
                  {chat.user.avatar}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{chat.user.name}</p>
                  <p className="text-[#72767d] text-xs">{chat.messages.length} сообщений</p>
                </div>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {chat.messages.map((m) => {
                  const sender = mockUsers.find((u) => u.id === m.from);
                  return (
                    <div key={m.id} className="text-xs">
                      <span className="text-[#5865f2] font-medium">{sender?.name || "?"}: </span>
                      <span className="text-[#b9bbbe]">{m.text}</span>
                      <span className="text-[#72767d] ml-1">{m.time}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SETTINGS SCREEN ──────────────────────────────────────────────────────────
function SettingsScreen({
  currentUser,
  onUpdate,
}: {
  currentUser: User;
  onUpdate: (u: User) => void;
}) {
  const [name, setName] = useState(currentUser.name);
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [description, setDescription] = useState(currentUser.description);
  const [saved, setSaved] = useState(false);

  function save() {
    const updated = { ...currentUser, name, avatar, description };
    const idx = mockUsers.findIndex((u) => u.id === currentUser.id);
    if (idx !== -1) mockUsers[idx] = updated;
    onUpdate(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-4 py-3 border-b border-[#202225]">
        <h2 className="text-white font-semibold">Настройки профиля</h2>
      </div>
      <div className="p-5 space-y-5">
        {/* Avatar preview */}
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold ${avatarColor(currentUser.id)}`}>
            {avatar || currentUser.avatar}
          </div>
          <div>
            <p className="text-white text-sm font-medium">{name || "Имя"}</p>
            <p className="text-[#8e9297] text-xs">{currentUser.username}</p>
            {currentUser.badges.length > 0 && (
              <div className="flex gap-1 mt-1 flex-wrap">
                {currentUser.badges.map((b) => (
                  <span key={b} className="text-[10px] bg-[#5865f2]/20 text-[#5865f2] px-1.5 py-0.5 rounded-full">{b}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide mb-1.5 block">Имя</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#202225] text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#5865f2] transition"
            />
          </div>
          <div>
            <label className="text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide mb-1.5 block">Аватарка (эмодзи или буква)</label>
            <input
              value={avatar}
              onChange={(e) => setAvatar(e.target.value.slice(0, 2))}
              className="w-full bg-[#202225] text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#5865f2] transition"
            />
          </div>
          <div>
            <label className="text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide mb-1.5 block">О себе</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Расскажи о себе..."
              className="w-full bg-[#202225] text-white placeholder-[#4f545c] rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#5865f2] transition resize-none"
            />
          </div>
          <div>
            <label className="text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide mb-1.5 block">Юзернейм (нельзя изменить)</label>
            <input
              value={currentUser.username}
              disabled
              className="w-full bg-[#1a1d23] text-[#4f545c] rounded-lg px-3 py-2.5 text-sm cursor-not-allowed"
            />
          </div>
        </div>

        <button
          onClick={save}
          className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all ${saved ? "bg-[#3ba55c] text-white" : "bg-[#5865f2] hover:bg-[#4752c4] text-white"}`}
        >
          {saved ? "✓ Сохранено!" : "Сохранить изменения"}
        </button>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
const Index = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [screen, setScreen] = useState<Screen>("chats");
  const [openChat, setOpenChat] = useState<Chat | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [prevScreen, setPrevScreen] = useState<Screen>("chats");

  if (!currentUser) {
    return <AuthScreen onAuth={(u) => setCurrentUser(u)} />;
  }

  function goProfile(user: User) {
    setViewingUser(user);
    setPrevScreen(screen);
    setScreen("profile-view");
  }

  function handleBack() {
    if (screen === "profile-view") {
      setScreen(prevScreen);
      setViewingUser(null);
    } else if (screen === "chat-open") {
      setOpenChat(null);
      setScreen("chats");
    }
  }

  function handleOpenChat(chat: Chat) {
    setOpenChat(chat);
    setScreen("chat-open");
  }

  const showNav = screen !== "chat-open" && screen !== "profile-view";

  return (
    <div className="min-h-screen bg-[#36393f] flex flex-col max-w-md mx-auto relative">
      {/* Top header */}
      {showNav && (
        <div className="bg-[#2f3136] border-b border-[#202225] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-[#5865f2] to-[#eb459e] rounded-lg flex items-center justify-center">
              <span className="text-white text-[10px] font-black">19</span>
            </div>
            <span className="text-white font-bold text-base tracking-tight">19 Wave</span>
          </div>
          <button onClick={() => goProfile(currentUser)} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${avatarColor(currentUser.id)}`}>
              {currentUser.avatar}
            </div>
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {screen === "chats" && (
          <ChatsScreen currentUser={currentUser} onOpenChat={handleOpenChat} />
        )}
        {screen === "contacts" && (
          <ContactsScreen
            currentUser={currentUser}
            onOpenChat={handleOpenChat}
            onViewProfile={goProfile}
          />
        )}
        {screen === "ai" && <AiScreen />}
        {screen === "admin" && currentUser.isAdmin && (
          <AdminScreen currentUser={currentUser} />
        )}
        {screen === "settings" && (
          <SettingsScreen
            currentUser={currentUser}
            onUpdate={(u) => setCurrentUser(u)}
          />
        )}
        {screen === "chat-open" && openChat && (
          <ChatOpen
            chat={openChat}
            currentUser={currentUser}
            onBack={handleBack}
            onViewProfile={goProfile}
          />
        )}
        {screen === "profile-view" && viewingUser && (
          <ProfileView user={viewingUser} onBack={handleBack} currentUser={currentUser} />
        )}
      </div>

      {/* Bottom Nav */}
      {showNav && (
        <BottomNav
          screen={screen}
          setScreen={setScreen}
          isAdmin={!!currentUser.isAdmin}
          currentUser={currentUser}
          onProfileClick={() => goProfile(currentUser)}
        />
      )}
    </div>
  );
};

export default Index;
