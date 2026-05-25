const FREE_VALUES = new Set(["0", "$0", "0.00", "$0.00", "free"]);

export function formatCost(cost: string | null | undefined): string | null {
  if (!cost) return null;
  const t = cost.trim();
  return FREE_VALUES.has(t.toLowerCase()) ? "Free" : t || null;
}
