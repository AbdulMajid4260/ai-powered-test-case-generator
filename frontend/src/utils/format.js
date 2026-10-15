export function priorityKind(p = "") {
  const v = p.toLowerCase();
  if (v === "high" || v === "critical" || v === "p1") return "high";
  if (v === "medium" || v === "p2") return "medium";
  if (v === "low" || v === "p3") return "low";
  return "other";
}

export function typeKind(t = "") {
  const v = t.toLowerCase();
  if (v === "positive") return "positive";
  if (v === "negative") return "negative";
  return "other";
}
