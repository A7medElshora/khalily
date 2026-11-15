import { useState } from "react";
import type { FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { ArrowLeft, LockKeyhole, Mail, Sparkles, UserRound } from "lucide-react";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AuthGateProps {
  language: "ar" | "en";
  onClose: () => void;
  onAuthenticated: (session: Session) => void;
}

const googleMark = (
  <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18">
    <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
    <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
  </svg>
);

export function AuthGate({ language, onClose, onAuthenticated }: AuthGateProps) {
  const isArabic = language === "ar";
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (mode === "sign-up") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: name },
          },
        });
        if (signUpError) throw signUpError;
        if (data.session) {
          onAuthenticated(data.session);
          return;
        }
        setNotice(isArabic ? "تحقق من بريدك الإلكتروني لتأكيد حسابك." : "Check your email to confirm your account.");
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        if (data.session) onAuthenticated(data.session);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : (isArabic ? "تعذر تسجيل الدخول." : "Unable to sign in."));
    } finally {
      setBusy(false);
    }
  }

  async function socialSignIn(provider: "google" | "lovable") {
    setBusy(true);
    setError("");
    try {
      const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin });
      if (result.error) throw result.error;
      if (result.redirected) return;
      const { data } = await supabase.auth.getSession();
      if (data.session) onAuthenticated(data.session);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : (isArabic ? "تعذر تسجيل الدخول." : "Unable to sign in."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-foreground/35 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="w-full max-w-md border border-border bg-card p-6 shadow-xl sm:p-8" dir={language} aria-labelledby="auth-heading">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="brand-mark bg-primary text-primary-foreground"><Sparkles size={17} /></div>
            <span className="font-display text-2xl">MIRROR / ROOM</span>
          </div>
          <Button variant="ghost" size="icon" aria-label={isArabic ? "رجوع" : "Back"} onClick={onClose}><ArrowLeft /></Button>
        </div>
        <p className="mb-2 text-xs font-semibold uppercase text-primary">{isArabic ? "مساحة المتجر" : "STORE ACCESS"}</p>
        <h2 id="auth-heading" className="font-display text-4xl leading-tight">{mode === "sign-up" ? (isArabic ? "أنشئ حساب متجرك" : "Create your store account") : (isArabic ? "مرحباً بعودتك" : "Welcome back")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{isArabic ? "سجّل دخولك لإدارة المنتجات والإعدادات بأمان." : "Sign in to manage your products and store settings securely."}</p>

        <div className="mt-6 grid gap-3">
          <Button type="button" variant="outline" className="provider-google h-11" disabled={busy} onClick={() => void socialSignIn("google")}>
            {googleMark}{isArabic ? "المتابعة باستخدام Google" : "Continue with Google"}
          </Button>
          <Button type="button" variant="outline" className="h-11" disabled={busy} onClick={() => void socialSignIn("lovable")}>
            <Sparkles size={17} />{isArabic ? "المتابعة باستخدام Lovable" : "Continue with Lovable"}
          </Button>
        </div>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />{isArabic ? "أو بالبريد الإلكتروني" : "OR WITH EMAIL"}<span className="h-px flex-1 bg-border" /></div>

        <form className="grid gap-4" onSubmit={(event) => void submit(event)}>
          {mode === "sign-up" && <label className="form-field"><span className="field-label">{isArabic ? "اسم المتجر" : "Store owner name"}</span><span className="relative"><UserRound className="absolute start-3 top-2.5 text-muted-foreground" size={17} /><Input className="ps-10" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required /></span></label>}
          <label className="form-field"><span className="field-label">{isArabic ? "البريد الإلكتروني" : "Email address"}</span><span className="relative"><Mail className="absolute start-3 top-2.5 text-muted-foreground" size={17} /><Input className="ps-10" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></span></label>
          <label className="form-field"><span className="field-label">{isArabic ? "كلمة المرور" : "Password"}</span><span className="relative"><LockKeyhole className="absolute start-3 top-2.5 text-muted-foreground" size={17} /><Input className="ps-10" type="password" autoComplete={mode === "sign-up" ? "new-password" : "current-password"} minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required /></span></label>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          {notice && <p role="status" className="text-sm text-primary">{notice}</p>}
          <Button type="submit" className="h-11" disabled={busy}>{busy ? (isArabic ? "جارٍ المعالجة…" : "Working…") : mode === "sign-up" ? (isArabic ? "إنشاء الحساب" : "Create account") : (isArabic ? "تسجيل الدخول" : "Sign in")}</Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          {mode === "sign-up" ? (isArabic ? "لديك حساب؟ " : "Already have an account? ") : (isArabic ? "جديد على MIRROR / ROOM؟ " : "New to MIRROR / ROOM? ")}
          <button className="font-semibold text-primary underline-offset-4 hover:underline" type="button" onClick={() => { setMode(mode === "sign-up" ? "sign-in" : "sign-up"); setError(""); setNotice(""); }}>
            {mode === "sign-up" ? (isArabic ? "تسجيل الدخول" : "Sign in") : (isArabic ? "إنشاء حساب" : "Create an account")}
          </button>
        </p>
        <p className="mt-5 text-center text-xs text-muted-foreground">{isArabic ? "تأكيد البريد الإلكتروني مفعّل لحماية الحسابات." : "Email confirmation is on to protect new accounts."}</p>
      </section>
    </div>
  );
}