import request from './request';

export interface User {
  id: number;
  username: string;
  email?: string;
  nickname?: string;
  avatar?: string;
  role: string;
}

export interface LoginParams {
  username: string;
  password: string;
}

export interface RegisterParams {
  username: string;
  password: string;
  email?: string;
  phone?: string;
  nickname?: string;
}

export const authApi = {
  login: (params: LoginParams): Promise<User> => request.post<User>('/auth/login', params),
  register: (params: RegisterParams): Promise<User> => request.post<User>('/auth/register', params),
  getProfile: (): Promise<User> => request.get<User>('/auth/profile'),
};

