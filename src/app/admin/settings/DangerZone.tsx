"use client";

import { useState } from "react";
import { deleteWorkspace } from "@/lib/actions/delete-workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function DangerZone({
  slug,
  eventCount,
  memberCount,
  hasSubscription,
}: {
  slug: string;
  eventCount: number;
  memberCount: number;
  hasSubscription: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const formData = new FormData();
    formData.set("confirm", confirm);

    // On success the action redirects and never returns.
    const result = await deleteWorkspace(formData);
    if (result && !result.success) {
      setError(result.error);
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-3">
      <h2 className="font-medium text-gray-900">Danger zone</h2>
      <div className="rounded-lg border border-red-200 bg-white p-5">
        <p className="font-medium text-gray-900">Delete this workspace</p>
        <p className="mt-1 text-sm text-gray-500">
          Permanently removes {eventCount.toLocaleString()} event
          {eventCount === 1 ? "" : "s"}, {memberCount} team member
          {memberCount === 1 ? "" : "s"}, and every category, view, and setting.
          Your embed stops working immediately. This cannot be undone.
        </p>
        {hasSubscription && (
          <p className="mt-2 text-sm text-gray-500">
            Your Pro subscription will be canceled as part of the deletion.
          </p>
        )}

        {!open ? (
          <Button
            type="button"
            variant="outline"
            className="mt-4 border-red-300 text-red-700 hover:bg-red-50"
            onClick={() => setOpen(true)}
          >
            Delete workspace
          </Button>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            {error && (
              <p className="rounded bg-red-100 p-3 text-sm text-red-700" role="alert">
                {error}
              </p>
            )}
            <label className="block text-sm text-gray-700">
              Type <span className="font-mono font-semibold">{slug}</span> to confirm
            </label>
            <Input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={slug}
              autoComplete="off"
              required
            />
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={submitting || confirm !== slug}
                className="bg-red-600 hover:bg-red-700"
              >
                {submitting ? "Deleting..." : "Permanently delete"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  setConfirm("");
                  setError(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
