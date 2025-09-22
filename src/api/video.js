// src/api/video.js
import httpFactory from "./httpFactory";

// Use env if set, else localhost:8003 (matches your curl)
const BASE = process.env.REACT_APP_VIDEO_API || "http://34.248.112.237:8003";
const http = httpFactory(BASE);

// --- existing CRUD you already had ---
export const insertVideo = (video_name, s3_link) =>
  http.post("/insert_video", { video_name, s3_link });

export const getVideo = (video_name) =>
  http.get(`/video/${encodeURIComponent(video_name)}`);

export const listVideos = (params = {}) =>
  http.get("/videos", { params }); // {q, limit, offset}

export const updateVideo = (video_name, patch) =>
  http.put(`/video/${encodeURIComponent(video_name)}`, patch); // {video_name?, s3_link?}

export const deleteVideo = (video_name) =>
  http.delete(`/video/${encodeURIComponent(video_name)}`);

// --- NEW: upload via multipart/form-data ---
/**
 * Upload a video file to /upload_video as <video_name>.mp4
 * @param {File} file - browser File object
 * @param {string} video_name - name to save as (without extension)
 * @param {boolean} overwrite - if true, replaces existing S3 object/row
 * @param {(pct:number, loaded:number, total:number)=>void} onProgress - optional progress cb
 */
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

