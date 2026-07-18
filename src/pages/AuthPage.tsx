import { useState, useEffect } from "react";
import { useNavigate, Navigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { Zap, Mail, Lock, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const signInSchema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "At least 6 characters").max(128),
});

const signUpSchema = signInSchema.extend({
  displayName: z.string().trim().min(1, "Required").max(80),
});

export default function AuthPage() {
  const { user, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [busy, setBusy] = useState(false);

  const rawNext = searchParams.get("next");
  const next = rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  const [signInData, setSignInData] = useState({ email: "", password: "" });
  const [signUpData, setSignUpData] = useState({ email: "", password: "", displayName: "" });

  useEffect(() => {
    if (!loading && user) navigate(next, { replace: true });
  }, [user, loading, navigate, next]);

  if (loading) return null;
  if (user) return <Navigate to={next} replace />;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signInSchema.safeParse(signInData);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    const { error } = await signIn(parsed.data.email, parsed.data.password);
    setBusy(false);
    if (error) toast.error(error);
    else {
      toast.success("Welcome back");
      navigate(next, { replace: true });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signUpSchema.safeParse(signUpData);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    const { error } = await signUp(parsed.data.email, parsed.data.password, parsed.data.displayName);
    setBusy(false);
    if (error) toast.error(error);
    else {
      toast.success("Account created");
      navigate(next, { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground">BrainPay OS</h1>
            <p className="text-[11px] text-muted-foreground font-mono">Hybrid Financial OS</p>
          </div>
        </div>

        <div className="card-gradient rounded-xl border border-border p-6">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid grid-cols-2 w-full mb-5">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Create Account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-3">
                <Field icon={Mail}>
                  <Input type="email" placeholder="you@example.com" autoComplete="email"
                    value={signInData.email}
                    onChange={(e) => setSignInData({ ...signInData, email: e.target.value })} />
                </Field>
                <Field icon={Lock}>
                  <Input type="password" placeholder="Password" autoComplete="current-password"
                    value={signInData.password}
                    onChange={(e) => setSignInData({ ...signInData, password: e.target.value })} />
                </Field>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-3">
                <Field icon={UserIcon}>
                  <Input placeholder="Display name" autoComplete="name"
                    value={signUpData.displayName}
                    onChange={(e) => setSignUpData({ ...signUpData, displayName: e.target.value })} />
                </Field>
                <Field icon={Mail}>
                  <Input type="email" placeholder="you@example.com" autoComplete="email"
                    value={signUpData.email}
                    onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })} />
                </Field>
                <Field icon={Lock}>
                  <Input type="password" placeholder="Password (min 6)" autoComplete="new-password"
                    value={signUpData.password}
                    onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })} />
                </Field>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Creating account…" : "Create account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        <p className="text-center text-[11px] text-muted-foreground mt-4 font-mono">
          Secured by Lovable Cloud · v1.0.0-mvp
        </p>
      </div>
    </div>
  );
}

function Field({ icon: Icon, children }: { icon: any; children: React.ReactNode }) {
  return (
    <div className="relative">
      <Icon className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="[&>input]:pl-9">{children}</div>
    </div>
  );
}
