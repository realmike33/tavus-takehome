export function encodeStateToURL({ q, category, needsReferral }) {
  const p = new URLSearchParams();
  if (q) p.set("q", q);
  if (category && category !== "all") p.set("cat", category);
  if (needsReferral) p.set("ref", "1");
  return `?${p.toString()}`;
}

export function decodeStateFromURL() {
  if (typeof window === "undefined") return {};
  const u = new URL(window.location.href);
  return {
    q: u.searchParams.get("q") || "",
    category: u.searchParams.get("cat") || "all",
    needsReferral: u.searchParams.get("ref") === "1",
  };
}

export function getAskIdFromURL() {
  if (typeof window === "undefined") return "";
  const u = new URL(window.location.href);
  return u.searchParams.get("ask") || "";
}
export function setAskIdInURL(askId) {
  if (typeof window === "undefined") return;
  const u = new URL(window.location.href);
  if (askId) u.searchParams.set("ask", askId);
  else u.searchParams.delete("ask");
  window.history.replaceState(null, "", u.toString());
}

export function buildShareURL({ q, category, needsReferral, askId }) {
  const u = new URL(window.location.href);
  ["q", "cat", "ref", "ask"].forEach((k) => u.searchParams.delete(k));
  if (q) u.searchParams.set("q", q);
  if (category && category !== "all") u.searchParams.set("cat", category);
  if (needsReferral) u.searchParams.set("ref", "1");
  if (askId) u.searchParams.set("ask", askId);
  return u.toString();
}
export function findAskInCache(askId) {
  if (!askId) return null;
  try {
    const a = JSON.parse(localStorage.getItem("bwz_asks") || "[]");
    return a.find((x) => x.askId === askId) || null;
  } catch {
    return null;
  }
}
