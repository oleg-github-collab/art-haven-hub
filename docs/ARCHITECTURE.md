# Мистецтво — Архітектура Frontend

## Зміст

1. [Огляд проекту](#огляд-проекту)
2. [Технологічний стек](#технологічний-стек)
3. [Структура проекту](#структура-проекту)
4. [Маршрутизація](#маршрутизація)
5. [Компоненти](#компоненти)
6. [Інтернаціоналізація (i18n)](#інтернаціоналізація)
7. [Стан додатку](#стан-додатку)
8. [Дизайн-система](#дизайн-система)
9. [Ключові фічі](#ключові-фічі)

---

## Огляд проекту

**Мистецтво** — це повнофункціональна платформа для українського мистецтва, що включає:
- Маркетплейс творів мистецтва з кошиком та оплатою
- AR-візуалізатор для розміщення картин в інтер'єрі
- Соціальну стрічку та месенджер
- Дашборд аналітики для митців
- Блог, події, профілі користувачів
- Мультимовний інтерфейс (UK, EN, DE, ES, FR)

## Технологічний стек

| Технологія | Призначення |
|---|---|
| **React 18** | UI бібліотека, function components + hooks |
| **TypeScript** | Типобезпечність на всіх рівнях |
| **Vite** | Збірка та dev-сервер (HMR) |
| **Tailwind CSS** | Утилітарний CSS з семантичними токенами |
| **shadcn/ui** | Компонентна бібліотека на базі Radix UI |
| **React Router v6** | Клієнтська маршрутизація |
| **TanStack React Query** | Серверний стан та кешування |
| **Framer Motion** | Анімації та переходи |
| **Recharts** | Графіки аналітики |
| **Lucide React** | Іконки |

## Структура проекту

```
src/
├── assets/              # Статичні файли (зображення)
├── components/
│   ├── ui/              # shadcn/ui базові компоненти (Button, Card, Dialog...)
│   ├── dashboard/       # Компоненти дашборду (AnalyticsCharts)
│   ├── profile/         # Компоненти профілю (ProfileInfo, EditProfileDialog...)
│   ├── Navbar.tsx        # Навігаційна панель
│   ├── Footer.tsx        # Футер
│   ├── Layout.tsx        # Обгортка з Navbar + Outlet + Footer
│   ├── ARPreview.tsx     # AR попередній перегляд
│   ├── CookieBanner.tsx  # Банер cookies
│   └── NavLink.tsx       # Навігаційне посилання
├── contexts/
│   └── CartContext.tsx   # Глобальний стан кошика (Context + localStorage)
├── data/
│   ├── chatData.ts      # Мок-дані месенджера
│   ├── feedData.ts      # Мок-дані стрічки
│   └── marketItems.ts   # Мок-дані маркетплейсу
├── hooks/
│   ├── use-mobile.tsx   # Визначення мобільного пристрою
│   └── use-toast.ts     # Toast-повідомлення
├── i18n/
│   ├── context.tsx      # LanguageProvider (React Context)
│   ├── index.ts         # Реекспорт
│   ├── types.ts         # TypeScript інтерфейс TranslationKeys
│   └── translations/    # UK, EN, DE, ES, FR словники
├── lib/
│   └── utils.ts         # cn() утиліта для className
├── pages/               # Сторінки-маршрути (див. Маршрутизація)
└── main.tsx             # Точка входу
```

## Маршрутизація

Всі маршрути обгорнуті в `<Layout />` (Navbar + Footer):

| Маршрут | Сторінка | Опис |
|---|---|---|
| `/` | `Index` | Головна сторінка |
| `/board` | `BoardPage` | Дошка оголошень |
| `/artists` | `ArtistsPage` | Каталог митців |
| `/events` | `EventsPage` | Події та виставки |
| `/feed` | `FeedPage` | Соціальна стрічка |
| `/market` | `MarketPage` | Маркетплейс |
| `/market/:id` | `ProductPage` | Деталі товару |
| `/cart` | `CartPage` | Кошик |
| `/checkout` | `CheckoutPage` | Оформлення замовлення |
| `/pricing` | `PricingPage` | Тарифні плани |
| `/messenger` | `MessengerPage` | Месенджер |
| `/profile` | `UserProfilePage` | Профіль поточного користувача |
| `/profile/:handle` | `UserProfilePage` | Профіль за handle |
| `/dashboard` | `ArtistDashboardPage` | Панель аналітики митця |
| `/blog` | `BlogPage` | Блог |
| `/about` | `AboutPage` | Про нас |
| `/terms` | `TermsPage` | Умови використання |
| `/privacy` | `PrivacyPage` | Політика конфіденційності |
| `/cookies` | `CookiesPage` | Політика cookies |
| `/refunds` | `RefundsPage` | Політика повернень |
| `/help` | `HelpPage` | Довідка |
| `/login` | `LoginPage` | Вхід |
| `/signup` | `SignUpPage` | Реєстрація |
| `/room-visualizer` | `RoomVisualizerPage` | AR розміщення картин в кімнаті |
| `/payment/success` | `PaymentSuccessPage` | Успішна оплата |
| `/payment/error` | `PaymentErrorPage` | Помилка оплати |
| `*` | `NotFound` | 404 |

## Компоненти

### Архітектурні паттерни

1. **Composition** — Layout обгортає всі сторінки через `<Outlet />`
2. **Provider pattern** — `CartProvider`, `LanguageProvider`, `QueryClientProvider`, `TooltipProvider`
3. **Controlled components** — форми з React state
4. **Custom hooks** — `useCart()`, `useLanguage()`, `useMobile()`

### UI компоненти (shadcn/ui)

Повний набір: `Button`, `Card`, `Dialog`, `Sheet`, `Tabs`, `Select`, `Input`, `Textarea`, `Badge`, `Avatar`, `Accordion`, `Alert`, `Carousel`, `Checkbox`, `DropdownMenu`, `Form`, `HoverCard`, `Popover`, `Progress`, `RadioGroup`, `ScrollArea`, `Separator`, `Skeleton`, `Slider`, `Switch`, `Table`, `Toggle`, `Tooltip`.

## Інтернаціоналізація

### Підтримувані мови
- 🇺🇦 Українська (UK) — за замовчуванням
- 🇬🇧 English (EN)
- 🇩🇪 Deutsch (DE)
- 🇪🇸 Español (ES)
- 🇫🇷 Français (FR)

### Як працює

```tsx
// Використання в компоненті
const { t, language, setLanguage } = useLanguage();
return <h1>{t('hero_title')}</h1>;
```

Всі ключі типізовані через `TranslationKeys` інтерфейс у `src/i18n/types.ts`. Додавання нового ключа вимагає оновлення типу та всіх 5 словників.

## Стан додатку

| Тип стану | Механізм | Приклад |
|---|---|---|
| **UI стан** | `useState` / `useReducer` | Відкриття модалок, активна вкладка |
| **Кошик** | `CartContext` + `localStorage` | Товари, кількість, total |
| **Мова** | `LanguageContext` + `localStorage` | Поточна мова інтерфейсу |
| **Серверний стан** | `React Query` (підготовлено) | Буде використовуватись з бекендом |

## Дизайн-система

### Семантичні токени (index.css)

```css
:root {
  --background, --foreground
  --primary, --primary-foreground
  --secondary, --secondary-foreground
  --muted, --muted-foreground
  --accent, --accent-foreground
  --destructive
  --border, --input, --ring
  --card, --card-foreground
  --popover, --popover-foreground
}
```

### Правила
- **Ніколи** не використовувати кольори напряму (`text-white`, `bg-black`)
- **Завжди** використовувати семантичні токени (`text-foreground`, `bg-background`)
- Всі кольори в HSL форматі
- Підтримка light/dark режимів через CSS variables

## Ключові фічі

### AR Візуалізатор кімнати (`/room-visualizer`)
- Завантаження фото кімнати через file input
- Drag & drop картини по зображенню кімнати
- Pinch-to-zoom масштабування на мобільних
- Вибір стилю рамки (6 варіантів)
- Відображення реальних розмірів у см

### Аналітика митця (`/dashboard`)
- Перемикання періодів: тиждень / місяць / рік
- AreaChart та BarChart (Recharts)
- Bulk-операції з роботами

### Кошик та Checkout
- Додавання товарів з маркетплейсу
- Зміна кількості, видалення
- Збереження в localStorage
- Сторінки успіху/помилки оплати

### Автентифікація (UI)
- Split-screen дизайн для desktop
- Google/Apple соціальні кнопки
- Індикатор складності пароля
- Framer Motion анімації
