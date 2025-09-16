import axios from "axios";

/**
 * Creates a pre-configured axios instance with baseURL + timeout + logging.
 */
export default function httpFactory(baseURL) {
  const http = axios.create({
    baseURL,
    timeout: 10000,
  });

  http.interceptors.response.use(
    (r) => r,
    (e) => {
      console.error("API error:", {
        url: e.config?.url,
        baseURL: e.config?.baseURL,
        method: e.config?.method,
        status: e.response?.status,
        data: e.response?.data,
        message: e.message,
      });
      return Promise.reject(e);
    }
  );

  return http;
}

