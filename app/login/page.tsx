"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Zap } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    // Auto login as admin for demonstration
    const res = await signIn("credentials", {
       email: "admin@ledgerflow.io",
       password: "admin",
       redirect: false
    });
    
    if (res?.ok) {
       router.push("/dashboard");
    }
    
    setLoading(false);
  };

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
              defaultValue="admin@ledgerflow.io" 
              required 
            />
            
            <Input 
              label="Password" 
              name="password" 
              type="password" 
              defaultValue="admin" 
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

              <div className="text-sm">
                <a href="#" className="font-medium text-accent-orange hover:text-[#FF9A40]">
                  Forgot password?
                </a>
              </div>
            </div>

            <Button type="submit" className="w-full justify-center text-sm" disabled={loading}>
              {loading ? "Signing in..." : "Sign in (Demo Admin)"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
