export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  time: string;
  read: boolean;
  replyTo?: string;
}

export interface Chat {
  id: string;
  type: "private" | "group" | "channel";
  name: string;
  avatar: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  online?: boolean;
  members?: number;
  subscribers?: number;
  messages: ChatMessage[];
  pinned?: boolean;
  muted?: boolean;
}

export const currentUserId = "me";

export const sampleChats: Chat[] = [
  {
    id: "ch1",
    type: "private",
    name: "Олена Мирна",
    avatar: "ОМ",
    lastMessage: "Дякую за відгук! Надішлю фото завтра 📸",
    lastTime: "14:32",
    unread: 2,
    online: true,
    pinned: true,
    messages: [
      { id: "m1", senderId: "u1", text: "Привіт! Бачила твою серію «Зимові Карпати» — неймовірно!", time: "14:20", read: true },
      { id: "m2", senderId: "me", text: "Дякую! Дуже приємно 🙏 Працювала над нею 3 місяці", time: "14:22", read: true },
      { id: "m3", senderId: "u1", text: "Чи продаєш оригінали? Мене цікавить та з туманом", time: "14:25", read: true },
      { id: "m4", senderId: "me", text: "Так, є кілька доступних. Можу надіслати деталі та ціни", time: "14:28", read: true },
      { id: "m5", senderId: "u1", text: "Було б чудово! А є принти?", time: "14:30", read: true },
      { id: "m6", senderId: "u1", text: "Дякую за відгук! Надішлю фото завтра 📸", time: "14:32", read: false },
    ],
  },
  {
    id: "ch2",
    type: "group",
    name: "Кураторська група Берлін",
    avatar: "КБ",
    lastMessage: "Артем: Зустріч перенесено на п'ятницю",
    lastTime: "13:15",
    unread: 5,
    members: 24,
    messages: [
      { id: "m10", senderId: "u2", text: "Всім привіт! Нагадую про дедлайн подачі робіт — цієї п'ятниці", time: "12:00", read: true },
      { id: "m11", senderId: "u3", text: "Дякую за нагадування. Я вже надіслав свої 3 роботи", time: "12:15", read: true },
      { id: "m12", senderId: "u4", text: "А можна подати відео-арт?", time: "12:30", read: true },
      { id: "m13", senderId: "u2", text: "Так, відео до 5 хвилин приймаємо", time: "12:45", read: true },
      { id: "m14", senderId: "u3", text: "Зустріч перенесено на п'ятницю", time: "13:15", read: false },
    ],
  },
  {
    id: "ch3",
    type: "channel",
    name: "ArtHub UA • Новини",
    avatar: "AH",
    lastMessage: "🏆 Оголошено фіналістів конкурсу «Митець року»",
    lastTime: "11:00",
    unread: 0,
    subscribers: 12400,
    pinned: true,
    messages: [
      { id: "m20", senderId: "admin", text: "📢 Нова функція: тепер можна створювати колаборації прямо на платформі!", time: "09:00", read: true },
      { id: "m21", senderId: "admin", text: "🎨 Тижневий дайджест: 15 нових виставок у Європі", time: "10:00", read: true },
      { id: "m22", senderId: "admin", text: "🏆 Оголошено фіналістів конкурсу «Митець року»", time: "11:00", read: true },
    ],
  },
  {
    id: "ch4",
    type: "private",
    name: "Дмитро Лисенко",
    avatar: "ДЛ",
    lastMessage: "Можемо зустрітись у студії о 16:00?",
    lastTime: "Вчора",
    unread: 0,
    online: false,
    messages: [
      { id: "m30", senderId: "u5", text: "Привіт! Як просувається проєкт зі скульптурою?", time: "Вчора 15:00", read: true },
      { id: "m31", senderId: "me", text: "Майже готово! Залишилось фінальне полірування", time: "Вчора 15:30", read: true },
      { id: "m32", senderId: "u5", text: "Можемо зустрітись у студії о 16:00?", time: "Вчора 16:00", read: true },
    ],
  },
  {
    id: "ch5",
    type: "group",
    name: "Виставка «Кольори еміграції»",
    avatar: "КЕ",
    lastMessage: "Софія: Каталог готовий до друку ✅",
    lastTime: "Вчора",
    unread: 0,
    members: 14,
    messages: [
      { id: "m40", senderId: "u6", text: "Каталог готовий до друку ✅", time: "Вчора 18:00", read: true },
    ],
  },
  {
    id: "ch6",
    type: "channel",
    name: "Кераміка & Скульптура",
    avatar: "КС",
    lastMessage: "Нова техніка раку-випалу: покроковий гайд",
    lastTime: "2 дні",
    unread: 3,
    subscribers: 3200,
    messages: [
      { id: "m50", senderId: "admin", text: "Нова техніка раку-випалу: покроковий гайд", time: "2 дні", read: false },
    ],
  },
];
