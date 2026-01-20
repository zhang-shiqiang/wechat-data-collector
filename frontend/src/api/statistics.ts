import request from './request';

export interface DashboardOverview {
  totalAccounts: number;
  totalArticles: number;
  unreadArticles: number;
  todayAdded: number;
  trends: {
    totalAccounts: { value: number; isUp: boolean };
    totalArticles: { value: number; isUp: boolean };
    unreadArticles: { value: number; isUp: boolean };
    todayAdded: { value: number; isUp: boolean };
  };
}

/**
 * 获取仪表盘概览数据
 */
export const getDashboardOverview = async (): Promise<DashboardOverview> => {
  return request.get('/statistics/overview');
};
