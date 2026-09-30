"use client";

import { signOut } from "next-auth/react";

export default function DemoBanner() {
  return (
    <div className="border-b border-gray-900 bg-gray-900 px-4 py-2 text-center text-sm text-gray-100">
      This is a demo calendar. Anything you change is deleted after an hour.{" "}
      <button
        onClick={() => signOut({ redirectTo: "/signup" })}
        className="font-medium underline hover:no-underline"
      >
        Start a real calendar
      </button>
      <span className="mx-2 text-gray-500">|</span>
      <button
        onClick={() => signOut({ redirectTo: "/admin/login" })}
        className="font-medium underline hover:no-underline"
      >
        Sign in to your account
      </button>
    </div>
  );
}
