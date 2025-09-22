// src/api/device.js
import axios from "axios";
const API_URL = "http://34.248.112.237:8000"; // your FastAPI host

export const insertDevice = async (mobile_id, download_status) =>
  axios.post(`${API_URL}/insert_device`, { mobile_id, download_status });

export const getDevice = async (mobile_id) =>
  axios.get(`${API_URL}/device/${mobile_id}`);

export const listDevices = async (params = {}) =>
  axios.get(`${API_URL}/devices`, { params }); // now supports { q, limit, offset }

export const updateDevice = async (mobile_id, data) =>
  axios.put(`${API_URL}/device/${mobile_id}`, data);

export const deleteDevice = async (mobile_id) =>
  axios.delete(`${API_URL}/device/${mobile_id}`);

