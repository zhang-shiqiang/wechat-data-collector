import request from './request';

export interface Article {
  id: number;
  userId: number;
  accountId: number;
  account?: {
    id: number;
    name: string;
    avatar?: string;
  };
  categoryId?: number;
  category?: {
    id: number;
    name: string;
  };
  title: string;
  content?: string;
  summary?: string;
  coverImage?: string;
  originalUrl: string;
  publishTime?: Date;
  author?: string;
  readStatus: 'read' | 'unread';
  isFavorite: boolean;
  readProgress: number;
  readTime?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ArticleQueryParams {
  author?: string;
  accountName?: string;
  title?: string;
  categoryId?: number;
  readStatus?: 'read' | 'unread' | 'all';
  isFavorite?: boolean;
  startDate?: string;
  endDate?: string;
  sortBy?: 'publish_time' | 'created_at' | 'title';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface ArticleListResponse {
  articles: Article[];
  total: number;
  page: number;
  pageSize: number;
}

export const articleApi = {
  getList: (params?: ArticleQueryParams) =>
    request.get<ArticleListResponse>('/articles', { params }),
  getOne: (id: number) => request.get<Article>(`/articles/${id}`),
  updateReadStatus: (id: number, readStatus: 'read' | 'unread') =>
    request.put<Article>(`/articles/${id}/read`, { readStatus }),
  updateFavorite: (id: number, isFavorite: boolean) =>
    request.put<Article>(`/articles/${id}/favorite`, { isFavorite }),
  updateProgress: (id: number, progress: number) =>
    request.put<Article>(`/articles/${id}/progress`, { progress }),
  delete: (id: number) => request.delete(`/articles/${id}`),
};

