export interface FeedComment {
  id: string;
  author: { name: string; handle: string; avatar: string };
  content: string;
  timeAgo: string;
  likes: number;
  liked: boolean;
}

export interface FeedPost {
  id: string;
  author: { name: string; handle: string; avatar: string; verified: boolean };
  content: string;
  images?: string[];
  timeAgo: string;
  likes: number;
  comments: FeedComment[];
  reposts: number;
  bookmarks: number;
  liked: boolean;
  reposted: boolean;
  bookmarked: boolean;
  tags?: string[];
}

export const samplePosts: FeedPost[] = [
  {
    id: "1",
    author: { name: "Олена Мирна", handle: "@olena.art", avatar: "", verified: true },
    content: "Щойно завершила серію з 12 акварелей «Зимові Карпати» 🏔️✨ Кожна робота — це окремий настрій гірського ранку. Дуже хочу поділитись процесом і результатом з вами!",
    images: ["https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&h=400&fit=crop"],
    timeAgo: "2 год",
    likes: 142,
    comments: [
      { id: "c1", author: { name: "Артем К.", handle: "@artem.k", avatar: "" }, content: "Неймовірна серія! Особливо та з туманом 🌫️", timeAgo: "1 год", likes: 12, liked: false },
      { id: "c2", author: { name: "Марія Д.", handle: "@maria.d", avatar: "" }, content: "Олено, ви продаєте оригінали чи тільки принти?", timeAgo: "45 хв", likes: 3, liked: false },
    ],
    reposts: 28,
    bookmarks: 67,
    liked: false,
    reposted: false,
    bookmarked: false,
    tags: ["акварель", "Карпати", "живопис"],
  },
  {
    id: "2",
    author: { name: "Дмитро Лисенко", handle: "@dmytro.sculptor", avatar: "", verified: false },
    content: "Шукаю скульптора-асистента для великого проєкту в Берліні. Робота з бронзою, 3 місяці, оплата + проживання. Пишіть у DM або на пошту 📩",
    timeAgo: "5 год",
    likes: 89,
    comments: [
      { id: "c3", author: { name: "Іван П.", handle: "@ivan.p", avatar: "" }, content: "Написав вам у приватні!", timeAgo: "4 год", likes: 1, liked: false },
    ],
    reposts: 45,
    bookmarks: 112,
    liked: false,
    reposted: false,
    bookmarked: false,
    tags: ["скульптура", "Берлін", "вакансія"],
  },
  {
    id: "3",
    author: { name: "Галерея «Простір»", handle: "@prostir.gallery", avatar: "", verified: true },
    content: "📢 Відкриття виставки «Кольори еміграції» — 15 березня о 18:00.\n\n12 українських митців з 7 країн представлять роботи про досвід переміщення та пошук нового дому.\n\nВхід вільний. Реєстрація за посиланням у профілі.",
    timeAgo: "8 год",
    likes: 234,
    comments: [
      { id: "c4", author: { name: "Софія Б.", handle: "@sofia.b", avatar: "" }, content: "Обовʼязково прийду! 🎨", timeAgo: "7 год", likes: 8, liked: false },
      { id: "c5", author: { name: "Михайло Т.", handle: "@mykhailo.t", avatar: "" }, content: "Чи буде онлайн-трансляція?", timeAgo: "6 год", likes: 15, liked: false },
      { id: "c6", author: { name: "Галерея «Простір»", handle: "@prostir.gallery", avatar: "" }, content: "@mykhailo.t Так, будемо транслювати відкриття у прямому ефірі!", timeAgo: "5 год", likes: 22, liked: false },
    ],
    reposts: 78,
    bookmarks: 189,
    liked: false,
    reposted: false,
    bookmarked: false,
    tags: ["виставка", "еміграція", "мистецтво"],
  },
  {
    id: "4",
    author: { name: "Катерина Вовк", handle: "@kate.ceramics", avatar: "", verified: false },
    content: "Процес створення великої вази від початку до кінця. 14 годин роботи у 60 секунд ⏱️\n\nКераміка — це медитація, терпіння та трішки магії вогню 🔥",
    timeAgo: "12 год",
    likes: 567,
    comments: [],
    reposts: 134,
    bookmarks: 298,
    liked: false,
    reposted: false,
    bookmarked: false,
    tags: ["кераміка", "процес", "handmade"],
  },
  {
    id: "5",
    author: { name: "ArtHub UA", handle: "@arthub.ua", avatar: "", verified: true },
    content: "🏆 Оголошуємо конкурс «Митець року 2026»!\n\nНомінації:\n• Живопис\n• Скульптура\n• Цифрове мистецтво\n• Фотографія\n• Кераміка\n\nПриз — виставка у Відні + грант €5000. Дедлайн подачі — 1 квітня.",
    timeAgo: "1 день",
    likes: 892,
    comments: [
      { id: "c7", author: { name: "Олена Мирна", handle: "@olena.art", avatar: "" }, content: "Вже подаю заявку! 🙌", timeAgo: "20 год", likes: 34, liked: false },
    ],
    reposts: 256,
    bookmarks: 445,
    liked: false,
    reposted: false,
    bookmarked: false,
    tags: ["конкурс", "грант", "Відень"],
  },
];
