import { useState, useEffect } from 'react';
import {
  Card,
  Input,
  Select,
  Button,
  Space,
  Tag,
  Typography,
  Empty,
  Pagination,
  Row,
  Col,
  Popconfirm,
  message,
  DatePicker,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  StarOutlined,
  StarFilled,
  DeleteOutlined,
  CalendarOutlined,
  UserOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { articleApi, Article, ArticleQueryParams } from '../api/article';
import { accountApi } from '../api/account';
import { categoryApi } from '../api/category';
import './Articles.css';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function Articles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  // 筛选条件
  const [filters, setFilters] = useState<ArticleQueryParams>({
    readStatus: 'all',
    sortBy: 'publish_time',
    sortOrder: 'desc',
  });

  useEffect(() => {
    loadArticles();
    loadAccounts();
    loadCategories();
  }, [page, pageSize, filters]);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const data = await articleApi.getList({
        ...filters,
        page,
        pageSize,
      });
      setArticles(data.articles);
      setTotal(data.total);
    } catch (error: any) {
      message.error(error.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const loadAccounts = async () => {
    try {
      const accounts = await accountApi.getList();
      setAccounts(accounts);
    } catch (error) {
      console.error('加载公众号失败', error);
    }
  };

  const loadCategories = async () => {
    try {
      const categories = await categoryApi.getList();
      setCategories(categories);
    } catch (error) {
      console.error('加载分类失败', error);
    }
  };

  const handleSearch = (value: string) => {
    setFilters({ ...filters, title: value || undefined });
    setPage(1);
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters({ ...filters, [key]: value });
    setPage(1);
  };

  const handleDateRangeChange = (dates: any) => {
    if (dates && dates.length === 2) {
      setFilters({
        ...filters,
        startDate: dayjs(dates[0]).format('YYYY-MM-DD'),
        endDate: dayjs(dates[1]).format('YYYY-MM-DD'),
      });
    } else {
      setFilters({
        ...filters,
        startDate: undefined,
        endDate: undefined,
      });
    }
    setPage(1);
  };

  const handleToggleRead = async (article: Article) => {
    try {
      const newStatus = article.readStatus === 'read' ? 'unread' : 'read';
      await articleApi.updateReadStatus(article.id, newStatus);
      message.success(newStatus === 'read' ? '已标记为已读' : '已标记为未读');
      loadArticles();
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const handleToggleFavorite = async (article: Article) => {
    try {
      await articleApi.updateFavorite(article.id, !article.isFavorite);
      message.success(article.isFavorite ? '已取消收藏' : '已收藏');
      loadArticles();
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await articleApi.delete(id);
      message.success('删除成功');
      loadArticles();
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  return (
    <div className="articles-container">
      <div className="articles-header">
        <Title level={2} style={{ color: 'var(--text-primary)', margin: 0 }}>
          文章列表
        </Title>
        <Popconfirm
          title="确定要清空所有文章数据吗？此操作不可恢复！"
          onConfirm={async () => {
            try {
              await articleApi.clearAll();
              message.success('清空成功');
              loadArticles();
            } catch (error: any) {
              message.error(error.message || '清空失败');
            }
          }}
        >
          <Button type="default" danger>
            清空所有文章
          </Button>
        </Popconfirm>
      </div>

      <Card className="articles-filter-card">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Input
              placeholder="搜索文章标题"
              prefix={<SearchOutlined />}
              allowClear
              onPressEnter={(e) => handleSearch(e.currentTarget.value)}
              onChange={(e) => {
                if (!e.target.value) {
                  handleSearch('');
                }
              }}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Select
              placeholder="阅读状态"
              style={{ width: '100%' }}
              value={filters.readStatus}
              onChange={(value) => handleFilterChange('readStatus', value)}
            >
              <Select.Option value="all">全部</Select.Option>
              <Select.Option value="unread">未读</Select.Option>
              <Select.Option value="read">已读</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Select
              placeholder="公众号"
              style={{ width: '100%' }}
              allowClear
              showSearch
              value={filters.accountName}
              onChange={(value) => handleFilterChange('accountName', value)}
            >
              {accounts.map((account) => (
                <Select.Option key={account.id} value={account.name}>
                  {account.name}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Select
              placeholder="分类"
              style={{ width: '100%' }}
              allowClear
              value={filters.categoryId}
              onChange={(value) => handleFilterChange('categoryId', value)}
            >
              {categories.map((category) => (
                <Select.Option key={category.id} value={category.id}>
                  {category.name}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <RangePicker
              style={{ width: '100%' }}
              placeholder={['开始日期', '结束日期']}
              onChange={handleDateRangeChange}
            />
          </Col>
        </Row>
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Select
              placeholder="排序方式"
              style={{ width: '100%' }}
              value={filters.sortBy}
              onChange={(value) => handleFilterChange('sortBy', value)}
            >
              <Select.Option value="publish_time">发布时间</Select.Option>
              <Select.Option value="created_at">创建时间</Select.Option>
              <Select.Option value="title">标题</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Select
              placeholder="排序方向"
              style={{ width: '100%' }}
              value={filters.sortOrder}
              onChange={(value) => handleFilterChange('sortOrder', value)}
            >
              <Select.Option value="desc">降序</Select.Option>
              <Select.Option value="asc">升序</Select.Option>
            </Select>
          </Col>
        </Row>
      </Card>

      <Card className="articles-list-card" loading={loading}>
        {articles.length === 0 ? (
          <Empty description="暂无文章" />
        ) : (
          <div className="articles-list">
            {articles.map((article) => (
              <Card
                key={article.id}
                className="article-card"
                hoverable
                onClick={() => {
                  // TODO: 跳转到文章详情页
                  window.open(article.originalUrl, '_blank');
                }}
              >
                <Row gutter={16}>
                  <Col xs={24}>
                    <div className="article-content">
                      <div className="article-header">
                        <Title level={4} className="article-title">
                          {article.title}
                        </Title>
                        <Space className="article-actions">
                          <Button
                            type="text"
                            size="small"
                            icon={
                              article.readStatus === 'read' ? (
                                <EyeOutlined />
                              ) : (
                                <EyeInvisibleOutlined />
                              )
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleRead(article);
                            }}
                          >
                            {article.readStatus === 'read' ? '已读' : '未读'}
                          </Button>
                          <Button
                            type="text"
                            size="small"
                            icon={
                              article.isFavorite ? (
                                <StarFilled />
                              ) : (
                                <StarOutlined />
                              )
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFavorite(article);
                            }}
                          >
                            {article.isFavorite ? '已收藏' : '收藏'}
                          </Button>
                          <Popconfirm
                            title="确定要删除这篇文章吗？"
                            onConfirm={(e) => {
                              e?.stopPropagation();
                              handleDelete(article.id);
                            }}
                          >
                            <Button
                              type="text"
                              size="small"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={(e) => e.stopPropagation()}
                            >
                              删除
                            </Button>
                          </Popconfirm>
                        </Space>
                      </div>
                      {article.summary && (
                        <div className="article-summary" style={{ 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          color: 'var(--text-secondary)'
                        }}>
                          {article.summary}
                        </div>
                      )}
                      <div className="article-meta">
                        <Space size="middle">
                          {article.account && (
                            <Space size={4}>
                              <AppstoreOutlined />
                              <Text type="secondary">{article.account.name}</Text>
                            </Space>
                          )}
                          {article.author && (
                            <Space size={4}>
                              <UserOutlined />
                              <Text type="secondary">{article.author}</Text>
                            </Space>
                          )}
                          {article.publishTime && (
                            <Space size={4}>
                              <CalendarOutlined />
                              <Text type="secondary">
                                {dayjs(article.publishTime).format('YYYY-MM-DD HH:mm')}
                              </Text>
                            </Space>
                          )}
                          {article.category && (
                            <Tag color="blue">{article.category.name}</Tag>
                          )}
                          {article.readStatus === 'unread' && (
                            <Tag color="red">未读</Tag>
                          )}
                          {article.isFavorite && (
                            <Tag color="gold">收藏</Tag>
                          )}
                        </Space>
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card>
            ))}
          </div>
        )}

        {total > 0 && (
          <div className="articles-pagination">
            <Pagination
              current={page}
              pageSize={pageSize}
              total={total}
              showSizeChanger
              showTotal={(total) => `共 ${total} 篇文章`}
              onChange={(page, pageSize) => {
                setPage(page);
                setPageSize(pageSize);
              }}
              onShowSizeChange={(_current, size) => {
                setPage(1);
                setPageSize(size);
              }}
            />
          </div>
        )}
      </Card>
    </div>
  );
}

