import axios, { AxiosError, AxiosInstance } from 'axios';
import { authStore } from '../stores/authStore';
import { ApiError } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiClient {
  private client: AxiosInstance;
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_URL}/api`,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - attach auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = authStore.getState().accessToken;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiError>) => {
        const originalRequest = error.config as any;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Use existing refresh promise if in progress
            if (!this.refreshPromise) {
              this.refreshPromise = this.refreshAccessToken();
            }

            const newToken = await this.refreshPromise;
            this.refreshPromise = null;

            // Update store and retry request
            authStore.getState().setAccessToken(newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;

            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed - logout and redirect (but not if already on login page)
            authStore.getState().logout();
            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/login';
            }
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async refreshAccessToken(): Promise<string> {
    const response = await axios.post<{ accessToken: string }>(
      `${API_URL}/api/auth/refresh`,
      {},
      { withCredentials: true }
    );
    return response.data.accessToken;
  }

  public get<T = any>(url: string, config?: any): Promise<T> {
    return this.client.get(url, config).then((res) => res.data);
  }

  public post<T = any>(url: string, data?: any, config?: any): Promise<T> {
    return this.client.post(url, data, config).then((res) => res.data);
  }

  public patch<T = any>(url: string, data?: any, config?: any): Promise<T> {
    return this.client.patch(url, data, config).then((res) => res.data);
  }

  public delete<T = any>(url: string, config?: any): Promise<T> {
    return this.client.delete(url, config).then((res) => res.data);
  }

  public getInstance(): AxiosInstance {
    return this.client;
  }
}

export const apiClient = new ApiClient();
export default apiClient;