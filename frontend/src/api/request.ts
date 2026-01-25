import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { message } from 'antd';
import { useAuthStore } from '../stores/authStore';

// 后端统一响应格式
interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

// 创建自定义请求实例类型
interface CustomAxiosInstance extends AxiosInstance {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
  patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
}

const axiosInstance = axios.create({
  baseURL: '/api',
  timeout: 60000, // 超时时间60秒
});

// 请求拦截器
axiosInstance.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// 响应拦截器
axiosInstance.interceptors.response.use(
  (response) => {
    const { code, message: msg, data } = response.data as ApiResponse;
    if (code === 200) {
      return data;
    } else {
      message.error(msg || '请求失败');
      return Promise.reject(new Error(msg || '请求失败'));
    }
  },
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    message.error(error.response?.data?.message || '网络错误');
    return Promise.reject(error);
  },
);

const request = axiosInstance as CustomAxiosInstance;

export default request;

