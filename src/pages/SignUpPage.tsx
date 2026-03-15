import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Palette, Check, X, AtSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/i18n";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import heroArt from "@/assets/hero-art.jpg";

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters", met: password.length >= 8 },
    { label: "Uppercase", met: /[A-Z]/.test(password) },
    { label: "Number", met: /\d/.test(password) },
    { label: "Special char", met: /[^A-Za-z0-9]/.test(password) },
  ];
  const strength = checks.filter(c => c.met).length;
  const colors = ["bg-destructive", "bg-destructive", "bg-yellow-500", "bg-green-500", "bg-green-500"];

  if (!password) return null;

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-2 pt-1">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < strength ? colors[strength] : "bg-muted"}`} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1">
        {checks.map(c => (
          <span key={c.label} className={`flex items-center gap-1 text-[11px] ${c.met ? "text-green-600" : "text-muted-foreground"}`}>
            {c.met ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
            {c.label}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

export default function SignUpPage() {
  const { t } = useLanguage();
  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/";
  const [showPass, setShowPass] = useState(false);
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [handle, setHandle] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = () => {
    const google = (window as any).google;
    if (!google?.accounts?.id) {
      toast.error("Google Sign-In is not loaded yet");
      return;
    }
    google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: async (response: any) => {
        try {
          await googleLogin(response.credential);
          navigate(returnTo);
        } catch (err: any) {
          toast.error(err.message || "Google sign-up failed");
        }
      },
    });
    google.accounts.id.prompt();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register({
        email,
        password,
        handle: handle || email.split("@")[0],
        display_name: `${firstName} ${lastName}`.trim(),
      });
      navigate(returnTo);
    } catch (err: any) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      {/* Left — Art panel */}
      <div className="relative hidden w-1/2 lg:block">
        <img src={heroArt} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-foreground/70 via-foreground/50 to-primary/30" />
        <div className="relative z-10 flex h-full flex-col justify-between p-12">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/20 backdrop-blur-sm border border-primary-foreground/10">
              <Palette className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold font-serif text-primary-foreground">{t.common.platform_name}</span>
          </Link>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="mb-8 space-y-4">
              {[t.auth.benefit_1, t.auth.benefit_2, t.auth.benefit_3].map((b, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.15 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/15 backdrop-blur-sm">
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <span className="text-sm text-primary-foreground/85">{b}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-8">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-md">
          <Link to="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-md">
              <Palette className="h-4.5 w-4.5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold font-serif">{t.common.platform_name}</span>
          </Link>

          <h1 className="mb-2 text-3xl font-bold">{t.auth.signup_title}</h1>
          <p className="mb-8 text-muted-foreground">{t.auth.signup_desc}</p>

          <div className="mb-6">
            <Button variant="outline" className="w-full h-11 gap-2 font-medium" onClick={handleGoogleLogin}>
              <svg className="h-4.5 w-4.5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              {t.auth.google_login || "Continue with Google"}
            </Button>
          </div>

          <div className="relative mb-6">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground">
              {t.auth.or_email}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName">{t.auth.first_name}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="firstName" className="pl-10 h-11" required value={firstName} onChange={e => setFirstName(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">{t.auth.last_name}</Label>
                <Input id="lastName" className="h-11" required value={lastName} onChange={e => setLastName(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t.auth.email}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="you@example.com" className="pl-10 h-11" required value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="handle">Handle</Label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="handle" placeholder="your_handle" className="pl-10 h-11" value={handle} onChange={e => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t.auth.password}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <PasswordStrength password={password} />
            </div>

            <div className="flex items-start gap-2">
              <Checkbox id="terms" className="mt-0.5" />
              <Label htmlFor="terms" className="text-sm font-normal leading-relaxed cursor-pointer">
                {t.auth.agree_terms}{" "}
                <Link to="/terms" className="text-primary hover:underline">{t.auth.terms_link}</Link>
                {" & "}
                <Link to="/privacy" className="text-primary hover:underline">{t.auth.privacy_link}</Link>
              </Label>
            </div>

            <Button type="submit" className="w-full h-11 text-sm font-semibold gap-2" disabled={loading}>
              {loading ? "..." : t.auth.signup_btn}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t.auth.have_account}{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              {t.auth.login_link}
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
