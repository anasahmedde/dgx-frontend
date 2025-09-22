// src/api/video.js
import httpFactory from "./httpFactory";

const BASE = process.env.REACT_APP_VIDEO_API || "http://34.248.112.237:8003";
const http = httpFactory(BASE);

/** Create/insert a DB row manually */
export const insertVideo = (video_name, s3_link) =>
  http.post("/insert_video", { video_name, s3_link });

/** Read one row */
export const getVideo = (video_name) =>
  http.get(`/video/${encodeURIComponent(video_name)}`);

/** List (supports { q, limit, offset }) */
export const listVideos = (params = {}) =>
  http.get("/videos", { params });

/** Update */
export const updateVideo = (video_name, patch) =>
  http.put(`/video/${encodeURIComponent(video_name)}`, patch);

/** Delete */
export const deleteVideo = (video_name) =>
  http.delete(`/video/${encodeURIComponent(video_name)}`);

/** Upload a file via multipart to /upload_video as <video_name>.mp4 */
export const uploadVideo = (file, video_name, overwrite = false, onProgress) => {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("video_name", video_name);
  if (overwrite) fd.append("overwrite", "true");

  return http.post("/upload_video", fd, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (evt) => {
      if (!onProgress || !evt.total) return;
      const pct = Math.round((evt.loaded / evt.total) * 100);
      onProgress(pct, evt.loaded, evt.total);
    },
  });
};

/* ---------------- Optional helpers for Autocomplete ---------------- */

export const listVideosSafe = async (params = {}) => {
  const caps = [200, 100, 50];
  for (const cap of caps) {
    try {
      return await listVideos({ limit: cap, offset: 0, ...params });
    } catch (e) {
      if (e?.response?.status !== 422) throw e;
    }
  }
  return listVideos();
};

export const listVideoNames = async (params = {}) => {
  const r = await listVideosSafe(params);
  return (r.data?.items || []).map((x) => x?.video_name).filter(Boolean);
};

