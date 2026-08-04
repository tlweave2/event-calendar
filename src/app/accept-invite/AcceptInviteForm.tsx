"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { signIn } from "next-auth/react";
import { acceptInvite } from "@/lib/actions/accept-invite";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AcceptInviteForm({
  token,
  email,
}: {
  token: string;
  email: string;
}) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    const result = await acceptInvite({ token, name, password });

    if (!result.success) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    await signIn("credentials", {
      email,
      password,
      redirect: true,
      redirectTo: "/admin",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      {error && (
        <div className="rounded bg-red-100 p-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      <div className="space-y-1">
        <Label htmlFor="name">Your name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jordan Rivera"
          autoComplete="name"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="password">Choose a password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
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
        <p className="text-xs text-gray-500">At least 8 characters.</p>
      </div>

      <div className="space-y-1">
        <Label htmlFor="confirm">Confirm password</Label>
        <Input
          id="confirm"
          type={showPassword ? "text" : "password"}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Setting up your account..." : "Accept invitation"}
      </Button>
    </form>
  );
}
