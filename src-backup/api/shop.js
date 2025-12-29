import axios from "axios";

// Shop API runs on port 8002
const BASE_URL = process.env.REACT_APP_SHOP_API_URL || 
  `${window.location.protocol}//${window.location.hostname}:8002`;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

function normalizeList(payload) {
  const data = payload ?? {};
  const items = Array.isArray(data) ? data : data.items || data.data || data.results || [];
  const total = data.total ?? data.count ?? items.length;
  return { items, total };
}

export async function listShops(limit = 100, offset = 0) {
  try {
    const res = await api.get("/shops", { params: { limit, offset } });
    const { items, total } = normalizeList(res.data);
    return { ok: true, items, total };
  } catch (err) {
    console.error("listShops error:", err);
    return { ok: false, items: [], total: 0, error: err.message };
  }
}

// Backward compatible
export async function listShopNames(limit = 100, offset = 0) {
  return listShops(limit, offset);
}

// INSERT - Create new shop
export async function insertShop(shopData) {
  try {
    const res = await api.post("/shops", shopData);
    return { ok: true, data: res.data };
  } catch (err) {
    console.error("insertShop error:", err);
    return { ok: false, error: err.response?.data?.detail || err.message };
  }
}

// UPDATE - Update existing shop
export async function updateShop(shopId, shopData) {
  try {
    const res = await api.put(`/shops/${shopId}`, shopData);
    return { ok: true, data: res.data };
  } catch (err) {
    console.error("updateShop error:", err);
    return { ok: false, error: err.response?.data?.detail || err.message };
  }
}

// DELETE - Delete shop
export async function deleteShop(shopId) {
  try {
    const res = await api.delete(`/shops/${shopId}`);
    return { ok: true, data: res.data };
  } catch (err) {
    console.error("deleteShop error:", err);
    return { ok: false, error: err.response?.data?.detail || err.message };
  }
}
