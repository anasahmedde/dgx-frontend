import axios from "axios";

// Group API runs on port 8001
const BASE_URL = process.env.REACT_APP_GROUP_API_URL || 
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

export async function listGroups(limit = 100, offset = 0) {
  try {
    const res = await api.get("/groups", { params: { limit, offset } });
    const { items, total } = normalizeList(res.data);
    return { ok: true, items, total };
  } catch (err) {
    console.error("listGroups error:", err);
    return { ok: false, items: [], total: 0, error: err.message };
  }
}

// Returns array of group names (for GroupLinkedVideo component)
export async function listGroupNames(limit = 100, offset = 0) {
  try {
    const res = await listGroups(limit, offset);
    // Extract just the names as an array
    return (res.items || []).map(g => g.gname || g.name || g).filter(Boolean);
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
