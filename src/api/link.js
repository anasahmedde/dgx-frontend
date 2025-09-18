// src/api/link.js
import httpFactory from "./httpFactory";

// Use env override if you host the link service somewhere else
const http = httpFactory(process.env.REACT_APP_LINK_API || "http://34.248.112.237:8005");

export const createLink = (payload) => http.post("/link", payload);       // {mobile_id, video_name, shop_name, gname}
export const listLinks  = (params = {}) => http.get("/links", { params }); // {limit, offset, filters...}
export const deleteLink = (id) => http.delete(`/link/${id}`);

