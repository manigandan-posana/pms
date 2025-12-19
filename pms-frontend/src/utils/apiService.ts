/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, {
  type AxiosResponse,
  type InternalAxiosRequestConfig,
  type AxiosBasicCredentials,
  type ResponseType,
  type AxiosProgressEvent,
} from "axios";
import { loginPath } from "../routes/route";

// Instead of importing the Redux store and logout action directly, we accept
// them via setter functions to avoid circular dependency issues. When this
// module is loaded, the store has not yet been created. The consuming code
// (store.ts) will set these variables after the store is configured.
let storeInstance: any;
let logoutAction: any;

/**
 * Inject the Redux store instance used by the API service. This should be
 * called once after the store has been created (see src/store/store.ts).
 *
 * @param store The configured Redux store
 */
export function setApiStore(store: any): void {
  storeInstance = store;
}

/**
 * Inject the logout action creator used when a 401 response is received.
 * This is injected separately to avoid importing the auth slice here and
 * creating a circular dependency with the store and reducers.
 *
 * @param action The logout thunk action creator
 */
export function setLogoutAction(action: any): void {
  logoutAction = action;
}

export interface IRequestOptions {
  headers?: any;
  basicAuth?: AxiosBasicCredentials;
  responseType?: ResponseType;
  onProgressUpdate?: (progressEvent: AxiosProgressEvent) => void;
}

// Use either VITE_API_URL (from old client.js) or VITE_API_BASE_URL or fallback to /api
const baseUrl =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8080/api";

const onRequest = (
  config: InternalAxiosRequestConfig<any>
): InternalAxiosRequestConfig<any> => {
  // Ensure headers object exists
  config.headers = config.headers ?? {};

  // If the caller already set an Authorization header, do not override it
  const existingAuth = (config.headers as any)["Authorization"];
  if (!existingAuth && storeInstance?.getState) {
    const state = storeInstance.getState();
    // Use the ID token when available so the backend receives a token
    // whose audience matches the API's client ID. Fall back to the
    // access token if that is all we have (e.g., legacy flows).
    const token =
      (state?.auth?.accessToken as string | null | undefined) ||
      (state?.auth?.idToken as string | null | undefined);
    if (token) {
      (config.headers as any)["Authorization"] = `Bearer ${token}`;
    }
  }
  return config;
};

const onResponseSuccess = (
  response: AxiosResponse<any, any>
): AxiosResponse<any, any> | Promise<AxiosResponse<any, any>> => {
  endRequest();
  return response;
};

// Track if we've already triggered a 401 logout to prevent multiple redirects
let is401HandlingInProgress = false;

const onResponseError = async (err: any): Promise<never> => {
  endRequest();
  
  if (err.response?.status === 401) {
    // Prevent multiple 401 handling if already in progress
    if (is401HandlingInProgress) {
      return await Promise.reject(err);
    }
    
    is401HandlingInProgress = true;
    console.log("401 Unauthorized - clearing session and redirecting to login");
    
    try {
      // Clear all storage immediately
      sessionStorage.clear();
      localStorage.clear();
      
      // Dispatch the logout action if provided to reset auth state
      if (logoutAction && storeInstance?.dispatch) {
        await storeInstance.dispatch(logoutAction());
      }
    } catch (logoutError) {
      console.error("Dispatch logout action failed:", logoutError);
    } finally {
      // Reset the flag before redirect so user can login again
      is401HandlingInProgress = false;
      // Force full page reload to login page
      window.location.href = loginPath;
    }
  }
  
  return await Promise.reject(err);
};

export const axiosInstance = axios.create({
  baseURL: baseUrl,
  timeout: 1000 * 60 * 60, // 1 hour
  // Use pure Bearer auth; do not send cookies/credentials.
  // Cookies can trigger CORS preflight/credential issues with cross-origin APIs.
  withCredentials: false,
  // Do NOT set a global Content-Type. We'll set it per request so
  // FormData uploads can automatically set proper multipart boundaries.
  validateStatus: function (status) {
    return status === 200 || status === 201 || status === 204;
  },
});

axiosInstance.interceptors.request.use(onRequest);
axiosInstance.interceptors.response.use(onResponseSuccess, onResponseError);

// ---- Loader handling ----

let onRequestStart: (() => void) | undefined;
let onRequestEnd: (() => void) | undefined;
let totalRequests = 0;
let completedRequests = 0;

const startRequest = (displayLoader: boolean): void => {
  totalRequests += 1;
  if (displayLoader) {
    onRequestStart?.();
  }
};

const endRequest = (): void => {
  completedRequests += 1;
  if (completedRequests >= totalRequests) {
    completedRequests = 0;
    totalRequests = 0;
    onRequestEnd?.();
  }
};

export function addRequestStartListener(callback: () => void): void {
  onRequestStart = callback;
}

export function addRequestEndListener(callback: () => void): void {
  onRequestEnd = callback;
}

// ---- HTTP helpers ----

export async function Get<T, D = any>(
  endPoint: string,
  params?: D,
  requestOptions: IRequestOptions = {},
  displayLoader = true
): Promise<T> {
  startRequest(displayLoader);
  const res = await axiosInstance.get<T, AxiosResponse<T>, D>(endPoint, {
    params,
    headers: requestOptions.headers,
    responseType: requestOptions.responseType,
  });
  return res.data;
}

export async function Post<T, D = any>(
  endPoint: string,
  data?: D,
  requestOptions: IRequestOptions = {},
  displayLoader = true
): Promise<T> {
  startRequest(displayLoader);
  // Build headers per request, allowing FormData uploads to set boundaries automatically
  const headers = { ...(requestOptions.headers ?? {}) } as Record<string, any>;
  const isFormData = typeof FormData !== "undefined" && data instanceof FormData;
  if (isFormData) {
    // Let the browser/axios set the correct multipart/form-data boundary
    delete headers["Content-Type"];
  } else {
    headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
  }
  const res = await axiosInstance.post<T, AxiosResponse<T>, D>(endPoint, data, {
    headers,
    auth: requestOptions.basicAuth,
    onUploadProgress: requestOptions.onProgressUpdate,
  });
  return res.data;
}

export async function Put<T, D = any>(
  endPoint: string,
  data: D,
  requestOptions: IRequestOptions = {},
  displayLoader = true
): Promise<T> {
  startRequest(displayLoader);
  const headers = { ...(requestOptions.headers ?? {}) } as Record<string, any>;
  const isFormData = typeof FormData !== "undefined" && data instanceof FormData;
  if (isFormData) {
    delete headers["Content-Type"];
  } else {
    headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
  }
  const res = await axiosInstance.put<T, AxiosResponse<T>, D>(endPoint, data, {
    headers,
  });
  return res.data;
}

export async function Delete<T>(
  endPoint: string,
  requestOptions: IRequestOptions = {},
  displayLoader = true
): Promise<T> {
  startRequest(displayLoader);
  const res = await axiosInstance.delete<T>(endPoint, {
    headers: requestOptions.headers,
  });
  return res.data;
}
