"use client";

import { useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const isDev = process.env.NODE_ENV === "development";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const verify = searchParams.get("verify");
  const [credLoading, setCredLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [credEmail, setCredEmail] = useState("admin@test.com");

  const handleCredentialsSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCredLoading(true);

    const formData = new FormData();
    formData.append("email", credEmail);

    try {
      const response = await fetch("/api/auth/signin/credentials", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        window.location.href = "/admin";
      } else {
        alert("Login failed");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred");
    } finally {
      setCredLoading(false);
    }
  };

  const handleResendSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResendLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch("/api/auth/signin/resend", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        // Resend will show a verify page
        window.location.href = "/admin/login?verify=1";
      }
    } catch (err) {
      console.error(err);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center text-lg">Admin Sign In</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {verify && (
            <div className="rounded bg-blue-100 p-3 text-sm text-blue-700">
              Check your email for a magic link to sign in.
            </div>
          )}
          
          {error && error !== "OAuthSignin" && error !== "OAuthCallback" && (
            <div className="rounded bg-red-100 p-3 text-sm text-red-700">
              {error === "MissingCSRF"
                ? "Something went wrong. Please try again."
                : error}
            </div>
          )}

          {/* Dev credentials login */}
          {isDev && (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="dev-email">Dev Login</Label>
                <Input
                  id="dev-email"
                  type="email"
                  value={credEmail}
                  onChange={(e) => setCredEmail(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                variant="outline"
                disabled={credLoading}
              >
                {credLoading ? "Signing in..." : "Sign in (dev)"}
              </Button>
            </form>
          )}

          {/* Magic link — shown in all envs */}
          <form onSubmit={handleResendSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">
                {isDev ? "Or send magic link" : "Email address"}
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@organization.org"
                required={!isDev}
                autoFocus={!isDev}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={resendLoading}
            >
              {resendLoading ? "Sending..." : "Send Magic Link"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
