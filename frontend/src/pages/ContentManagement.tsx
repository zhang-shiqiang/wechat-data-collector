import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  AutoComplete,
  message,
  Popconfirm,
  Tag,
  Typography,
  Image,
  Empty,
  Row,
  Col,
  Tree,
  Tabs,
  Pagination,
  DatePicker,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  AppstoreOutlined,
  ReloadOutlined,
  SearchOutlined,
  LinkOutlined,
  FileTextOutlined,
  FolderOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  StarOutlined,
  StarFilled,
  CalendarOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { accountApi, WechatAccount, CreateAccountParams } from '../api/account';
import { articleApi, Article, ArticleQueryParams } from '../api/article';
import { categoryApi, Category } from '../api/category';
import request from '../api/request';
import dayjs from 'dayjs';
import './ContentManagement.css';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface CategoryNode extends Category {
  key: string;
  title: string;
  children?: CategoryNode[];
}

export default function ContentManagement() {
  const [searchParams] = useSearchParams();
  // 分类相关
  const [categoryTree, setCategoryTree] = useState<CategoryNode[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);
  const [selectedCategoryPath, setSelectedCategoryPath] = useState<Category[]>([]);

  // 公众号相关
  const [accounts, setAccounts] = useState<WechatAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<WechatAccount | null>(null);
  const [accountForm] = Form.useForm();
  const [fetching, setFetching] = useState<number | null>(null);
  const [urlModalVisible, setUrlModalVisible] = useState(false);
  const [urlFetching, setUrlFetching] = useState(false);
  const [urlForm] = Form.useForm();
  const [searching, setSearching] = useState(false);
  const [searchOptions, setSearchOptions] = useState<any[]>([]);

  // 文章相关
  const [articles, setArticles] = useState<Article[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [articlesTotal, setArticlesTotal] = useState(0);
  const [articlesPage, setArticlesPage] = useState(1);
  const [articlesPageSize, setArticlesPageSize] = useState(20);
  const [articleFilters, setArticleFilters] = useState<ArticleQueryParams>({
    readStatus: 'all',
    sortBy: 'publish_time',
    sortOrder: 'desc',
  });

  const [activeTab, setActiveTab] = useState<'accounts' | 'articles'>('accounts');

  useEffect(() => {
    loadCategoryTree();
  }, []);

  // 从URL参数中获取分类ID并选中
  useEffect(() => {
    const categoryIdParam = searchParams.get('categoryId');
    if (categoryIdParam && categoryTree.length > 0) {
      const categoryId = parseInt(categoryIdParam, 10);
      if (!isNaN(categoryId)) {
        // 构建分类路径
        const findPath = (nodes: CategoryNode[], targetId: number, currentPath: Category[]): boolean => {
          for (const node of nodes) {
            const newPath = [...currentPath, node];
            if (node.id === targetId) {
              setSelectedCategoryId(targetId);
              setSelectedCategoryPath(newPath);
              return true;
            }
            if (node.children && findPath(node.children, targetId, newPath)) {
              return true;
            }
          }
          return false;
        };
        findPath(categoryTree, categoryId, []);
      }
    }
  }, [searchParams, categoryTree]);

  // 默认选中第一个分类（如果没有URL参数）
  useEffect(() => {
    const categoryIdParam = searchParams.get('categoryId');
    if (categoryTree.length > 0 && selectedCategoryId === undefined && !categoryIdParam) {
      const firstCategory = categoryTree[0];
      setSelectedCategoryId(firstCategory.id);
      setSelectedCategoryPath([firstCategory]);
    }
  }, [categoryTree, selectedCategoryId, searchParams]);

  useEffect(() => {
    if (activeTab === 'accounts') {
      loadAccounts();
    } else {
      loadArticles();
    }
  }, [activeTab, selectedCategoryId]);

  useEffect(() => {
    if (activeTab === 'articles') {
      loadArticles();
    }
  }, [articlesPage, articlesPageSize, articleFilters]);

  // 加载分类树
  const loadCategoryTree = async () => {
    try {
      const categories = await categoryApi.getTree();
      const tree = buildCategoryTree(categories);
      setCategoryTree(tree);
    } catch (error: any) {
      message.error(error.message || '加载分类失败');
    }
  };

  // 构建分类树（递归处理所有层级）
  const buildCategoryTree = (categories: Category[]): CategoryNode[] => {
    const map = new Map<number, CategoryNode>();

    // 创建所有节点
    categories.forEach((cat) => {
      map.set(cat.id, {
        ...cat,
        key: `category-${cat.id}`,
        title: cat.name,
        children: [],
      });
    });

    // 构建树结构（递归处理多层级）
    const buildTree = (parentId: number | undefined, level: number = 0): CategoryNode[] => {
      const children: CategoryNode[] = [];
      categories.forEach((cat) => {
        if ((!parentId && !cat.parentId) || (parentId && cat.parentId === parentId)) {
          const node = map.get(cat.id)!;
          // 递归获取子节点
          node.children = buildTree(cat.id, level + 1);
          children.push(node);
        }
      });
      return children;
    };

    return buildTree(undefined);
  };

  // 加载公众号列表
  const loadAccounts = async (categoryId?: number) => {
    const targetCategoryId = categoryId !== undefined ? categoryId : selectedCategoryId;
    setAccountsLoading(true);
    try {
      const accounts = await accountApi.getList(targetCategoryId);
      setAccounts(accounts);
    } catch (error: any) {
      message.error(error.message || '加载失败');
    } finally {
      setAccountsLoading(false);
    }
  };

  // 加载文章列表
  const loadArticles = async (categoryId?: number) => {
    const targetCategoryId = categoryId !== undefined ? categoryId : selectedCategoryId;
    setArticlesLoading(true);
    try {
      const data = await articleApi.getList({
        ...articleFilters,
        categoryId: targetCategoryId,
        page: articlesPage,
        pageSize: articlesPageSize,
      });
      setArticles(data.articles);
      setArticlesTotal(data.total);
    } catch (error: any) {
      message.error(error.message || '加载失败');
    } finally {
      setArticlesLoading(false);
    }
  };

  // 处理分类选择
  const handleCategorySelect = (selectedKeys: React.Key[]) => {
    if (selectedKeys.length > 0) {
      const categoryId = parseInt(selectedKeys[0].toString().replace('category-', ''));

      // 如果点击的是同一个分类，不重复设置
      if (categoryId === selectedCategoryId) {
        return;
      }

      setSelectedCategoryId(categoryId);

      // 构建分类路径
      const findPath = (nodes: CategoryNode[], targetId: number, currentPath: Category[]): boolean => {
        for (const node of nodes) {
          const newPath = [...currentPath, node];
          if (node.id === targetId) {
            setSelectedCategoryPath(newPath);
            return true;
          }
          if (node.children && findPath(node.children, targetId, newPath)) {
            return true;
          }
        }
        return false;
      };
      findPath(categoryTree, categoryId, []);

      // 立即加载数据
      if (activeTab === 'accounts') {
        loadAccounts(categoryId);
      } else {
        loadArticles(categoryId);
      }
    } else {
      setSelectedCategoryId(undefined);
      setSelectedCategoryPath([]);

      // 立即加载所有数据
      if (activeTab === 'accounts') {
        loadAccounts(undefined);
      } else {
        loadArticles(undefined);
      }
    }
  };

  // 处理分类点击（跳转到子分类）
  const handleCategoryClick = (category: CategoryNode) => {
    // 如果点击的是同一个分类，不重复设置
    if (category.id === selectedCategoryId) {
      return;
    }

    setSelectedCategoryId(category.id);

    // 构建分类路径
    const findPath = (nodes: CategoryNode[], targetId: number, currentPath: Category[]): boolean => {
      for (const node of nodes) {
        const newPath = [...currentPath, node];
        if (node.id === targetId) {
          setSelectedCategoryPath(newPath);
          return true;
        }
        if (node.children && findPath(node.children, targetId, newPath)) {
          return true;
        }
      }
      return false;
    };
    findPath(categoryTree, category.id, []);

    // 立即加载数据
    if (activeTab === 'accounts') {
      loadAccounts(category.id);
    } else {
      loadArticles(category.id);
    }
  };

  // 公众号相关操作
  const handleCreateAccount = () => {
    setEditingAccount(null);
    accountForm.resetFields();
    setAccountModalVisible(true);
  };

  const handleEditAccount = (account: WechatAccount) => {
    setEditingAccount(account);
    accountForm.setFieldsValue({
      name: account.name,
    });
    setAccountModalVisible(true);
  };

  const handleDeleteAccount = async (id: number) => {
    try {
      await accountApi.delete(id);
      message.success('删除成功');
      loadAccounts();
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewData, setPreviewData] = useState<{
    accountId: number;
    accountName: string;
    fakeid?: string;
    preview?: any;
  } | null>(null);

  const handleFetchAccount = async (id: number, accountName: string, fakeid?: string) => {
    setFetching(id);
    try {
      message.loading({ content: `正在查询 "${accountName}" 的可导入文章...`, key: 'preview', duration: 0 });
      const response = await accountApi.preview(id, { accountName, fakeid });
      // request 拦截器已经返回了 data，所以 response 直接就是数据对象
      
      // 如果所有文章都已存在，直接提示用户，不显示弹窗
      if (response.newArticles === 0) {
        message.destroy('preview');
        message.info({
          content: `暂无可导入文章，所有 ${response.total} 篇文章均已存在`,
          duration: 3,
        });
        return;
      }
      
      setPreviewData({
        accountId: id,
        accountName,
        fakeid,
        preview: (response as any).data,
      });
      setPreviewModalVisible(true);
      message.destroy('preview');
    } catch (error: any) {
      message.error({ content: error.message || '查询失败，请检查公众号名称是否正确', key: 'preview' });
    } finally {
      setFetching(null);
    }
  };

  const handleConfirmImport = async () => {
    if (!previewData) return;

    setFetching(previewData.accountId);
    try {
      message.loading({ content: `正在导入 "${previewData.accountName}" 的文章...`, key: 'import', duration: 0 });
      await accountApi.fetch(previewData.accountId, {
        accountName: previewData.accountName,
        fakeid: previewData.fakeid,
      });
      message.success({ content: '文章导入成功', key: 'import' });
      setPreviewModalVisible(false);
      setPreviewData(null);
      loadAccounts();
    } catch (error: any) {
      message.error({ content: error.message || '导入失败', key: 'import' });
    } finally {
      setFetching(null);
    }
  };

  const handleSubmitAccount = async (values: CreateAccountParams & { fakeid?: string }) => {
    try {
      // 使用当前选中的分类
      const categoryId = selectedCategoryId;

      const submitValues: CreateAccountParams = {
        name: values.name,
        fetchMethod: 'crawl', // 默认使用网页爬虫方式
        categoryId,
        fakeid: values.fakeid,
      };

      if (editingAccount) {
        await accountApi.update(editingAccount.id, submitValues);
        message.success('更新成功');
      } else {
        await accountApi.create(submitValues);
        message.success('创建成功，请点击"查询文章"按钮加载文章列表');
      }
      setAccountModalVisible(false);
      accountForm.resetFields();
      loadAccounts();
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const handleFetchByUrl = async (values: { url: string; categoryId?: number; categoryName?: string }) => {
    setUrlFetching(true);
    try {
      let categoryId = values.categoryId || selectedCategoryId;

      // 如果提供了分类名称而不是ID，先创建分类
      if (values.categoryName && !categoryId) {
        try {
          const newCategory = await categoryApi.create({
            name: values.categoryName,
            parentId: undefined, // 创建一级分类
          });
          categoryId = newCategory.id;
          // 重新加载分类树
          await loadCategoryTree();
        } catch (error: any) {
          message.error({ content: error.message || '创建分类失败', key: 'fetchUrl' });
          return;
        }
      }

      message.loading({ content: '正在抓取文章...', key: 'fetchUrl', duration: 0 });
      const result = await accountApi.fetchByUrl({
        url: values.url,
        categoryId,
      });
      if (result.isNew) {
        message.success({ content: '文章抓取成功', key: 'fetchUrl' });
      } else {
        message.info({ content: '文章已存在', key: 'fetchUrl' });
      }
      setUrlModalVisible(false);
      urlForm.resetFields();
      loadAccounts();
      if (activeTab === 'articles') {
        loadArticles();
      }
    } catch (error: any) {
      message.error({ content: error.message || '抓取失败，请检查链接是否正确', key: 'fetchUrl' });
    } finally {
      setUrlFetching(false);
    }
  };

  // 文章相关操作
  const handleSearchArticle = (value: string) => {
    setArticleFilters({ ...articleFilters, title: value || undefined });
    setArticlesPage(1);
  };

  const handleFilterChange = (key: string, value: any) => {
    setArticleFilters({ ...articleFilters, [key]: value });
    setArticlesPage(1);
  };

  const handleDateRangeChange = (dates: any) => {
    if (dates && dates.length === 2) {
      setArticleFilters({
        ...articleFilters,
        startDate: dayjs(dates[0]).format('YYYY-MM-DD'),
        endDate: dayjs(dates[1]).format('YYYY-MM-DD'),
      });
    } else {
      setArticleFilters({
        ...articleFilters,
        startDate: undefined,
        endDate: undefined,
      });
    }
    setArticlesPage(1);
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

  const handleDeleteArticle = async (id: number) => {
    try {
      await articleApi.delete(id);
      message.success('删除成功');
      loadArticles();
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  // 公众号表格列
  const accountColumns = [
    {
      title: '公众号名称',
      key: 'account',
      width: 250,
      render: (_: any, record: WechatAccount) => (
        <Space>
          {record.avatar ? (
            <Image
              src={record.avatar}
              alt={record.name}
              width={40}
              height={40}
              style={{ borderRadius: 8 }}
              preview={false}
            />
          ) : (
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 18,
              }}
            >
              <AppstoreOutlined />
            </div>
          )}
          <div>
            <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
              {record.name}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: '文章数',
      key: 'articles',
      width: 120,
      render: (_: any, record: WechatAccount) => {
        const readCount = record.articleCount - record.unreadCount;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              已读: {readCount}
            </span>
            <span style={{ color: 'var(--border-color)', fontSize: 12 }}>|</span>
            <span style={{ color: 'var(--text-secondary)' }}>
              未读: {record.unreadCount}
            </span>
          </div>
        );
      },
    },
    {
      title: '最后更新',
      dataIndex: 'lastFetchTime',
      key: 'lastFetchTime',
      width: 120,
      render: (time: Date | string | null | undefined) => {
        if (!time) {
          return <span style={{ color: 'var(--text-secondary)' }}>从未抓取</span>;
        }
        const formatted = dayjs(time).format('YYYY-MM-DD HH:mm:ss');
        return <span style={{ color: 'var(--text-secondary)' }}>{formatted}</span>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      align: 'center' as const,
      render: (_: any, record: WechatAccount) => (
        <Space size={8}>
          <Button
            type="text"
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => handleFetchAccount(record.id, record.name, record.fakeid)}
            loading={fetching === record.id}
            title="更新文章"
          />
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditAccount(record)}
            title="编辑"
          />
          <Popconfirm
            title="确定要删除这个公众号吗？"
            onConfirm={() => handleDeleteAccount(record.id)}
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              title="删除"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="content-management-container">
      <Row gutter={16} style={{ height: '100%', margin: 0 }}>
        {/* 左侧分类树 */}
        <Col style={{ width: 240, flexShrink: 0, paddingLeft: 0 }}>
          <Card
            title={
              <Space>
                <FolderOutlined />
                <span>分类管理</span>
              </Space>
            }
            className="category-tree-card"
            extra={
              <Button
                type="link"
                size="small"
                onClick={() => {
                  setSelectedCategoryId(undefined);
                  setSelectedCategoryPath([]);
                  // 立即加载所有数据
                  if (activeTab === 'accounts') {
                    loadAccounts(undefined);
                  } else {
                    loadArticles(undefined);
                  }
                }}
              >
                全部
              </Button>
            }
          >
            <Tree
              showLine={{ showLeafIcon: false }}
              defaultExpandAll
              selectedKeys={selectedCategoryId ? [`category-${selectedCategoryId}`] : []}
              onSelect={handleCategorySelect}
              treeData={categoryTree}
              blockNode
              titleRender={(node) => (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCategoryClick(node);
                  }}
                  className="category-tree-node"
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, width: '100%', minWidth: 0 }}
                >
                  <FolderOutlined className="category-tree-icon" />
                  <span className="category-tree-text" title={node.title}>{node.title}</span>
                </div>
              )}
            />
          </Card>
        </Col>

        {/* 右侧内容区 */}
        <Col style={{ flex: 1, minWidth: 0, paddingRight: 0 }}>
          <Card className="content-card">
            <div className="content-header">
              <Title level={2} style={{ color: 'var(--text-primary)', margin: 0 }}>
                {selectedCategoryPath.length > 0
                  ? selectedCategoryPath.map(cat => cat.name).join(' / ')
                  : '全部内容'}
              </Title>
              <Space>
                {activeTab === 'accounts' && (
                  <>
                    <Popconfirm
                      title="确定要清空所有公众号数据吗？此操作不可恢复！"
                      onConfirm={async () => {
                        try {
                          await accountApi.clearAll();
                          message.success('清空成功');
                          loadAccounts();
                        } catch (error: any) {
                          message.error(error.message || '清空失败');
                        }
                      }}
                    >
                      <Button type="default" danger>
                        清空所有公众号
                      </Button>
                    </Popconfirm>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleCreateAccount}
                    >
                      添加公众号
                    </Button>
                  </>
                )}
                {activeTab === 'articles' && (
                  <Button
                    type="default"
                    icon={<LinkOutlined />}
                    onClick={() => {
                      if (selectedCategoryId) {
                        urlForm.setFieldsValue({ categoryId: selectedCategoryId });
                      } else {
                        urlForm.setFieldsValue({ categoryId: undefined });
                      }
                      setUrlModalVisible(true);
                    }}
                  >
                    根据链接抓取
                  </Button>
                )}
              </Space>
            </div>

            <Tabs
              activeKey={activeTab}
              onChange={(key) => setActiveTab(key as 'accounts' | 'articles')}
              style={{ marginTop: 16 }}
              items={[
                {
                  key: 'accounts',
                  label: (
                    <span>
                      <AppstoreOutlined />
                      公众号管理
                    </span>
                  ),
                  children: accounts.length === 0 ? (
                    <Empty
                      description={<span style={{ color: 'var(--text-secondary)' }}>还没有添加公众号</span>}
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    >
                      <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateAccount}>
                        添加第一个公众号
                      </Button>
                    </Empty>
                  ) : (
                    <Table
                      columns={accountColumns}
                      dataSource={accounts}
                      rowKey="id"
                      loading={accountsLoading}
                      pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `共 ${total} 个公众号`,
                      }}
                      scroll={{ x: 1200 }}
                    />
                  ),
                },
                {
                  key: 'articles',
                  label: (
                    <span>
                      <FileTextOutlined />
                      文章管理
                    </span>
                  ),
                  children: (
                    <>
                      <Card className="articles-filter-card" style={{ marginBottom: 16 }}>
                        <Row gutter={[16, 16]}>
                          <Col xs={24} sm={12} md={8} lg={6}>
                            <Input
                              placeholder="搜索文章标题"
                              prefix={<SearchOutlined />}
                              allowClear
                              onPressEnter={(e) => handleSearchArticle(e.currentTarget.value)}
                              onChange={(e) => {
                                if (!e.target.value) {
                                  handleSearchArticle('');
                                }
                              }}
                            />
                          </Col>
                          <Col xs={24} sm={12} md={8} lg={4}>
                            <Select
                              placeholder="阅读状态"
                              style={{ width: '100%' }}
                              value={articleFilters.readStatus}
                              onChange={(value) => handleFilterChange('readStatus', value)}
                            >
                              <Select.Option value="all">全部</Select.Option>
                              <Select.Option value="unread">未读</Select.Option>
                              <Select.Option value="read">已读</Select.Option>
                            </Select>
                          </Col>
                          <Col xs={24} sm={12} md={8} lg={6}>
                            <RangePicker
                              style={{ width: '100%' }}
                              placeholder={['开始日期', '结束日期']}
                              onChange={handleDateRangeChange}
                            />
                          </Col>
                          <Col xs={24} sm={12} md={8} lg={4}>
                            <Select
                              placeholder="排序方式"
                              style={{ width: '100%' }}
                              value={articleFilters.sortBy}
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
                              value={articleFilters.sortOrder}
                              onChange={(value) => handleFilterChange('sortOrder', value)}
                            >
                              <Select.Option value="desc">降序</Select.Option>
                              <Select.Option value="asc">升序</Select.Option>
                            </Select>
                          </Col>
                        </Row>
                      </Card>

                      <Card className="articles-list-card" loading={articlesLoading}>
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
                                  window.open(article.originalUrl, '_blank');
                                }}
                                style={{ marginBottom: 16 }}
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
                                              handleDeleteArticle(article.id);
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

                        {articlesTotal > 0 && (
                          <div className="articles-pagination" style={{ marginTop: 16 }}>
                            <Pagination
                              current={articlesPage}
                              pageSize={articlesPageSize}
                              total={articlesTotal}
                              showSizeChanger
                              showTotal={(total) => `共 ${total} 篇文章`}
                              onChange={(page, pageSize) => {
                                setArticlesPage(page);
                                setArticlesPageSize(pageSize);
                              }}
                              onShowSizeChange={(_current, size) => {
                                setArticlesPage(1);
                                setArticlesPageSize(size);
                              }}
                            />
                          </div>
                        )}
                      </Card>
                    </>
                  ),
                },
              ]}
            />
          </Card>
        </Col>
      </Row>

      {/* 添加/编辑公众号模态框 */}
      <Modal
        title={editingAccount ? '编辑公众号' : '添加公众号'}
        open={accountModalVisible}
        onCancel={() => {
          setAccountModalVisible(false);
          accountForm.resetFields();
          setSearchOptions([]);
        }}
        onOk={() => accountForm.submit()}
        width={640}
        okText="确定"
        cancelText="取消"
        destroyOnHidden
        className="content-management-modal"
      >
        <Form
          form={accountForm}
          layout="vertical"
          onFinish={handleSubmitAccount}
        >
          <Form.Item name="fakeid" hidden>
            <Input />
          </Form.Item>
          <Form.Item
            name="name"
            label="公众号名称"
            rules={[{ required: true, message: '请输入公众号名称' }]}
            extra='输入公众号名称后，会自动搜索相关公众号，或直接点击"查询文章"按钮加载文章'
          >
            <AutoComplete
              size="large"
              placeholder="请输入公众号名称，例如：Vue中文社区"
              options={searchOptions}
              onSearch={async (value) => {
                if (!value || value.trim() === '') {
                  setSearchOptions([]);
                  return;
                }

                setSearching(true);
                try {
                  const data = await request.get<{ list: any[] }>('/accounts/search', {
                    params: { query: value.trim() },
                  });
                  if (data && data.list && data.list.length > 0) {
                    const options = data.list.map((item: any) => ({
                      value: item.nickname || item.name,
                      fakeid: item.fakeid,
                      label: (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {item.headimg && (
                            <img
                              src={item.headimg}
                              alt={item.nickname}
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 6,
                                objectFit: 'cover',
                              }}
                            />
                          )}
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                              {item.nickname || item.name}
                            </div>
                            {item.alias && (
                              <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                                {item.alias}
                              </div>
                            )}
                          </div>
                        </div>
                      ),
                    }));
                    setSearchOptions(options);
                  } else {
                    setSearchOptions([]);
                  }
                } catch (error: any) {
                  const errorMsg = error.response?.data?.message || error.message || '搜索失败';
                  message.error(errorMsg);
                  setSearchOptions([]);
                } finally {
                  setSearching(false);
                }
              }}
              onSelect={(value, option) => {
                accountForm.setFieldsValue({ 
                  name: value,
                  fakeid: option.fakeid,
                });
              }}
              filterOption={false}
              notFoundContent={searching ? '搜索中...' : '未找到相关公众号'}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 预览文章确认对话框 */}
      <Modal
        title="确认导入文章"
        open={previewModalVisible}
        onCancel={() => {
          setPreviewModalVisible(false);
          setPreviewData(null);
        }}
        onOk={handleConfirmImport}
        confirmLoading={fetching !== null}
        width={800}
        className="content-management-modal preview-articles-modal"
        style={{ top: 20 }}
        bodyStyle={{ 
          display: 'flex', 
          flexDirection: 'column', 
          height: 'calc(100vh - 200px)',
          maxHeight: '600px',
          padding: '20px'
        }}
      >
        {previewData?.preview && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
            <div style={{ marginBottom: 16, padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 8, flexShrink: 0 }}>
              <Space size="large">
                <Text strong style={{ color: 'var(--text-primary)' }}>
                  总计: <span style={{ color: 'var(--primary-color)' }}>{previewData.preview.total}</span> 篇
                </Text>
                <Text strong style={{ color: 'var(--text-primary)' }}>
                  可导入: <span style={{ color: '#52c41a' }}>{previewData.preview.newArticles}</span> 篇
                </Text>
                <Text strong style={{ color: 'var(--text-primary)' }}>
                  已存在: <span style={{ color: 'var(--text-tertiary)' }}>{previewData.preview.existingArticles}</span> 篇
                </Text>
              </Space>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
              {previewData.preview.articles.map((article: any, index: number) => {
                // 使用后端返回的 isExisting 标记
                const isExisting = article.isExisting || false;
                return (
                  <div
                    key={index}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <FileTextOutlined style={{ color: isExisting ? 'var(--text-tertiary)' : 'var(--primary-color)', fontSize: 16 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        color: isExisting ? 'var(--text-tertiary)' : 'var(--text-primary)',
                        fontSize: 14,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        textDecoration: isExisting ? 'line-through' : 'none',
                      }}>
                        {article.title}
                      </div>
                      <div style={{
                        color: 'var(--text-tertiary)',
                        fontSize: 12,
                        marginTop: 4,
                      }}>
                        {dayjs(article.publishTime).format('YYYY-MM-DD HH:mm')}
                      </div>
                    </div>
                    {isExisting && (
                      <Tag color="default" style={{ margin: 0 }}>已存在</Tag>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Modal>

      {/* 根据链接抓取文章的模态框 */}
      <Modal
        title="根据链接抓取文章"
        open={urlModalVisible}
        onCancel={() => {
          setUrlModalVisible(false);
          urlForm.resetFields();
        }}
        onOk={() => urlForm.submit()}
        confirmLoading={urlFetching}
        width={600}
        className="content-management-modal"
      >
        <Form
          form={urlForm}
          layout="vertical"
          onFinish={handleFetchByUrl}
        >
          <Form.Item
            name="url"
            label="文章链接"
            rules={[
              { required: true, message: '请输入文章链接' },
              {
                pattern: /https?:\/\/.*mp\.weixin\.qq\.com\/.*/,
                message: '请输入有效的微信公众号文章链接',
              },
            ]}
            extra="请输入微信公众号文章的完整链接"
          >
            <Input.TextArea
              rows={3}
              placeholder="https://mp.weixin.qq.com/s/..."
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="categoryId"
            label="分类（可选）"
            extra="选择已有分类，或输入新分类名称自动创建一级分类"
          >
            <AutoComplete
              size="large"
              placeholder="选择分类或输入新分类名称"
              allowClear
              options={(() => {
                const flattenCategories = (nodes: CategoryNode[]): any[] => {
                  const result: any[] = [];
                  nodes.forEach((node) => {
                    result.push({
                      value: `existing-${node.id}`,
                      label: node.name,
                      isNew: false,
                    });
                    if (node.children) {
                      result.push(...flattenCategories(node.children));
                    }
                  });
                  return result;
                };
                return flattenCategories(categoryTree);
              })()}
              onSelect={(value) => {
                if (value.startsWith('existing-')) {
                  const categoryId = parseInt(value.replace('existing-', ''));
                  urlForm.setFieldsValue({ categoryId, categoryName: undefined });
                }
              }}
              onSearch={(value) => {
                if (value && !categoryTree.some(cat => cat.name === value)) {
                  // 如果输入的值不在现有分类中，允许创建新分类
                  urlForm.setFieldsValue({ categoryName: value, categoryId: undefined });
                }
              }}
              filterOption={(input, option) => {
                if (!option) return false;
                return option.label.toLowerCase().includes(input.toLowerCase());
              }}
            />
          </Form.Item>
          <Form.Item name="categoryName" hidden>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
