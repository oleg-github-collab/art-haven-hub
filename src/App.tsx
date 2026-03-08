import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "./contexts/CartContext";
import Layout from "./components/Layout";
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
import AboutPage from "./pages/AboutPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import CookiesPage from "./pages/CookiesPage";
import RefundsPage from "./pages/RefundsPage";
import HelpPage from "./pages/HelpPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
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
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </CartProvider>
  </QueryClientProvider>
);

export default App;
