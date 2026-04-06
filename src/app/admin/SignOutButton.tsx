"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="text-xs text-gray-500 hover:text-gray-700 underline"
    >
      Sign out
    </button>
  );
}
