const COLORS = {
  APPROVED: "bg-green-100 text-green-700",
  PENDING: "bg-yellow-100 text-yellow-800",
  SUSPENDED: "bg-red-100 text-red-700",
  ACCEPTED: "bg-yellow-100 text-yellow-800",
  PREPARING: "bg-yellow-100 text-yellow-800",
  READY: "bg-orange-100 text-orange-700",
  OUT_FOR_DELIVERY: "bg-orange-100 text-orange-700",
  DELIVERED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-600",
};

const LABELS = {
  OUT_FOR_DELIVERY: "Out for delivery",
};

export function StatusPill({ status }) {
  const cls = COLORS[status] || "bg-gray-100 text-gray-600";
  const label = LABELS[status] || status?.toLowerCase() || "—";
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${cls}`}
    >
      {label}
    </span>
  );
}
