import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";

// ─── API ──────────────────────────────────────────────────────────────────────
const API = {
  auth: "https://functions.poehali.dev/47c24e70-2c2b-4114-9059-9af9eaf47721",
  users: "https://functions.poehali.dev/0d5f02a5-0612-4ecd-8721-5bc7952963b4",
  messages: "https://functions.poehali.dev/58f543a6-cfe9-462e-bd20-3f75d122ed47",
};

async function apiFetch(url: string, body: object, userId?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (userId) headers["X-User-Id"] = userId;
  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  return res.json();
}

// ─── TYPES ────────────────────────────────────────────────────────────────────
type Screen = "auth" | "chats" | "contacts" | "ai" | "admin" | "settings" | "chat-open" | "profile-view";

interface User {
  id: string; name: string; username: string; phone: string;
  avatar: string; description: string; isAdmin?: boolean;
  isBanned?: boolean; isOnline?: boolean; rainbowNick?: boolean; badges: string[];
}

interface Message { id: string; from: string; text: string; time: string; isVoice?: boolean; }

interface ChatItem {
  partnerId: string; partnerName: string; partnerUsername: string;
  partnerAvatar: string; isOnline: boolean; rainbowNick: boolean;
  badges: string[]; lastMessage: string; lastTime: string; lastTs: string; unread: number; isMine: boolean;
}

const LOGO_URL = "https://cdn.poehali.dev/projects/546d8901-a08d-4412-88b5-cb9dcdee9160/files/0e43774f-05f8-4521-8b0c-92cbce6b9f2f.jpg";
const BADGES_POOL = ["Ранний пользователь","Активист","Разработчик","Основатель","Звезда","Помощник","VIP","Легенда"];
const avatarColors = ["bg-[#5865f2]","bg-[#57f287]","bg-[#eb459e]","bg-[#fee75c]","bg-[#ed4245]","bg-[#3ba55c]"];

function avatarColor(id: string) {
  return avatarColors[id.charCodeAt(id.length - 1) % avatarColors.length];
}

// ─── PUSH NOTIFICATIONS ───────────────────────────────────────────────────────
async function requestNotificationPermission() {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const perm = await Notification.requestPermission();
  return perm === "granted";
}

function sendPushNotification(title: string, body: string) {
  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    new Notification(title, { body, icon: LOGO_URL });
  }
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function RainbowText({ text }: { text: string }) {
  return (
    <span style={{
      background: "linear-gradient(90deg,#ff0080,#ff8c00,#ffe600,#00ff88,#00cfff,#a855f7,#ff0080)",
      backgroundSize: "200%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
      animation: "rainbow 3s linear infinite",
    }}>{text}</span>
  );
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }: { onAuth: (u: User) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [phone, setPhone] = useState(""); const [name, setName] = useState("");
  const [username, setUsername] = useState(""); const [avatar, setAvatar] = useState("");
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false);

  async function submit() {
    setError(""); setLoading(true);
    const data = await apiFetch(API.auth, { action: mode === "login" ? "login" : "register", phone, name, username, avatar });
    setLoading(false);
    if (data.error) return setError(data.error);
    await requestNotificationPermission();
    onAuth(data as User);
  }

  return (
    <div className="min-h-screen bg-[#1a1d23] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <img src={LOGO_URL} alt="19 Wave" className="w-16 h-16 rounded-2xl mb-4 shadow-lg shadow-[#5865f2]/30 object-cover" />
          <h1 className="text-white text-2xl font-bold tracking-tight">19 Wave</h1>
          <p className="text-[#8e9297] text-sm mt-1">Мессенджер новой волны</p>
        </div>
        <div className="bg-[#2f3136] rounded-xl p-6 shadow-xl">
          <div className="flex mb-6 bg-[#202225] rounded-lg p-1">
            {(["login","register"] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === m ? "bg-[#5865f2] text-white" : "text-[#8e9297] hover:text-white"}`}>
                {m === "login" ? "Войти" : "Регистрация"}
              </button>
            ))}
          </div>
          <div className="space-y-4">
            <Field label="Номер телефона" value={phone} onChange={setPhone} placeholder="+7 999 000 00 00" type="tel" />
            {mode === "register" && (<>
              <Field label="Имя" value={name} onChange={setName} placeholder="Любое имя" />
              <div>
                <Field label="Юзернейм" value={username} onChange={setUsername} placeholder="@username" />
                <p className="text-[#72767d] text-xs mt-1">Только строчные буквы латиницы, начинается с @</p>
              </div>
              <Field label="Аватарка (эмодзи или буква)" value={avatar} onChange={v => setAvatar(v.slice(0,2))} placeholder="😎" />
            </>)}
            {error && <p className="text-[#ed4245] text-xs bg-[#ed4245]/10 rounded-md px-3 py-2">{error}</p>}
            <button onClick={submit} disabled={loading}
              className="w-full bg-[#5865f2] hover:bg-[#4752c4] disabled:opacity-50 text-white font-semibold rounded-md py-2.5 text-sm transition-all mt-2">
              {loading ? "Загрузка..." : (mode === "login" ? "Войти" : "Зарегистрироваться")}
            </button>
          </div>
        </div>
        <p className="text-center text-[#4f545c] text-xs mt-4">19 Wave — мессенджер новой волны 🌊</p>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide mb-1.5 block">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-[#202225] text-white placeholder-[#4f545c] rounded-md px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#5865f2] transition" />
    </div>
  );
}

// ─── BOTTOM NAV ───────────────────────────────────────────────────────────────
function BottomNav({ screen, setScreen, isAdmin, currentUser, onProfileClick }: {
  screen: Screen; setScreen: (s: Screen) => void; isAdmin: boolean; currentUser: User; onProfileClick: () => void;
}) {
  const tabs = [
    { id: "contacts", icon: "Users", label: "Контакты" },
    { id: "chats", icon: "MessageCircle", label: "Чаты" },
    { id: "ai", icon: "Bot", label: "ИИ" },
    ...(isAdmin ? [{ id: "admin", icon: "ShieldCheck", label: "Админ" }] : []),
    { id: "settings", icon: "Settings", label: "Настройки" },
  ];
  return (
    <div className="bg-[#2f3136] border-t border-[#202225] flex items-center px-2 py-1">
      {tabs.map(tab => (
        <button key={tab.id} onClick={() => setScreen(tab.id as Screen)}
          className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-lg transition-all ${screen === tab.id ? "text-[#5865f2]" : "text-[#72767d] hover:text-[#b9bbbe]"}`}>
          <Icon name={tab.icon} size={20} />
          <span className="text-[10px] font-medium">{tab.label}</span>
        </button>
      ))}
      <button onClick={onProfileClick} className="flex-1 flex flex-col items-center gap-0.5 py-2">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${avatarColor(currentUser.id)}`}>
          {currentUser.avatar}
        </div>
        <span className="text-[10px] font-medium text-[#72767d]">Профиль</span>
      </button>
    </div>
  );
}

// ─── CONTACTS ─────────────────────────────────────────────────────────────────
function ContactsScreen({ currentUser, onOpenChat, onViewProfile }: {
  currentUser: User; onOpenChat: (u: User) => void; onViewProfile: (u: User) => void;
}) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(API.users, { action: "list" }, currentUser.id).then(d => {
      if (Array.isArray(d)) setUsers(d.filter((u: User) => u.id !== currentUser.id));
      setLoading(false);
    });
  }, [currentUser.id]);

  const sorted = [...users].sort((a, b) => (b.isOnline ? 1 : 0) - (a.isOnline ? 1 : 0));

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-4 py-3 border-b border-[#202225]">
        <h2 className="text-white font-semibold">Контакты</h2>
        <p className="text-[#8e9297] text-xs mt-0.5">{sorted.filter(u => u.isOnline).length} в сети</p>
      </div>
      {loading ? <Loader /> : sorted.map(user => (
        <div key={user.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[#393c43] transition cursor-pointer border-b border-[#202225]/40"
          onClick={() => onViewProfile(user)}>
          <div className="relative flex-shrink-0">
            <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm ${avatarColor(user.id)}`}>
              {user.avatar}
            </div>
            {user.isOnline && <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#3ba55c] rounded-full border-2 border-[#36393f]" />}
          </div>
          <div className="flex-1 min-w-0">
            {user.rainbowNick ? <RainbowText text={user.name} /> : <span className="text-white text-sm font-medium">{user.name}</span>}
            <p className="text-[#8e9297] text-xs">{user.username}</p>
          </div>
          <button onClick={e => { e.stopPropagation(); onOpenChat(user); }}
            className="text-[#5865f2] hover:text-white bg-[#5865f2]/10 hover:bg-[#5865f2] rounded-full p-2 transition">
            <Icon name="MessageCircle" size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── CHATS ────────────────────────────────────────────────────────────────────
function ChatsScreen({ currentUser, onOpenChat }: {
  currentUser: User; onOpenChat: (u: User) => void;
}) {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const prevChatsRef = useRef<ChatItem[]>([]);

  const loadChats = useCallback(async () => {
    const d = await apiFetch(API.messages, { action: "get_chats" }, currentUser.id);
    if (Array.isArray(d)) {
      const newChats = d as ChatItem[];
      if (prevChatsRef.current.length > 0) {
        for (const chat of newChats) {
          const prev = prevChatsRef.current.find(c => c.partnerId === chat.partnerId);
          if (prev && prev.lastTs !== chat.lastTs && !chat.isMine) {
            sendPushNotification(chat.partnerName, chat.lastMessage);
          }
        }
      }
      prevChatsRef.current = newChats;
      setChats(newChats);
      setLoading(false);
    }
  }, [currentUser.id]);

  useEffect(() => {
    loadChats();
    const interval = setInterval(loadChats, 4000);
    return () => clearInterval(interval);
  }, [loadChats]);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-4 py-3 border-b border-[#202225] flex items-center justify-between">
        <h2 className="text-white font-semibold">Чаты</h2>
        <button onClick={loadChats} className="text-[#8e9297] hover:text-white transition">
          <Icon name="RefreshCw" size={16} />
        </button>
      </div>
      {loading ? <Loader /> : chats.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-[#8e9297]">
          <Icon name="MessageCircle" size={40} />
          <p className="mt-3 text-sm">Пока нет чатов</p>
          <p className="text-xs mt-1">Напишите первыми через «Контакты»</p>
        </div>
      ) : chats.map(chat => (
        <div key={chat.partnerId}
          onClick={() => onOpenChat({ id: chat.partnerId, name: chat.partnerName, username: chat.partnerUsername, avatar: chat.partnerAvatar, isOnline: chat.isOnline, rainbowNick: chat.rainbowNick, badges: chat.badges, phone: "", description: "" })}
          className="flex items-center gap-3 px-4 py-3 hover:bg-[#393c43] transition cursor-pointer border-b border-[#202225]/40">
          <div className="relative flex-shrink-0">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${avatarColor(chat.partnerId)}`}>
              {chat.partnerAvatar}
            </div>
            {chat.isOnline && <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#3ba55c] rounded-full border-2 border-[#36393f]" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              {chat.rainbowNick ? <RainbowText text={chat.partnerName} /> : <span className="text-white text-sm font-semibold">{chat.partnerName}</span>}
              <span className="text-[#72767d] text-xs">{chat.lastTime}</span>
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <p className="text-[#8e9297] text-xs truncate max-w-[200px]">
                {chat.isMine ? "Вы: " : ""}{chat.lastMessage}
              </p>
              {chat.unread > 0 && <span className="bg-[#5865f2] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">{chat.unread}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── CHAT OPEN ────────────────────────────────────────────────────────────────
function ChatOpen({ partner, currentUser, onBack, onViewProfile }: {
  partner: User; currentUser: User; onBack: () => void; onViewProfile: (u: User) => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    const d = await apiFetch(API.messages, { action: "get_messages", partner_id: partner.id }, currentUser.id);
    if (Array.isArray(d)) {
      setMessages(prev => {
        if (prev.length > 0 && (d as Message[]).length > prev.length) {
          const newest = (d as Message[])[(d as Message[]).length - 1];
          if (newest.from !== currentUser.id) sendPushNotification(partner.name, newest.text);
        }
        return d as Message[];
      });
    }
  }, [partner.id, currentUser.id, partner.name]);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send() {
    if (!input.trim()) return;
    const text = input.trim(); setInput("");
    const d = await apiFetch(API.messages, { action: "send", to_user_id: partner.id, text }, currentUser.id);
    if (d.id) setMessages(prev => [...prev, d]);
  }

  async function sendVoice() {
    setIsRecording(true);
    setTimeout(async () => {
      setIsRecording(false);
      const d = await apiFetch(API.messages, { action: "send", to_user_id: partner.id, is_voice: true }, currentUser.id);
      if (d.id) setMessages(prev => [...prev, d]);
    }, 2000);
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-[#2f3136] border-b border-[#202225] flex items-center gap-3 px-4 py-3">
        <button onClick={onBack} className="text-[#8e9297] hover:text-white transition"><Icon name="ChevronLeft" size={20} /></button>
        <button onClick={() => onViewProfile(partner)} className="flex items-center gap-2 flex-1">
          <div className="relative">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm ${avatarColor(partner.id)}`}>{partner.avatar}</div>
            {partner.isOnline && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#3ba55c] rounded-full border-2 border-[#2f3136]" />}
          </div>
          <div className="text-left">
            {partner.rainbowNick ? <RainbowText text={partner.name} /> : <span className="text-white text-sm font-semibold">{partner.name}</span>}
            <p className="text-[#8e9297] text-xs">{partner.isOnline ? "В сети" : "Не в сети"}</p>
          </div>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map(msg => {
          const isMe = msg.from === currentUser.id;
          return (
            <div key={msg.id} className={`flex gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
              {!isMe && (
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold ${avatarColor(partner.id)}`}>{partner.avatar}</div>
              )}
              <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${isMe ? "bg-[#5865f2] text-white rounded-tr-sm" : "bg-[#40444b] text-[#dcddde] rounded-tl-sm"}`}>
                {msg.isVoice ? (
                  <div className="flex items-center gap-2">
                    <Icon name="Mic" size={14} />
                    <div className="flex gap-0.5">
                      {[3,5,4,6,3,5,2,4,6,3].map((h, i) => <div key={i} className="w-0.5 rounded-full bg-current opacity-60" style={{height: h*3}} />)}
                    </div>
                    <span className="text-xs opacity-70">0:03</span>
                  </div>
                ) : <p>{msg.text}</p>}
                <p className={`text-[10px] mt-1 ${isMe ? "text-white/60 text-right" : "text-[#72767d]"}`}>{msg.time}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="bg-[#2f3136] border-t border-[#202225] p-3 flex items-center gap-2">
        <div className="flex-1 bg-[#40444b] rounded-full flex items-center px-4">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Написать сообщение..." className="flex-1 bg-transparent text-white placeholder-[#72767d] text-sm py-2.5 outline-none" />
        </div>
        {input.trim() ? (
          <button onClick={send} className="w-10 h-10 bg-[#5865f2] hover:bg-[#4752c4] rounded-full flex items-center justify-center transition">
            <Icon name="Send" size={16} className="text-white" />
          </button>
        ) : (
          <button onClick={sendVoice} className={`w-10 h-10 rounded-full flex items-center justify-center transition ${isRecording ? "bg-[#ed4245] animate-pulse" : "bg-[#40444b] hover:bg-[#5865f2]"}`}>
            <Icon name="Mic" size={16} className="text-white" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── AI ───────────────────────────────────────────────────────────────────────
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
function ProfileView({ user, onBack }: { user: User; onBack: () => void }) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="relative h-32 bg-gradient-to-br from-[#5865f2] to-[#eb459e]">
        <button onClick={onBack} className="absolute top-4 left-4 text-white/80 hover:text-white transition">
          <Icon name="ChevronLeft" size={24} />
        </button>
      </div>
      <div className="px-5 pb-6">
        <div className="flex items-end justify-between -mt-8 mb-4">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold border-4 border-[#36393f] ${avatarColor(user.id)}`}>
            {user.avatar}
          </div>
          {user.isOnline && <span className="bg-[#3ba55c]/20 text-[#3ba55c] text-xs font-semibold px-3 py-1 rounded-full">В сети</span>}
        </div>
        <div className="mb-1">
          {user.rainbowNick ? <span className="text-xl font-bold"><RainbowText text={user.name} /></span>
            : <h2 className="text-white text-xl font-bold">{user.name}</h2>}
          <p className="text-[#8e9297] text-sm">{user.username}</p>
        </div>
        {user.description && <div className="bg-[#2f3136] rounded-lg p-3 mt-3"><p className="text-[#dcddde] text-sm">{user.description}</p></div>}
        {user.isAdmin && <div className="bg-[#5865f2]/20 border border-[#5865f2]/30 rounded-lg p-3 mt-3 text-center"><p className="text-[#5865f2] text-xs font-semibold">👑 Администратор</p></div>}
        {user.badges.length > 0 && (
          <div className="mt-4">
            <p className="text-[#8e9297] text-xs font-semibold uppercase tracking-wide mb-2">Бейджи</p>
            <div className="flex flex-wrap gap-2">
              {user.badges.map(badge => (
                <span key={badge} className="bg-gradient-to-r from-[#5865f2] to-[#eb459e] text-white text-xs font-semibold px-3 py-1 rounded-full">✦ {badge}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ADMIN ────────────────────────────────────────────────────────────────────
function AdminScreen({ currentUser }: { currentUser: User }) {
  const [users, setUsers] = useState<User[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [badgeInput, setBadgeInput] = useState("");
  const [tab, setTab] = useState<"users" | "chats">("users");
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(API.users, { action: "list" }, currentUser.id).then(d => {
      if (Array.isArray(d)) setUsers(d.filter((u: User) => u.id !== currentUser.id));
      setLoading(false);
    });
    apiFetch(API.messages, { action: "get_chats" }, currentUser.id).then(d => {
      if (Array.isArray(d)) setChats(d);
    });
  }, [currentUser.id]);

  async function adminAction(action: string, targetId: string, extra?: object) {
    const d = await apiFetch(API.users, { action, target_id: targetId, ...extra }, currentUser.id);
    if (d.id) setUsers(prev => prev.map((u: User) => u.id === d.id ? d : u));
  }

  if (loading) return <Loader />;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-4 py-3 border-b border-[#202225] flex items-center gap-2">
        <Icon name="ShieldCheck" size={18} className="text-[#5865f2]" />
        <h2 className="text-white font-semibold">Панель администратора</h2>
      </div>
      <div className="flex bg-[#202225] mx-4 mt-3 rounded-lg p-1">
        {(["users","chats"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition ${tab === t ? "bg-[#5865f2] text-white" : "text-[#8e9297] hover:text-white"}`}>
            {t === "users" ? "Пользователи" : "Чаты"}
          </button>
        ))}
      </div>

      {tab === "users" && (
        <div className="p-4 space-y-3">
          {users.map(user => (
            <div key={user.id} className="bg-[#2f3136] rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-[#393c43] transition"
                onClick={() => setSelected(selected === user.id ? null : user.id)}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${avatarColor(user.id)} ${user.isBanned ? "opacity-40 grayscale" : ""}`}>{user.avatar}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {user.rainbowNick ? <RainbowText text={user.name} /> : <span className={`text-sm font-medium ${user.isBanned ? "text-[#ed4245] line-through" : "text-white"}`}>{user.name}</span>}
                    {user.isBanned && <span className="text-[10px] bg-[#ed4245]/20 text-[#ed4245] px-1.5 py-0.5 rounded">Забанен</span>}
                  </div>
                  <p className="text-[#72767d] text-xs">{user.username}</p>
                </div>
                <Icon name={selected === user.id ? "ChevronUp" : "ChevronDown"} size={16} className="text-[#72767d]" />
              </div>
              {selected === user.id && (
                <div className="border-t border-[#202225] p-3 space-y-3">
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => adminAction(user.isBanned ? "unban" : "ban", user.id)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${user.isBanned ? "bg-[#3ba55c]/20 text-[#3ba55c]" : "bg-[#ed4245]/20 text-[#ed4245]"}`}>
                      {user.isBanned ? "Разбанить" : "Забанить"}
                    </button>
                    <button onClick={() => adminAction(user.rainbowNick ? "rainbow_off" : "rainbow_on", user.id)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#5865f2] to-[#eb459e] text-white">
                      {user.rainbowNick ? "Убрать радугу" : "🌈 Радужный ник"}
                    </button>
                  </div>
                  <div>
                    <p className="text-[#8e9297] text-xs font-semibold uppercase mb-2">Бейджи</p>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {user.badges.map(b => (
                        <span key={b} onClick={() => adminAction("remove_badge", user.id, { badge: b })}
                          className="bg-[#5865f2]/20 text-[#5865f2] text-xs px-2 py-0.5 rounded-full cursor-pointer hover:bg-[#ed4245]/20 hover:text-[#ed4245] transition">
                          {b} ✕
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <select value={badgeInput} onChange={e => setBadgeInput(e.target.value)}
                        className="flex-1 bg-[#202225] text-white text-xs rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-[#5865f2]">
                        <option value="">Выбрать бейдж...</option>
                        {BADGES_POOL.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                      <button onClick={() => { if (badgeInput) { adminAction("add_badge", user.id, { badge: badgeInput }); setBadgeInput(""); }}}
                        className="bg-[#5865f2] text-white text-xs px-3 py-1.5 rounded-lg hover:bg-[#4752c4] transition">
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
          {chats.length === 0 ? <p className="text-[#8e9297] text-sm text-center mt-4">Нет чатов</p> : chats.map(chat => (
            <div key={chat.partnerId} className="bg-[#2f3136] rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${avatarColor(chat.partnerId)}`}>{chat.partnerAvatar}</div>
                <div>
                  <p className="text-white text-sm font-medium">{chat.partnerName}</p>
                  <p className="text-[#72767d] text-xs">{chat.partnerUsername}</p>
                </div>
              </div>
              <p className="text-[#b9bbbe] text-xs">{chat.lastMessage} <span className="text-[#72767d]">{chat.lastTime}</span></p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
function SettingsScreen({ currentUser, onUpdate }: { currentUser: User; onUpdate: (u: User) => void }) {
  const [name, setName] = useState(currentUser.name);
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [description, setDescription] = useState(currentUser.description);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    const d = await apiFetch(API.users, { action: "update_me", name, avatar, description }, currentUser.id);
    setLoading(false);
    if (d.id) { onUpdate(d); setSaved(true); setTimeout(() => setSaved(false), 2000); }
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-4 py-3 border-b border-[#202225]">
        <h2 className="text-white font-semibold">Настройки профиля</h2>
      </div>
      <div className="p-5 space-y-5">
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold ${avatarColor(currentUser.id)}`}>
            {avatar || currentUser.avatar}
          </div>
          <div>
            <p className="text-white text-sm font-medium">{name || "Имя"}</p>
            <p className="text-[#8e9297] text-xs">{currentUser.username}</p>
            {currentUser.badges.length > 0 && (
              <div className="flex gap-1 mt-1 flex-wrap">
                {currentUser.badges.map(b => <span key={b} className="text-[10px] bg-[#5865f2]/20 text-[#5865f2] px-1.5 py-0.5 rounded-full">{b}</span>)}
              </div>
            )}
          </div>
        </div>
        <div className="space-y-4">
          <Field label="Имя" value={name} onChange={setName} />
          <Field label="Аватарка (эмодзи или буква)" value={avatar} onChange={v => setAvatar(v.slice(0,2))} />
          <div>
            <label className="text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide mb-1.5 block">О себе</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Расскажи о себе..."
              className="w-full bg-[#202225] text-white placeholder-[#4f545c] rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#5865f2] transition resize-none" />
          </div>
          <div>
            <label className="text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide mb-1.5 block">Юзернейм (нельзя изменить)</label>
            <input value={currentUser.username} disabled className="w-full bg-[#1a1d23] text-[#4f545c] rounded-lg px-3 py-2.5 text-sm cursor-not-allowed" />
          </div>
        </div>
        <button onClick={save} disabled={loading}
          className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 ${saved ? "bg-[#3ba55c] text-white" : "bg-[#5865f2] hover:bg-[#4752c4] text-white"}`}>
          {loading ? "Сохраняем..." : saved ? "✓ Сохранено!" : "Сохранить изменения"}
        </button>
      </div>
    </div>
  );
}

// ─── LOADER ───────────────────────────────────────────────────────────────────
function Loader() {
  return (
    <div className="flex items-center justify-center h-32">
      <div className="w-8 h-8 border-2 border-[#5865f2] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
const Index = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem("19wave_user");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [screen, setScreen] = useState<Screen>("chats");
  const [chatPartner, setChatPartner] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [prevScreen, setPrevScreen] = useState<Screen>("chats");

  useEffect(() => {
    if (currentUser) localStorage.setItem("19wave_user", JSON.stringify(currentUser));
    else localStorage.removeItem("19wave_user");
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    apiFetch(API.auth, { action: "set_online", user_id: currentUser.id, online: true });
    const off = () => {
      navigator.sendBeacon(API.auth, JSON.stringify({ action: "set_online", user_id: currentUser.id, online: false }));
    };
    window.addEventListener("beforeunload", off);
    return () => window.removeEventListener("beforeunload", off);
  }, [currentUser?.id]);

  if (!currentUser) return <AuthScreen onAuth={u => setCurrentUser(u)} />;

  function goProfile(user: User) { setViewingUser(user); setPrevScreen(screen); setScreen("profile-view"); }
  function handleBack() {
    if (screen === "profile-view") { setScreen(prevScreen); setViewingUser(null); }
    else if (screen === "chat-open") { setChatPartner(null); setScreen("chats"); }
  }
  function openChat(user: User) { setChatPartner(user); setScreen("chat-open"); }

  const showNav = screen !== "chat-open" && screen !== "profile-view";

  return (
    <div className="min-h-screen bg-[#36393f] flex flex-col max-w-md mx-auto">
      {showNav && (
        <div className="bg-[#2f3136] border-b border-[#202225] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={LOGO_URL} alt="19 Wave" className="w-7 h-7 rounded-lg object-cover" />
            <span className="text-white font-bold text-base tracking-tight">19 Wave</span>
          </div>
          <button onClick={() => goProfile(currentUser)}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${avatarColor(currentUser.id)}`}>
            {currentUser.avatar}
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        {screen === "chats" && <ChatsScreen currentUser={currentUser} onOpenChat={openChat} />}
        {screen === "contacts" && <ContactsScreen currentUser={currentUser} onOpenChat={openChat} onViewProfile={goProfile} />}
        {screen === "ai" && <AiScreen />}
        {screen === "admin" && currentUser.isAdmin && <AdminScreen currentUser={currentUser} />}
        {screen === "settings" && <SettingsScreen currentUser={currentUser} onUpdate={u => setCurrentUser(u)} />}
        {screen === "chat-open" && chatPartner && <ChatOpen partner={chatPartner} currentUser={currentUser} onBack={handleBack} onViewProfile={goProfile} />}
        {screen === "profile-view" && viewingUser && <ProfileView user={viewingUser} onBack={handleBack} />}
      </div>

      {showNav && (
        <BottomNav screen={screen} setScreen={setScreen} isAdmin={!!currentUser.isAdmin}
          currentUser={currentUser} onProfileClick={() => goProfile(currentUser)} />
      )}
    </div>
  );
};

export default Index;