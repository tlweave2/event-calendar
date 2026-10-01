"use client";

import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { FormEvent, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthShell from "@/components/AuthShell";

export default function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const invited = searchParams.get("invited") === "1";
  const [googleLoading, setGoogleLoading] = useState(false);
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
          {invited && !error && (
            <div className="border-l-2 border-gray-900 bg-white px-3 py-2 text-sm text-gray-700">
              Invitation accepted. Sign in with the email address it was sent to
              {googleEnabled ? ", using Google if that address is a Google account." : "."}
            </div>
          )}

          {error && (
            <div className="border-l-2 border-red-700 bg-red-50 px-3 py-2 text-sm text-red-800">
              {errorMessage(error)}
            </div>
          )}

          {googleEnabled && (
            <>
              <button
                type="button"
                onClick={() => {
                  setGoogleLoading(true);
                  signIn("google", { redirectTo: callbackUrl });
                }}
                disabled={googleLoading}
                className="flex w-full items-center justify-center gap-2 rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:border-gray-900 disabled:opacity-60"
              >
                <GoogleMark />
                {googleLoading ? "Redirecting…" : "Continue with Google"}
              </button>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="h-px flex-1 bg-gray-200" />
                or use your password
                <span className="h-px flex-1 bg-gray-200" />
              </div>
            </>
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

function errorMessage(error: string): string {
  switch (error) {
    case "NoAccount":
      return "There's no Eventful account for that Google address. Ask the calendar's owner to invite you, or start a new calendar.";
    case "GoogleUnverified":
      return "Google hasn't verified that email address, so we can't use it to sign you in.";
    case "OAuthSignin":
    case "OAuthCallback":
    case "OAuthAccountNotLinked":
    case "AccessDenied":
      return "Google sign-in didn't complete. Please try again.";
    case "MissingCSRF":
      return "Something went wrong. Please try again.";
    default:
      return "Invalid email or password. Please try again.";
  }
}

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
