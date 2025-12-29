import { safeGet, safePostFallback, safeDelete, normalizeList } from "./httpFactory";

export async function listLinks(limit = 1000, offset = 0) {
  const r = await safeGet("/links", { limit, offset });
  if (!r.ok) return { ok: false, items: [], total: 0, error: r };
  const { items, total } = normalizeList(r.data);
  return { ok: true, items, total };
}

/**
 * Your backend currently returns:
 * POST /links -> 405 (Allow: GET)
 * So we try /link first, then /links (and optional /links/create).
 */
export async function createLinkSafe(payload) {
  return safePostFallback(["/link", "/links/create", "/links"], payload);
}

// Backward compatible (your old code imported createLink)
export async function createLink(payload) {
  return createLinkSafe(payload);
}

export async function deleteLink(id) {
  if (!id) return { ok: false, status: 400, message: "Missing link id" };
  // adjust if your backend uses a different path
  return safeDelete(`/link/${encodeURIComponent(id)}`);
}

/**
 * Your old UI was importing getDeviceOnlineStatus from link API (wrong place),
 * but we export it here too so your app doesn’t break if still importing from link.js.
 */
export async function getDeviceOnlineStatus(mobileId) {
  if (!mobileId) return { ok: true, online: false };
  const r = await safeGet(`/device/${encodeURIComponent(mobileId)}/online`);
  if (!r.ok) return { ok: false, online: false, error: r };
  return { ok: true, online: !!r.data?.online || r.data === true };
}

