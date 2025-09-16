import axios from "axios";

const API_URL = "http://34.248.112.237:8000"; // Change to your FastAPI host

export const insertDevice = async (mobile_id, download_status) => {
  return axios.post(`${API_URL}/insert_device`, {
    mobile_id,
    download_status,
  });
};

export const getDevice = async (mobile_id) => {
  return axios.get(`${API_URL}/device/${mobile_id}`);
};

export const listDevices = async () => {
  return axios.get(`${API_URL}/devices`);
};

export const updateDevice = async (mobile_id, data) => {
  return axios.put(`${API_URL}/device/${mobile_id}`, data);
};

export const deleteDevice = async (mobile_id) => {
  return axios.delete(`${API_URL}/device/${mobile_id}`);
};

