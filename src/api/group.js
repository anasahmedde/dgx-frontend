import httpFactory from "./httpFactory";
const http = httpFactory(process.env.REACT_APP_GROUP_API || "http://34.248.112.237:8001");

export const insertGroup = (gname) =>
  http.post("/insert_group", { gname });

export const getGroup = (gname) =>
  http.get(`/group/${encodeURIComponent(gname)}`);

export const listGroups = (params = {}) =>
  http.get("/groups", { params }); // {q, limit, offset}

export const updateGroup = (gname, patch) =>
  http.put(`/group/${encodeURIComponent(gname)}`, patch); // {gname}

export const deleteGroup = (gname) =>
  http.delete(`/group/${encodeURIComponent(gname)}`);

