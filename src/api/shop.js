import httpFactory from "./httpFactory";
const http = httpFactory(process.env.REACT_APP_SHOP_API || "http://34.248.112.237:8002");

export const insertShop = (shop_name) =>
  http.post("/insert_shop", { shop_name });

export const getShop = (shop_name) =>
  http.get(`/shop/${encodeURIComponent(shop_name)}`);

export const listShops = (params = {}) =>
  http.get("/shops", { params }); // {q, limit, offset}

export const updateShop = (shop_name, patch) =>
  http.put(`/shop/${encodeURIComponent(shop_name)}`, patch); // {shop_name}

export const deleteShop = (shop_name) =>
  http.delete(`/shop/${encodeURIComponent(shop_name)}`);

