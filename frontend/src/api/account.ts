import request from './request';

export interface WechatAccount {
  id: number;
  name: string;
  alias?: string;
  wechatId?: string;
  avatar?: string;
  description?: string;
  categoryId?: number;
  category?: {
    id: number;
    name: string;
  };
  rssUrl?: string;
  fetchUrl?: string;
  fetchMethod: string;
  fetchEnabled: boolean;
  fetchFrequency: number;
  fetchFilters?: {
    author?: string;
    titleKeywords?: string;
    matchMode?: string;
    dateRange?: { start?: string; end?: string };
  };
  lastFetchTime?: Date;
  articleCount: number;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAccountParams {
  name: string;
  fetchMethod: string;
  categoryId?: number;
}

export interface UpdateAccountParams {
  name?: string;
  fetchMethod?: string;
  categoryId?: number;
}

export const accountApi = {
  getList: (categoryId?: number) =>
    request.get<WechatAccount[]>('/accounts', { params: { categoryId } }),
  getOne: (id: number) => request.get<WechatAccount>(`/accounts/${id}`),
  create: (params: CreateAccountParams) => request.post<WechatAccount>('/accounts', params),
  update: (id: number, params: UpdateAccountParams) =>
    request.patch<WechatAccount>(`/accounts/${id}`, params),
  delete: (id: number) => request.delete(`/accounts/${id}`),
  batchDelete: (ids: number[]) => request.post('/accounts/batch-delete', { ids }),
  fetch: (id: number, params?: { accountName?: string }) => request.post(`/accounts/${id}/fetch`, params),
  fetchByUrl: (params: { url: string; accountId?: number; categoryId?: number }) =>
    request.post('/accounts/fetch-by-url', params),
};

