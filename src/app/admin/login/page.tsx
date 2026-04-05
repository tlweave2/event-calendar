"use client";

import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [credLoading, setCredLoading] = useState(false);
  const [credEmail, setCredEmail] = useState("admin@test.com");
  const [credPassword, setCredPassword] = useState("");

  const handleCredentialsSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCredLoading(true);
    try {
      await signIn("credentials", {
        email: credEmail,
        password: credPassword,
        redirect: true,
        redirectTo: "/admin",
      });
      // If signIn succeeds with redirect: true, this code won't execute (browser redirects)
    } catch {
      alert("Login failed");
      setCredLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center text-lg">Admin Sign In</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && error !== "OAuthSignin" && error !== "OAuthCallback" && (
            <div className="rounded bg-red-100 p-3 text-sm text-red-700">
              {error === "MissingCSRF"
                ? "Something went wrong. Please try again."
                : error}
            </div>
          )}

          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                value={credEmail}
                onChange={(e) => setCredEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={credPassword}
                onChange={(e) => setCredPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={credLoading}
            >
              {credLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
