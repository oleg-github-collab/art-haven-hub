import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, ArrowRight, Shield, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalItems, totalPrice, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="container py-20 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
            <ShoppingBag className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="mb-2 text-2xl font-bold">Кошик порожній</h1>
          <p className="mb-6 text-muted-foreground">Додайте товари з маркету</p>
          <Button asChild>
            <Link to="/market"><ArrowLeft className="mr-2 h-4 w-4" /> Перейти до маркету</Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="py-10 lg:py-16">
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="mb-2 text-3xl font-bold">Кошик</h1>
          <p className="mb-8 text-muted-foreground">{totalItems} {totalItems === 1 ? "товар" : "товарів"}</p>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex gap-4 rounded-xl border border-border bg-card/80 p-4 backdrop-blur-sm"
                style={{ boxShadow: "var(--card-shadow)" }}
              >
                <Link to={`/market/${item.id}`} className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-secondary/60 text-3xl hover:scale-105 transition-transform">
                  {item.emoji}
                </Link>
                <div className="flex flex-1 flex-col justify-between min-w-0">
                  <div>
                    <Link to={`/market/${item.id}`} className="text-sm font-semibold font-sans hover:text-primary transition-colors line-clamp-2">
                      {item.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">{item.seller}</p>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center rounded-lg border border-input">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-7 text-center text-sm font-medium">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-base font-bold text-primary font-sans">€{(item.priceNum * item.quantity).toLocaleString()}</span>
                      <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            <div className="flex justify-between pt-2">
              <Button variant="ghost" size="sm" onClick={clearCart} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Очистити кошик
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/market"><ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Продовжити покупки</Link>
              </Button>
            </div>
          </div>

          {/* Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="sticky top-20 rounded-2xl border border-border bg-card/80 p-6 backdrop-blur-xl" style={{ boxShadow: "var(--card-shadow)" }}>
              <h2 className="mb-4 text-lg font-semibold font-sans">Підсумок</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Товари ({totalItems})</span>
                  <span className="font-medium">€{totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Доставка</span>
                  <span className="text-xs text-muted-foreground">розрах. при оформленні</span>
                </div>
              </div>
              <Separator className="my-4" />
              <div className="flex justify-between text-lg font-bold">
                <span>Разом</span>
                <span className="text-primary font-sans">€{totalPrice.toLocaleString()}</span>
              </div>
              <Button className="mt-5 w-full gap-2" size="lg" asChild>
                <Link to="/checkout">
                  Оформити замовлення
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <p className="mt-3 text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Shield className="h-3 w-3" /> Безпечна оплата через Stripe
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
