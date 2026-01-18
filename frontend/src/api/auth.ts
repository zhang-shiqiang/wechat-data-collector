import request from './request';

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
  login: (params: LoginParams) => request.post('/auth/login', params),
  register: (params: RegisterParams) => request.post('/auth/register', params),
  getProfile: () => request.get('/auth/profile'),
};

