"use client";

import { signOut } from "next-auth/react";

export default function DemoBanner() {
  return (
    <div className="bg-violet-600 px-4 py-2 text-center text-sm text-white">
      You&apos;re in a demo sandbox — changes are yours but expire in 1 hour.{" "}
      <button
        onClick={() => signOut({ redirectTo: "/signup" })}
        className="font-medium underline hover:no-underline"
      >
        Create a permanent calendar →
      </button>
      {" · "}
      <button
        onClick={() => signOut({ redirectTo: "/admin/login" })}
        className="font-medium underline hover:no-underline"
      >
        Sign in to your account
      </button>
    </div>
  );
}
