import request from './request';

export interface Category {
  id: number;
  name: string;
  icon?: string;
  color?: string;
  parentId?: number;
  sortOrder: number;
  accountCount: number;
  articleCount: number;
  children?: Category[];
}

export interface CreateCategoryParams {
  name: string;
  icon?: string;
  color?: string;
  parentId?: number;
  sortOrder?: number;
}

export interface UpdateCategoryParams {
  name?: string;
  icon?: string;
  color?: string;
  parentId?: number;
  sortOrder?: number;
}

export const categoryApi = {
  getList: () => request.get<Category[]>('/categories'),
  getTree: () => request.get<Category[]>('/categories/tree'),
  getOne: (id: number) => request.get<Category>(`/categories/${id}`),
  create: (params: CreateCategoryParams) => request.post<Category>('/categories', params),
  update: (id: number, params: UpdateCategoryParams) =>
    request.patch<Category>(`/categories/${id}`, params),
  delete: (id: number) => request.delete(`/categories/${id}`),
};

