import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Typography, Space, Spin } from 'antd';
import {
  AppstoreOutlined,
  FileTextOutlined,
  ReadOutlined,
  ClockCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import { getDashboardOverview } from '../api/statistics';
import type { DashboardOverview } from '../api/statistics';
import './Dashboard.css';

const { Title, Text } = Typography;

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getDashboardOverview();
        setOverview(data);
      } catch (error) {
        console.error('获取仪表盘数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const stats = overview
    ? [
        {
          title: '公众号总数',
          value: overview.totalAccounts,
          prefix: <AppstoreOutlined />,
          color: '#667eea',
          bgColor: 'rgba(102, 126, 234, 0.15)',
          trend: `${overview.trends.totalAccounts.isUp ? '+' : '-'}${overview.trends.totalAccounts.value}%`,
          trendUp: overview.trends.totalAccounts.isUp,
        },
        {
          title: '文章总数',
          value: overview.totalArticles,
          prefix: <FileTextOutlined />,
          color: '#7c3aed',
          bgColor: 'rgba(124, 58, 237, 0.15)',
          trend: `${overview.trends.totalArticles.isUp ? '+' : '-'}${overview.trends.totalArticles.value}%`,
          trendUp: overview.trends.totalArticles.isUp,
        },
        {
          title: '未读文章',
          value: overview.unreadArticles,
          prefix: <ReadOutlined />,
          color: '#a855f7',
          bgColor: 'rgba(168, 85, 247, 0.15)',
          trend: `${overview.trends.unreadArticles.isUp ? '+' : '-'}${overview.trends.unreadArticles.value}%`,
          trendUp: overview.trends.unreadArticles.isUp,
        },
        {
          title: '今日新增',
          value: overview.todayAdded,
          prefix: <ClockCircleOutlined />,
          color: '#764ba2',
          bgColor: 'rgba(118, 75, 162, 0.15)',
          trend: `${overview.trends.todayAdded.isUp ? '+' : '-'}${overview.trends.todayAdded.value}%`,
          trendUp: overview.trends.todayAdded.isUp,
        },
      ]
    : [
        {
          title: '公众号总数',
          value: 0,
          prefix: <AppstoreOutlined />,
          color: '#667eea',
          bgColor: 'rgba(102, 126, 234, 0.15)',
          trend: '0%',
          trendUp: true,
        },
        {
          title: '文章总数',
          value: 0,
          prefix: <FileTextOutlined />,
          color: '#7c3aed',
          bgColor: 'rgba(124, 58, 237, 0.15)',
          trend: '0%',
          trendUp: true,
        },
        {
          title: '未读文章',
          value: 0,
          prefix: <ReadOutlined />,
          color: '#a855f7',
          bgColor: 'rgba(168, 85, 247, 0.15)',
          trend: '0%',
          trendUp: false,
        },
        {
          title: '今日新增',
          value: 0,
          prefix: <ClockCircleOutlined />,
          color: '#764ba2',
          bgColor: 'rgba(118, 75, 162, 0.15)',
          trend: '0%',
          trendUp: true,
        },
      ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <Title level={2} className="dashboard-title">
            仪表盘
          </Title>
          <Text type="secondary" className="dashboard-subtitle">
            欢迎回来，这是您的数据概览
          </Text>
        </div>
      </div>

      <Spin spinning={loading}>
        <Row gutter={[24, 24]} className="dashboard-stats">
          {stats.map((stat, index) => (
            <Col xs={24} sm={12} lg={6} key={index}>
              <Card className="stat-card" bordered={false} hoverable>
                <div className="stat-icon-wrapper" style={{ background: stat.bgColor }}>
                  <div className="stat-icon" style={{ color: stat.color }}>
                    {stat.prefix}
                  </div>
                </div>
                <div className="stat-content">
                  <Statistic
                    title={<Text type="secondary" className="stat-title">{stat.title}</Text>}
                    value={stat.value}
                    valueStyle={{ 
                      color: stat.color,
                      fontSize: '28px',
                      fontWeight: 600,
                    }}
                    className="statistic-wrapper"
                  />
                  <div className="stat-trend">
                    <Space size={4}>
                      {stat.trendUp ? (
                        <ArrowUpOutlined style={{ color: '#667eea', fontSize: '12px' }} />
                      ) : (
                        <ArrowDownOutlined style={{ color: '#a855f7', fontSize: '12px' }} />
                      )}
                      <Text 
                        style={{ 
                          color: stat.trendUp ? '#667eea' : '#a855f7',
                          fontSize: '12px',
                          fontWeight: 500,
                        }}
                      >
                        {stat.trend}
                      </Text>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        较昨日
                      </Text>
                    </Space>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
          <Col xs={24} lg={16}>
            <Card className="dashboard-card" bordered={false}>
              <Title level={4} style={{ marginBottom: 16 }}>
                最近活动
              </Title>
              <div className="empty-state">
                <Text type="secondary">暂无最近活动</Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card className="dashboard-card" bordered={false}>
              <Title level={4} style={{ marginBottom: 16 }}>
                快速操作
              </Title>
              <div className="empty-state">
                <Text type="secondary">暂无快速操作</Text>
              </div>
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
}

