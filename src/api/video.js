import httpFactory from "./httpFactory";
const http = httpFactory(process.env.REACT_APP_VIDEO_API || "http://34.248.112.237:8003");

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

