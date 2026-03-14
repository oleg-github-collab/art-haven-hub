import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "./contexts/CartContext";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./i18n";
import Layout from "./components/Layout";
import CookieBanner from "./components/CookieBanner";
import Index from "./pages/Index";
import BoardPage from "./pages/BoardPage";
import ArtistsPage from "./pages/ArtistsPage";
import EventsPage from "./pages/EventsPage";
import MarketPage from "./pages/MarketPage";
import ProductPage from "./pages/ProductPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import FeedPage from "./pages/FeedPage";
import MessengerPage from "./pages/MessengerPage";
import UserProfilePage from "./pages/UserProfilePage";
import PricingPage from "./pages/PricingPage";
import ArtistDashboardPage from "./pages/ArtistDashboardPage";
import BlogPage from "./pages/BlogPage";
import AboutPage from "./pages/AboutPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import CookiesPage from "./pages/CookiesPage";
import RefundsPage from "./pages/RefundsPage";
import HelpPage from "./pages/HelpPage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import RoomVisualizerPage from "./pages/RoomVisualizerPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import PaymentErrorPage from "./pages/PaymentErrorPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
    <AuthProvider>
    <CartProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
              <Route path="/board" element={<BoardPage />} />
              <Route path="/artists" element={<ArtistsPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/feed" element={<FeedPage />} />
              <Route path="/market" element={<MarketPage />} />
              <Route path="/market/:id" element={<ProductPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/messenger" element={<MessengerPage />} />
              <Route path="/profile" element={<UserProfilePage />} />
              <Route path="/profile/:handle" element={<UserProfilePage />} />
              <Route path="/dashboard" element={<ArtistDashboardPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/cookies" element={<CookiesPage />} />
              <Route path="/refunds" element={<RefundsPage />} />
              <Route path="/help" element={<HelpPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/room-visualizer" element={<RoomVisualizerPage />} />
              <Route path="/payment/success" element={<PaymentSuccessPage />} />
              <Route path="/payment/error" element={<PaymentErrorPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          <CookieBanner />
        </BrowserRouter>
      </TooltipProvider>
    </CartProvider>
    </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
