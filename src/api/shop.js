// src/api/shop.js
import httpFactory from "./httpFactory";

// Use env first, fallback to your current host:port
const BASE = process.env.REACT_APP_SHOP_API || "http://34.248.112.237:8002";
const http = httpFactory(BASE);

/** Create */
export const insertShop = (shop_name) =>
  http.post("/insert_shop", { shop_name });

/** Read one */
export const getShop = (shop_name) =>
  http.get(`/shop/${encodeURIComponent(shop_name)}`);

/** List (supports { q, limit, offset }) */
export const listShops = (params = {}) =>
  http.get("/shops", { params });

/** Update */
export const updateShop = (shop_name, patch) =>
  http.put(`/shop/${encodeURIComponent(shop_name)}`, patch);

/** Delete */
export const deleteShop = (shop_name) =>
  http.delete(`/shop/${encodeURIComponent(shop_name)}`);

/* ---------------- Optional helpers for Autocomplete ---------------- */

/**
 * listShopsSafe: try a high limit then gracefully fall back on 422.
 * Returns Axios response (same shape as listShops).
 */
export const listShopsSafe = async (params = {}) => {
  const caps = [200, 100, 50];
  for (const cap of caps) {
    try {
      return await listShops({ limit: cap, offset: 0, ...params });
    } catch (e) {
      if (e?.response?.status !== 422) throw e;
    }
  }
  return listShops(); // final attempt with API defaults
};

/**
 * listShopNames: convenience to get an array of strings (shop_name)
 */
export const listShopNames = async (params = {}) => {
  const r = await listShopsSafe(params);
  return (r.data?.items || []).map((x) => x?.shop_name).filter(Boolean);
};

