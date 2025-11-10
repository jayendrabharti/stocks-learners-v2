import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:6900";

const authEndpoints = [
  "/auth/login",
  "/auth/verify",
  "/auth/refresh",
  "/auth/logout",
  "/auth/google/url",
  "/auth/user",
  "/auth/email/login",
  "/auth/email/verify",
];

const ApiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(ApiClient(prom.originalRequest));
    }
  });
  failedQueue = [];
};

ApiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    console.log("❌ [ApiClient] Request failed:", {
      url: originalRequest?.url,
      status: error.response?.status,
      message: error.message,
    });

    const isAuthEndpoint = authEndpoints.some((endpoint) =>
      originalRequest.url.includes(endpoint),
    );

    if (
      error.response?.status === 401 &&
      !isAuthEndpoint &&
      !originalRequest._retry
    ) {
      console.log("🔄 [ApiClient] Got 401 error, attempting refresh...");
      console.log("🔍 [ApiClient] Original request:", originalRequest.url);

      if (isRefreshing) {
        console.log("⏳ [ApiClient] Already refreshing, queueing request...");
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, originalRequest });
        }).catch((err) => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log("🔑 [ApiClient] Calling /auth/refresh...");
        const refreshResponse = await ApiClient.post("/auth/refresh");
        console.log("✅ [ApiClient] Refresh successful:", refreshResponse.data);

        processQueue(null);
        console.log(
          "🔄 [ApiClient] Retrying original request:",
          originalRequest.url,
        );
        return ApiClient(originalRequest);
      } catch (refreshError: any) {
        console.error(
          "❌ [ApiClient] Refresh failed:",
          refreshError.response?.data || refreshError.message,
        );
        console.error("❌ [ApiClient] Refresh error details:", {
          status: refreshError.response?.status,
          statusText: refreshError.response?.statusText,
          data: refreshError.response?.data,
        });
        processQueue(refreshError);

        // Don't redirect - let AuthGuard handle UI
        // Just reject the error and let the app handle it
        console.log(
          "ℹ️ [ApiClient] Refresh failed, letting AuthGuard handle UI",
        );

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  },
);

export default ApiClient;
