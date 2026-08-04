"use client";

import { useState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/actions/password-reset";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    await requestPasswordReset({ email });
    setSent(true);
    setSubmitting(false);
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-center text-lg">Reset your password</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sent ? (
          <>
            {/* Same message either way — confirming which addresses have
                accounts would leak the customer list. */}
            <p className="text-sm text-gray-600">
              If an account exists for <span className="font-medium">{email}</span>,
              we&apos;ve sent a link to reset the password. The link expires in an
              hour.
            </p>
            <p className="text-center text-xs text-gray-400">
              <Link href="/admin/login" className="text-gray-600 underline">
                Back to sign in
              </Link>
            </p>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-600">
              Enter your email address and we&apos;ll send you a link to choose a new
              password.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@organization.org"
                  required
                  autoFocus
                  autoComplete="email"
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Sending..." : "Send reset link"}
              </Button>
            </form>
            <p className="text-center text-xs text-gray-400">
              <Link href="/admin/login" className="text-gray-600 underline">
                Back to sign in
              </Link>
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
