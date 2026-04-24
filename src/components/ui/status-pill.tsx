import { cn } from "@/lib/utils";

type Status =
  | "approved"
  | "pending"
  | "rejected"
  | "published"
  | "draft"
  | "scheduled"
  | "active"
  | "paused";

const STATUS_STYLES: Record<Status, string> = {
  approved: "bg-green-50 text-green-700",
  published: "bg-green-50 text-green-700",
  active: "bg-green-50 text-green-700",
  pending: "bg-amber-50 text-amber-700",
  scheduled: "bg-amber-50 text-amber-700",
  draft: "bg-gray-100 text-gray-500",
  paused: "bg-gray-100 text-gray-500",
  rejected: "bg-red-50 text-red-600",
};

const STATUS_LABELS: Record<Status, string> = {
  approved: "Approved",
  pending: "Pending",
  rejected: "Rejected",
  published: "Published",
  draft: "Draft",
  scheduled: "Scheduled",
  active: "Active",
  paused: "Paused",
};

export function StatusPill({
  status,
  className,
}: {
  status: Status;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        STATUS_STYLES[status],
        className
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
