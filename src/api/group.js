// src/api/group.js
import axios from "axios";

// Group API runs on port 8001
const BASE_URL =
  process.env.REACT_APP_GROUP_API_URL ||
  `${window.location.protocol}//${window.location.hostname}:8001`;

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

function toPosInt(v, fallback) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  const i = Math.floor(n);
  return i > 0 ? i : fallback;
}

function toNonNegInt(v, fallback) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  const i = Math.floor(n);
  return i >= 0 ? i : fallback;
}

export async function listGroups(limit = 100, offset = 0) {
  try {
    const safeLimit = toPosInt(limit, 100);
    const safeOffset = toNonNegInt(offset, 0);

    const res = await api.get("/groups", { params: { limit: safeLimit, offset: safeOffset } });
    const { items, total } = normalizeList(res.data);
    return { ok: true, items, total };
  } catch (err) {
    console.error("listGroups error:", err);
    return { ok: false, items: [], total: 0, error: err.message };
  }
}

// Returns array of group names (for dropdowns)
export async function listGroupNames(limit = 100, offset = 0) {
  try {
    const res = await listGroups(limit, offset);
    return (res.items || []).map((g) => g.gname || g.name || g).filter(Boolean);
  } catch (err) {
    console.error("listGroupNames error:", err);
    return [];
  }
}

// INSERT - Create new group
export async function insertGroup(groupData) {
  try {
    const res = await api.post("/groups", groupData);
    return { ok: true, data: res.data };
  } catch (err) {
    console.error("insertGroup error:", err);
    return { ok: false, error: err.response?.data?.detail || err.message };
  }
}

// UPDATE - Update existing group
export async function updateGroup(groupId, groupData) {
  try {
    const res = await api.put(`/groups/${groupId}`, groupData);
    return { ok: true, data: res.data };
  } catch (err) {
    console.error("updateGroup error:", err);
    return { ok: false, error: err.response?.data?.detail || err.message };
  }
}

// DELETE - Delete group
export async function deleteGroup(groupId) {
  try {
    const res = await api.delete(`/groups/${groupId}`);
    return { ok: true, data: res.data };
  } catch (err) {
    console.error("deleteGroup error:", err);
    return { ok: false, error: err.response?.data?.detail || err.message };
  }
}

