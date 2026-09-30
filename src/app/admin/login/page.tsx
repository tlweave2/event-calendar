"use client";

import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { FormEvent, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthShell from "@/components/AuthShell";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const callbackUrl = searchParams.get("callbackUrl") ?? "/admin";
  const [credLoading, setCredLoading] = useState(false);
  const [credEmail, setCredEmail] = useState("");
  const [credPassword, setCredPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleCredentialsSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCredLoading(true);
    try {
      await signIn("credentials", {
        email: credEmail,
        password: credPassword,
        redirect: true,
        redirectTo: callbackUrl,
      });
    } catch {
      alert("Login failed");
      setCredLoading(false);
    }
  };

  return (
    <AuthShell
      title="Sign in"
      footer={
        <>
          New to Eventful?{" "}
          <a href="/signup" className="font-medium text-gray-900 underline">
            Start a calendar
          </a>
        </>
      }
    >
        <div className="space-y-4">
          {error && error !== "OAuthSignin" && error !== "OAuthCallback" && (
            <div className="border-l-2 border-red-700 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error === "MissingCSRF"
                ? "Something went wrong. Please try again."
                : "Invalid email or password. Please try again."}
            </div>
          )}

          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@organization.org"
                value={credEmail}
                onChange={(e) => setCredEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={credPassword}
                  onChange={(e) => setCredPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={credLoading}
            >
              {credLoading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>
    </AuthShell>
  );
}
