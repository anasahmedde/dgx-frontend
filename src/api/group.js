// src/api/group.js
import httpFactory from "./httpFactory";

const BASE = process.env.REACT_APP_GROUP_API || "http://34.248.112.237:8001";
const http = httpFactory(BASE);

/** Create */
export const insertGroup = (gname) =>
  http.post("/insert_group", { gname });

/** Read one */
export const getGroup = (gname) =>
  http.get(`/group/${encodeURIComponent(gname)}`);

/** List (supports { q, limit, offset }) */
export const listGroups = (params = {}) =>
  http.get("/groups", { params });

/** Update */
export const updateGroup = (gname, patch) =>
  http.put(`/group/${encodeURIComponent(gname)}`, patch);

/** Delete */
export const deleteGroup = (gname) =>
  http.delete(`/group/${encodeURIComponent(gname)}`);

/* ---------------- Optional helpers for Autocomplete ---------------- */

export const listGroupsSafe = async (params = {}) => {
  const caps = [200, 100, 50];
  for (const cap of caps) {
    try {
      return await listGroups({ limit: cap, offset: 0, ...params });
    } catch (e) {
      if (e?.response?.status !== 422) throw e;
    }
  }
  return listGroups();
};

export const listGroupNames = async (params = {}) => {
  const r = await listGroupsSafe(params);
  return (r.data?.items || []).map((x) => x?.gname).filter(Boolean);
};

