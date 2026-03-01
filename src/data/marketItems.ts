export type MarketItem = {
  id: number;
  title: string;
  category: string;
  subcategory: string;
  price: string;
  priceNum: number;
  seller: string;
  sellerRating: number;
  sellerReviews: number;
  sellerAvatar?: string;
  city: string;
  country: string;
  emoji: string;
  description: string;
  fullDescription?: string;
  tags: string[];
  condition?: string;
  featured: boolean;
  date: string;
  views: number;
  likes: number;
  biddable?: boolean;
  currentBid?: number;
  bidCount?: number;
  shippingOptions?: string[];
  returnPolicy?: string;
  reviews?: { author: string; rating: number; text: string; date: string }[];
};

export const categories = [
  { id: "all", label: "Усі", count: 12 },
  { id: "painting", label: "Живопис", count: 3 },
  { id: "ceramics", label: "Кераміка", count: 2 },
  { id: "photo", label: "Фотографія", count: 2 },
  { id: "inventory", label: "Інвентар", count: 2 },
  { id: "materials", label: "Матеріали", count: 1 },
  { id: "services", label: "Послуги", count: 2 },
];

export const conditions = ["Нова робота", "Новий", "Б/у, гарний стан", "Б/у", "Цифровий продукт"];

export const countries = ["Німеччина", "Австрія", "Чехія", "Іспанія", "Португалія", "Нідерланди", "Франція"];

export const sortOptions = [
  { id: "newest", label: "Найновіші" },
  { id: "price-asc", label: "Дешевші" },
  { id: "price-desc", label: "Дорожчі" },
  { id: "popular", label: "Популярні" },
  { id: "rating", label: "За рейтингом" },
];

export const items: MarketItem[] = [
  {
    id: 1, title: "Абстрактний пейзаж, олія на полотні, 80×100 см", category: "painting", subcategory: "Олійний живопис",
    price: "€1,200", priceNum: 1200, seller: "Марина Ковальчук", sellerRating: 4.9, sellerReviews: 23,
    city: "Берлін", country: "Німеччина", emoji: "🎨",
    description: "Оригінальна робота олійними фарбами. Абстрактний пейзаж, натхненний Карпатськими горами.",
    fullDescription: "Оригінальна робота олійними фарбами на полотні 80×100 см. Абстрактний пейзаж, натхненний Карпатськими горами. Полотно на підрамнику, готове до експозиції. Сертифікат автентичності додається. Техніка: масло, мастихін, лесировка. Рама не включена.",
    tags: ["олія", "абстракція", "пейзаж", "оригінал"], condition: "Нова робота", featured: true, date: "2 дні тому",
    views: 156, likes: 24, biddable: true, currentBid: 980, bidCount: 5,
    shippingOptions: ["Кур'єр по Європі (€30)", "Самовивіз — Берлін"],
    returnPolicy: "Повернення протягом 14 днів за умови збереження стану",
    reviews: [
      { author: "Ігор П.", rating: 5, text: "Чудова робота, кольори неймовірні наживо!", date: "тиждень тому" },
      { author: "Анна С.", rating: 5, text: "Марина — надійний продавець, швидка доставка.", date: "2 тижні тому" },
    ],
  },
  {
    id: 2, title: "Керамічна ваза ручної роботи «Степ»", category: "ceramics", subcategory: "Декоративна кераміка",
    price: "€180", priceNum: 180, seller: "Олексій Гончаренко", sellerRating: 4.7, sellerReviews: 15,
    city: "Відень", country: "Австрія", emoji: "🏺",
    description: "Ваза із шамотної глини, ручне формування та глазурування. Висота 35 см.",
    fullDescription: "Ваза із шамотної глини, ручне формування та глазурування. Висота 35 см. Декоративний виріб, натхненний українськими степовими мотивами. Кожен виріб унікальний завдяки ручному розпису.",
    tags: ["кераміка", "ручна робота", "декор"], condition: "Нова робота", featured: false, date: "5 днів тому",
    views: 89, likes: 12, shippingOptions: ["Кур'єр (€15)", "Самовивіз — Відень"],
    returnPolicy: "Без повернення (крихкий товар)",
    reviews: [{ author: "Тетяна М.", rating: 4, text: "Гарна ваза, але пакування могло бути кращим.", date: "3 тижні тому" }],
  },
  {
    id: 3, title: "Фотопринт «Карпати» 60×90, лімітована серія", category: "photo", subcategory: "Арт-принт",
    price: "€350", priceNum: 350, seller: "Дарія Коваленко", sellerRating: 5.0, sellerReviews: 31,
    city: "Прага", country: "Чехія", emoji: "📷",
    description: "Лімітований фотопринт на музейному папері Hahnemühle. Тираж 25 примірників.",
    fullDescription: "Лімітований фотопринт на музейному папері Hahnemühle Photo Rag 308 г/м². Тираж 25 примірників, нумерація та підпис автора. Зображення зимових Карпат у золотому світлі заходу сонця. Сертифікат автентичності включено.",
    tags: ["фото", "принт", "лімітований", "Карпати"], condition: "Нова", featured: true, date: "1 день тому",
    views: 234, likes: 45, biddable: true, currentBid: 300, bidCount: 8,
    shippingOptions: ["Безкоштовна доставка по Європі"],
    reviews: [
      { author: "Олексій Р.", rating: 5, text: "Якість друку вражає. Рекомендую Дарію!", date: "5 днів тому" },
      { author: "Марта К.", rating: 5, text: "Ідеальна якість, пакування бездоганне.", date: "2 тижні тому" },
    ],
  },
  {
    id: 4, title: "Мольберт студійний великий, дерево", category: "inventory", subcategory: "Обладнання студії",
    price: "€45", priceNum: 45, seller: "Вікторія Савченко", sellerRating: 4.5, sellerReviews: 8,
    city: "Мадрид", country: "Іспанія", emoji: "🖼️",
    description: "Великий дерев'яний мольберт для роботи з полотнами до 180 см.",
    fullDescription: "Великий дерев'яний мольберт для роботи з полотнами до 180 см. У хорошому стані, є незначні сліди фарби. Самовивіз з Мадрида. Виробник: Mabef (Італія).",
    tags: ["мольберт", "студія", "б/у"], condition: "Б/у, гарний стан", featured: false, date: "1 тиждень тому",
    views: 67, likes: 5, shippingOptions: ["Тільки самовивіз — Мадрид"],
  },
  {
    id: 5, title: "Набір масляних фарб Winsor & Newton, 24 кольори", category: "materials", subcategory: "Фарби",
    price: "€95", priceNum: 95, seller: "Сергій Литвиненко", sellerRating: 4.8, sellerReviews: 19,
    city: "Мюнхен", country: "Німеччина", emoji: "🎨",
    description: "Професійний набір масляних фарб Winsor & Newton Artists' Oil Colour. 24 тюбики по 37 мл.",
    tags: ["фарби", "олія", "Winsor & Newton", "матеріали"], condition: "Новий", featured: false, date: "3 дні тому",
    views: 112, likes: 18, shippingOptions: ["Пошта (€8)", "Кур'єр (€14)"],
  },
  {
    id: 6, title: "Послуги пакування та доставки картин по Європі", category: "services", subcategory: "Логістика",
    price: "від €50", priceNum: 50, seller: "TransArt EU", sellerRating: 4.9, sellerReviews: 47,
    city: "Вся Європа", country: "", emoji: "📦",
    description: "Професійне пакування та доставка творів мистецтва по всій Європі.",
    fullDescription: "Професійне пакування та доставка творів мистецтва по всій Європі. Страхування вантажу. Досвід роботи з галереями та аукціонними домами. Індивідуальні рішення для кожного замовлення. Пряме забирання від клієнта.",
    tags: ["логістика", "доставка", "пакування", "страхування"], featured: true, date: "постійна",
    views: 432, likes: 67,
    reviews: [
      { author: "Галерея ArtSpace", rating: 5, text: "Працюємо постійно — бездоганна якість!", date: "1 тиждень тому" },
      { author: "Петро Д.", rating: 5, text: "Доставили делікатну скульптуру без пошкоджень.", date: "3 тижні тому" },
    ],
  },
  {
    id: 7, title: "Серія акварелей «Ботаніка», 5 аркушів", category: "painting", subcategory: "Акварель",
    price: "€680", priceNum: 680, seller: "Наталія Бондар", sellerRating: 4.6, sellerReviews: 11,
    city: "Лісабон", country: "Португалія", emoji: "🌿",
    description: "Серія з 5 ботанічних акварелей на папері Arches 300 г/м². Формат 30×40 см кожна.",
    tags: ["акварель", "ботаніка", "серія"], condition: "Нова робота", featured: false, date: "4 дні тому",
    views: 98, likes: 15, shippingOptions: ["Кур'єр по Європі (€25)"],
  },
  {
    id: 8, title: "Фотосесія для портфоліо митця", category: "services", subcategory: "Фотопослуги",
    price: "€200", priceNum: 200, seller: "Андрій Мельник", sellerRating: 4.8, sellerReviews: 22,
    city: "Берлін", country: "Німеччина", emoji: "📸",
    description: "Професійна фотосесія для портфоліо: зйомка робіт у студії або in-situ, портрет митця, ретуш та обробка.",
    tags: ["фото", "портфоліо", "студія"], featured: false, date: "6 днів тому",
    views: 145, likes: 21, shippingOptions: ["Послуга на місці — Берлін"],
  },
  {
    id: 9, title: "Набір для шовкографії, початківець", category: "inventory", subcategory: "Обладнання",
    price: "€120", priceNum: 120, seller: "Ольга Петренко", sellerRating: 4.4, sellerReviews: 6,
    city: "Амстердам", country: "Нідерланди", emoji: "🖌️",
    description: "Повний стартовий набір для шовкографії: рамка, сітка, ракель, емульсія, 4 кольори фарби.",
    tags: ["шовкографія", "друк", "набір"], condition: "Новий", featured: false, date: "2 тижні тому",
    views: 54, likes: 7, shippingOptions: ["Пошта (€12)"],
  },
  {
    id: 10, title: "Графіка тушшю «Місто вночі», 50×70", category: "painting", subcategory: "Графіка",
    price: "€420", priceNum: 420, seller: "Роман Шевченко", sellerRating: 4.9, sellerReviews: 28,
    city: "Париж", country: "Франція", emoji: "✒️",
    description: "Оригінальна графіка тушшю та пером. Детальне зображення нічного міста. Паспарту та рама в комплекті.",
    tags: ["графіка", "туш", "місто", "оригінал"], condition: "Нова робота", featured: true, date: "3 дні тому",
    views: 187, likes: 33, biddable: true, currentBid: 350, bidCount: 3,
    shippingOptions: ["Кур'єр (€20)", "Самовивіз — Париж"],
    reviews: [{ author: "Леся В.", rating: 5, text: "Роман — справжній майстер графіки!", date: "1 місяць тому" }],
  },
  {
    id: 11, title: "Керамічний посуд «Трипілля», сет 6 од.", category: "ceramics", subcategory: "Авторський посуд",
    price: "€340", priceNum: 340, seller: "Катерина Різник", sellerRating: 5.0, sellerReviews: 14,
    city: "Мюнхен", country: "Німеччина", emoji: "🍶",
    description: "Авторський набір посуду з трипільськими мотивами. 6 предметів.",
    tags: ["кераміка", "Трипілля", "посуд", "авторський"], condition: "Нова робота", featured: false, date: "1 тиждень тому",
    views: 123, likes: 19, shippingOptions: ["Кур'єр (€18)", "Самовивіз — Мюнхен"],
  },
  {
    id: 12, title: "Відеоарт «Потік» для виставки, 4K loop", category: "photo", subcategory: "Відеоарт",
    price: "€900", priceNum: 900, seller: "Максим Іваненко", sellerRating: 4.7, sellerReviews: 9,
    city: "Барселона", country: "Іспанія", emoji: "🎬",
    description: "Відеоарт у форматі 4K, безшовний loop тривалістю 12 хв. Тема — вода та рух.",
    tags: ["відеоарт", "4K", "виставка", "ліцензія"], condition: "Цифровий продукт", featured: false, date: "5 днів тому",
    views: 76, likes: 11, shippingOptions: ["Цифрова доставка"],
  },
];

export function getItemById(id: number): MarketItem | undefined {
  return items.find(i => i.id === id);
}
