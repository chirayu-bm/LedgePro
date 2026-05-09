"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { Apple, Chrome, Github, LucideIcon, Zap } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getActiveTenantSlug, setActiveTenantSlug } from "@/lib/api-client";

type SocialProvider = {
  id: string;
  name: string;
  enabled: boolean;
};

const PROVIDER_UI: Record<string, { label: string; icon: LucideIcon }> = {
  google: { label: "Google", icon: Chrome },
  github: { label: "GitHub", icon: Github },
  apple: { label: "Apple", icon: Apple }
};

const DEFAULT_SOCIAL_PROVIDER_IDS = ["google", "github", "apple"];

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tenantSlug, setTenantSlug] = useState(() => getActiveTenantSlug());
  const [error, setError] = useState<string | null>(null);
  const [socialProviders, setSocialProviders] = useState<SocialProvider[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadProviders = async () => {
      try {
        const response = await fetch("/api/auth/providers", { cache: "no-store" });
        if (!response.ok) return;

        const providers = (await response.json()) as Record<string, { id?: string; name?: string }>;
        const availableProviderIds = new Set(
          Object.entries(providers)
            .map(([id]) => id)
            .filter((id) => id !== "credentials")
        );

        const baseProviders: SocialProvider[] = DEFAULT_SOCIAL_PROVIDER_IDS.map((id) => ({
          id,
          name: PROVIDER_UI[id]?.label ?? id,
          enabled: availableProviderIds.has(id)
        }));

        const customProviders = Object.entries(providers)
          .map(([id, provider]) => ({ id, name: provider.name ?? id }))
          .filter((provider) => provider.id !== "credentials" && !DEFAULT_SOCIAL_PROVIDER_IDS.includes(provider.id))
          .map((provider) => ({ ...provider, enabled: true }));

        if (!cancelled) {
          setSocialProviders([...baseProviders, ...customProviders]);
        }
      } catch {
        if (!cancelled) {
          setSocialProviders(
            DEFAULT_SOCIAL_PROVIDER_IDS.map((id) => ({
              id,
              name: PROVIDER_UI[id]?.label ?? id,
              enabled: false
            }))
          );
        }
      }
    };

    void loadProviders();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const normalizedTenant = tenantSlug.trim() || "demo-sme";
    setActiveTenantSlug(normalizedTenant);

    const res = await signIn("credentials", {
      email,
      password,
      tenantSlug: normalizedTenant,
      redirect: false,
    });

    if (res?.ok) {
      router.push("/dashboard");
      return;
    }

    setError("Invalid credentials or backend unavailable.");
    setLoading(false);
  };

  const handleProviderSignIn = async (providerId: string) => {
    setError(null);
    await signIn(providerId, { callbackUrl: "/dashboard" });
  };

  const socialHint =
    socialProviders.some((provider) => !provider.enabled)
      ? "Add AUTH_GOOGLE_*, AUTH_GITHUB_*, or AUTH_APPLE_* env vars to enable social sign-in."
      : null;

  return (
    <div className="min-h-screen bg-bg-main flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background Orbs */}
      <div className="absolute top-0 left-1/2 w-96 h-96 bg-accent-orange/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl gradient-orange flex items-center justify-center">
              <Zap size={22} className="text-white" />
            </div>
            <span className="text-2xl font-bold font-[family-name:var(--font-space-grotesk)] text-white">
              LedgerFlow
            </span>
        </Link>
        <h2 className="text-3xl font-bold tracking-tight text-white font-[family-name:var(--font-space-grotesk)]">
          Sign in to your account
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          Premium Financial Operating System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="glass p-8 shadow-soft">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <Input 
              label="Email address" 
              name="email" 
              type="email" 
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required 
            />
            
            <Input 
              label="Password" 
              name="password" 
              type="password" 
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required 
            />

            <Input
              label="Workspace slug"
              name="tenant-slug"
              type="text"
              value={tenantSlug}
              onChange={(event) => setTenantSlug(event.target.value)}
              placeholder="demo-sme"
              required
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-glass-border bg-white/5 text-accent-orange focus:ring-accent-orange/50"
                  defaultChecked
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-text-secondary">
                  Remember me
                </label>
              </div>

              <p className="text-xs text-text-muted">Choose the workspace slug you want to access.</p>
            </div>

            {error && (
              <p className="rounded-lg border border-accent-red/40 bg-accent-red/10 px-3 py-2 text-sm text-accent-red">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full justify-center text-sm" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>

            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-glass-border/70" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-[0.18em] text-text-muted">
                <span className="bg-bg-main px-2">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {socialProviders.map((provider) => {
                const ui = PROVIDER_UI[provider.id];
                const Icon = ui?.icon;
                const label = ui?.label ?? provider.name;

                return (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => {
                      if (!provider.enabled) return;
                      void handleProviderSignIn(provider.id);
                    }}
                    className={`inline-flex h-11 items-center justify-center rounded-xl border border-glass-border text-text-secondary transition-colors ${
                      provider.enabled
                        ? "glass glass-hover hover:text-white"
                        : "bg-white/5 cursor-not-allowed opacity-55"
                    }`}
                    aria-label={provider.enabled ? `Continue with ${label}` : `${label} not configured`}
                    title={provider.enabled ? `Continue with ${label}` : `${label} not configured`}
                    disabled={!provider.enabled}
                  >
                    {Icon ? <Icon size={18} /> : <span className="text-xs font-semibold">{label.slice(0, 2).toUpperCase()}</span>}
                  </button>
                );
              })}
            </div>

            {socialHint && <p className="text-xs text-text-muted">{socialHint}</p>}

            <p className="text-xs text-text-muted">
              Use credentials provided by your workspace admin.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
