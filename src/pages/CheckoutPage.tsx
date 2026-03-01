import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CreditCard, Shield, Lock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

export default function CheckoutPage() {
  const { items, totalItems, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (items.length === 0 && !done) {
    navigate("/cart");
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setDone(true);
      clearCart();
      toast.success("Замовлення оформлено!");
    }, 1500);
  };

  if (done) {
    return (
      <div className="container py-20 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle className="h-10 w-10 text-primary" />
          </div>
          <h1 className="mb-2 text-2xl font-bold">Замовлення оформлено!</h1>
          <p className="mb-6 text-muted-foreground">Продавці зв'яжуться з вами найближчим часом.</p>
          <Button asChild><Link to="/market">Повернутись до маркету</Link></Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="py-10 lg:py-16">
      <div className="container max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link to="/cart"><ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Назад до кошика</Link>
          </Button>
          <h1 className="mb-8 text-3xl font-bold">Оформлення</h1>
        </motion.div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-8 lg:grid-cols-5">
            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-3 space-y-6"
            >
              {/* Contact */}
              <div className="rounded-2xl border border-border bg-card/80 p-6 backdrop-blur-sm" style={{ boxShadow: "var(--card-shadow)" }}>
                <h2 className="mb-4 text-lg font-semibold font-sans">Контактна інформація</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Ім'я</Label>
                    <Input id="firstName" required className="bg-background/60" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Прізвище</Label>
                    <Input id="lastName" required className="bg-background/60" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" required className="bg-background/60" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="phone">Телефон</Label>
                    <Input id="phone" type="tel" className="bg-background/60" />
                  </div>
                </div>
              </div>

              {/* Shipping */}
              <div className="rounded-2xl border border-border bg-card/80 p-6 backdrop-blur-sm" style={{ boxShadow: "var(--card-shadow)" }}>
                <h2 className="mb-4 text-lg font-semibold font-sans">Адреса доставки</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="address">Адреса</Label>
                    <Input id="address" required className="bg-background/60" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Місто</Label>
                    <Input id="city" required className="bg-background/60" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip">Поштовий індекс</Label>
                    <Input id="zip" required className="bg-background/60" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="country">Країна</Label>
                    <Input id="country" required className="bg-background/60" />
                  </div>
                </div>
              </div>

              {/* Payment */}
              <div className="rounded-2xl border border-border bg-card/80 p-6 backdrop-blur-sm" style={{ boxShadow: "var(--card-shadow)" }}>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold font-sans">
                  <CreditCard className="h-5 w-5 text-primary" /> Оплата
                </h2>
                <div className="rounded-xl border border-dashed border-border bg-secondary/30 p-8 text-center">
                  <Lock className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Безпечна оплата через Stripe</p>
                  <p className="mt-1 text-xs text-muted-foreground">Підключіть Cloud для активації платежів</p>
                </div>
              </div>
            </motion.div>

            {/* Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2"
            >
              <div className="sticky top-20 rounded-2xl border border-border bg-card/80 p-6 backdrop-blur-xl" style={{ boxShadow: "var(--card-shadow)" }}>
                <h2 className="mb-4 text-lg font-semibold font-sans">Ваше замовлення</h2>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {items.map(item => (
                    <div key={item.id} className="flex items-center gap-3">
                      <span className="text-2xl">{item.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground">×{item.quantity}</p>
                      </div>
                      <span className="text-sm font-semibold font-sans">€{(item.priceNum * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <Separator className="my-4" />
                <div className="flex justify-between text-lg font-bold">
                  <span>Разом</span>
                  <span className="text-primary font-sans">€{totalPrice.toLocaleString()}</span>
                </div>
                <Button type="submit" className="mt-5 w-full" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? "Обробка…" : `Оплатити €${totalPrice.toLocaleString()}`}
                </Button>
                <p className="mt-3 text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <Shield className="h-3 w-3" /> Захищено SSL шифруванням
                </p>
              </div>
            </motion.div>
          </div>
        </form>
      </div>
    </div>
  );
}
