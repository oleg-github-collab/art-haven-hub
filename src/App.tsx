import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "./contexts/CartContext";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./i18n";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import CookieBanner from "./components/CookieBanner";
import { Loader2 } from "lucide-react";

// Lazy-loaded pages — each becomes a separate chunk
const Index = lazy(() => import("./pages/Index"));
const BoardPage = lazy(() => import("./pages/BoardPage"));
const ArtistsPage = lazy(() => import("./pages/ArtistsPage"));
const EventsPage = lazy(() => import("./pages/EventsPage"));
const MarketPage = lazy(() => import("./pages/MarketPage"));
const ProductPage = lazy(() => import("./pages/ProductPage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const FeedPage = lazy(() => import("./pages/FeedPage"));
const MessengerPage = lazy(() => import("./pages/MessengerPage"));
const UserProfilePage = lazy(() => import("./pages/UserProfilePage"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const ArtistDashboardPage = lazy(() => import("./pages/ArtistDashboardPage"));
const BlogPage = lazy(() => import("./pages/BlogPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const CookiesPage = lazy(() => import("./pages/CookiesPage"));
const RefundsPage = lazy(() => import("./pages/RefundsPage"));
const HelpPage = lazy(() => import("./pages/HelpPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignUpPage = lazy(() => import("./pages/SignUpPage"));
const RoomVisualizerPage = lazy(() => import("./pages/RoomVisualizerPage"));
const PaymentSuccessPage = lazy(() => import("./pages/PaymentSuccessPage"));
const PaymentErrorPage = lazy(() => import("./pages/PaymentErrorPage"));
const WorkflowBuilderPage = lazy(() => import("./pages/WorkflowBuilderPage"));
const SocialHubPage = lazy(() => import("./pages/SocialHubPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

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
          <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route element={<Layout />}>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/board" element={<BoardPage />} />
              <Route path="/market" element={<MarketPage />} />
              <Route path="/market/:id" element={<ProductPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/cookies" element={<CookiesPage />} />
              <Route path="/refunds" element={<RefundsPage />} />
              <Route path="/help" element={<HelpPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignUpPage />} />

              {/* Protected routes — require authentication */}
              <Route path="/feed" element={<ProtectedRoute><FeedPage /></ProtectedRoute>} />
              <Route path="/artists" element={<ProtectedRoute><ArtistsPage /></ProtectedRoute>} />
              <Route path="/events" element={<ProtectedRoute><EventsPage /></ProtectedRoute>} />
              <Route path="/messenger" element={<ProtectedRoute><MessengerPage /></ProtectedRoute>} />
              <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
              <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />
              <Route path="/profile/:handle" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><ArtistDashboardPage /></ProtectedRoute>} />
              <Route path="/blog" element={<ProtectedRoute><BlogPage /></ProtectedRoute>} />
              <Route path="/room-visualizer" element={<ProtectedRoute><RoomVisualizerPage /></ProtectedRoute>} />
              <Route path="/payment/success" element={<ProtectedRoute><PaymentSuccessPage /></ProtectedRoute>} />
              <Route path="/payment/error" element={<ProtectedRoute><PaymentErrorPage /></ProtectedRoute>} />
              <Route path="/social-hub" element={<ProtectedRoute><SocialHubPage /></ProtectedRoute>} />
              <Route path="/workflow-builder" element={<ProtectedRoute><WorkflowBuilderPage /></ProtectedRoute>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
          <CookieBanner />
        </BrowserRouter>
      </TooltipProvider>
    </CartProvider>
    </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
