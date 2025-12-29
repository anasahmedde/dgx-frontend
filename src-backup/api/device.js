import { safeGet, safePostFallback, normalizeList } from "./httpFactory";

export async function listDevices(limit = 100, offset = 0) {
  // Some backends use /devices, some use /device
  const r = await safeGet("/devices", { limit, offset });
  if (r.ok) {
    const { items, total } = normalizeList(r.data);
    return { ok: true, items, total };
  }

  const r2 = await safeGet("/device", { limit, offset });
  if (!r2.ok) return { ok: false, items: [], total: 0, error: r2 };

  const { items, total } = normalizeList(r2.data);
  return { ok: true, items, total };
}

/**
 * Your backend log shows:
 * POST /devices -> 404 Not Found
 * So we try /device first, then /devices.
 */
export async function insertDevice(payload) {
  return safePostFallback(["/device", "/devices"], payload);
}

export async function getDeviceOnlineStatus(mobileId) {
  if (!mobileId) return { ok: true, online: false };
  const r = await safeGet(`/device/${encodeURIComponent(mobileId)}/online`);
  if (!r.ok) return { ok: false, online: false, error: r };
  return { ok: true, online: !!r.data?.online || r.data === true };
}

