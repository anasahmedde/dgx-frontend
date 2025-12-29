// src/components/GroupLinkedVideo.js
import React, { useEffect, useMemo, useState } from "react";
import { listVideoNames } from "../api/video";
import { listGroupNames } from "../api/group";
import { setGroupVideosByNames, listGroupVideoNames } from "../api/dvsg";

const NO_GROUP_LABEL = "— No group —";
const NO_GROUP_VALUE = "_none";

// Helper to ensure we get an array
function ensureArray(data) {
  if (Array.isArray(data)) return data;
  if (data?.items) return data.items;
  if (data?.data) return data.data;
  return [];
}

export default function GroupLinkedVideo({ onDone }) {
  const [groups, setGroups] = useState([]);
  const [videos, setVideos] = useState([]);
  const [gname, setGname] = useState("");

  const [typedVideo, setTypedVideo] = useState("");
  const [selectedVideos, setSelectedVideos] = useState([]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Load groups and videos
  useEffect(() => {
    (async () => {
      setMessage("Loading...");
      try {
        const [gnResult, vnResult] = await Promise.all([
          listGroupNames().catch((e) => { console.error("listGroupNames error:", e); return []; }),
          listVideoNames().catch((e) => { console.error("listVideoNames error:", e); return []; }),
        ]);
        
        // Handle different response formats
        let groupNames = ensureArray(gnResult);
        let videoNames = ensureArray(vnResult);
        
        // If items are objects, extract names
        if (groupNames.length > 0 && typeof groupNames[0] === "object") {
          groupNames = groupNames.map(g => g.gname || g.name || String(g)).filter(Boolean);
        }
        if (videoNames.length > 0 && typeof videoNames[0] === "object") {
          videoNames = videoNames.map(v => v.video_name || v.name || String(v)).filter(Boolean);
        }
        
        const uniqGroups = Array.from(new Set(groupNames));
        setGroups([NO_GROUP_LABEL, ...uniqGroups]);
        setVideos(videoNames);
        setMessage("");
        
        console.log("Loaded groups:", uniqGroups.length, "videos:", videoNames.length);
      } catch (e) {
        console.error("Failed to load lists:", e);
        setMessage("Failed to load groups/videos");
      }
    })();
  }, []);

  const gvalue = useMemo(() => {
    if (!gname) return "";
    return gname === NO_GROUP_LABEL ? NO_GROUP_VALUE : gname;
  }, [gname]);

  // When group changes, fetch current videos
  useEffect(() => {
    if (!gvalue) {
      setSelectedVideos([]);
      return;
    }
    (async () => {
      setMessage("Loading current videos…");
      try {
        const r = await listGroupVideoNames(gvalue);
        const names = r?.data?.video_names || r?.video_names || ensureArray(r);
        setSelectedVideos(Array.isArray(names) ? names : []);
        setMessage(names.length ? "" : "No videos linked yet.");
      } catch (e) {
        console.error("Failed to load group videos:", e);
        setSelectedVideos([]);
        setMessage("No videos linked yet.");
      }
    })();
  }, [gvalue]);

  const input = {
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    padding: "8px 10px",
    fontSize: 14,
    width: "100%",
    outline: "none",
  };
  const btn = {
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    background: "#fff",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
  };
  const btnPrimary = { ...btn, background: "#4f46e5", color: "#fff", borderColor: "#4f46e5" };
  const chip = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 10px",
    borderRadius: 999,
    background: "#f3f4f6",
    border: "1px solid #e5e7eb",
    fontSize: 13,
    lineHeight: 1,
    whiteSpace: "nowrap",
  };

  const addVideo = () => {
    const v = (typedVideo || "").trim();
    if (!v) return;
    if (!videos.includes(v)) {
      setMessage(`"${v}" is not in the video list.`);
      return;
    }
    if (!selectedVideos.includes(v)) {
      setSelectedVideos((s) => [...s, v]);
      setMessage("");
    }
    setTypedVideo("");
  };

  const removeVideo = (name) => setSelectedVideos((s) => s.filter((x) => x !== name));
  const clearVideos = () => setSelectedVideos([]);

  const canSubmit = gvalue && selectedVideos.length > 0 && !loading;

  const submit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setMessage("");
    try {
      const res = await setGroupVideosByNames(gvalue, selectedVideos);
      const data = res?.data || res || {};
      const okInserted = data.inserted_count ?? 0;
      const okUpdated = data.updated_count ?? 0;
      const okDeleted = data.deleted_count ?? 0;

      setMessage(
        `Linked ${selectedVideos.length} video(s) to "${gname}". ` +
        `(+${okInserted} new, ${okUpdated} refreshed, -${okDeleted} removed)`
      );
      onDone && onDone({ gname: gvalue, videos: selectedVideos, ...data });
    } catch (e) {
      const err = e?.response?.data?.detail || e?.message || "Update failed.";
      setMessage(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {/* Group select */}
      <div>
        <select
          aria-label="Group (gname)"
          style={input}
          value={gname}
          onChange={(e) => setGname(e.target.value)}
        >
          <option value="">Select group</option>
          {groups.map((label) => (
            <option key={label} value={label}>
              {label}
            </option>
          ))}
        </select>
        {groups.length <= 1 && (
          <div style={{ fontSize: 12, color: "#dc2626", marginTop: 4 }}>
            No groups found. Make sure groups exist first.
          </div>
        )}
      </div>

      {/* Tag-style video picker */}
      <div style={{ display: "grid", gap: 8 }}>
        <label style={{ fontSize: 13, fontWeight: 600 }}>
          Videos {videos.length > 0 && <span style={{ fontWeight: 400, color: "#6b7280" }}>({videos.length} available)</span>}
        </label>
        <div
          style={{
            ...input,
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            minHeight: 44,
            padding: 8,
          }}
        >
          {selectedVideos.map((v) => (
            <span key={v} style={chip}>
              {v}
              <button
                type="button"
                onClick={() => removeVideo(v)}
                style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 16, lineHeight: 1 }}
                aria-label={`Remove ${v}`}
                title="Remove"
              >
                ×
              </button>
            </span>
          ))}

          <input
            list="video-list"
            value={typedVideo}
            onChange={(e) => setTypedVideo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addVideo();
              }
            }}
            placeholder={videos.length > 0 ? "Type a video and press Enter" : "No videos available"}
            style={{ border: "none", outline: "none", flex: 1, minWidth: 160 }}
            disabled={videos.length === 0}
          />
          <datalist id="video-list">
            {videos.map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" style={btn} onClick={addVideo} disabled={!typedVideo}>
            Add
          </button>
          <button type="button" style={btn} onClick={clearVideos} disabled={!selectedVideos.length}>
            Clear
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button style={btnPrimary} disabled={!canSubmit} onClick={submit}>
          {loading ? "Updating..." : "Link videos"}
        </button>
      </div>

      {message && (
        <div
          style={{
            fontSize: 13,
            lineHeight: 1.5,
            background: message.includes("Failed") || message.includes("not in") ? "#fef2f2" : "#f8fafc",
            border: `1px solid ${message.includes("Failed") || message.includes("not in") ? "#fecaca" : "#e5e7eb"}`,
            color: message.includes("Failed") || message.includes("not in") ? "#991b1b" : "inherit",
            borderRadius: 8,
            padding: 10,
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
}
