import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Tag,
  Typography,
  Image,
  Empty,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  AppstoreOutlined,
  ReloadOutlined,
  SearchOutlined,
  LinkOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { accountApi, WechatAccount, CreateAccountParams } from '../api/account';
import request from '../api/request';
import './Accounts.css';

const { Title, Text } = Typography;

export default function Accounts() {
  const [accounts, setAccounts] = useState<WechatAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<WechatAccount | null>(null);
  const [form] = Form.useForm();
  const [urlModalVisible, setUrlModalVisible] = useState(false);
  const [urlFetching, setUrlFetching] = useState(false);
  const [urlForm] = Form.useForm();
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchInputValue, setSearchInputValue] = useState('');

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const data = await accountApi.getList();
      setAccounts(data);
    } catch (error: any) {
      message.error(error.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingAccount(null);
    form.resetFields();
    form.setFieldsValue({
      fetchMethod: 'crawl',
    });
    setModalVisible(true);
  };

  const handleEdit = (account: WechatAccount) => {
    setEditingAccount(account);
    form.setFieldsValue({
      name: account.name,
      fetchMethod: account.fetchMethod,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await accountApi.delete(id);
      message.success('删除成功');
      loadAccounts();
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  const handleFetch = async (id: number, accountName: string) => {
    setFetching(id);
    try {
      message.loading({ content: `正在查询并加载 "${accountName}" 的文章列表...`, key: 'fetch', duration: 0 });
      await accountApi.fetch(id, { accountName });
      message.success({ content: '文章列表加载成功', key: 'fetch' });
      loadAccounts(); // 刷新列表以更新文章数量
    } catch (error: any) {
      message.error({ content: error.message || '查询失败，请检查公众号名称是否正确', key: 'fetch' });
    } finally {
      setFetching(null);
    }
  };

  const handleSubmit = async (values: { name: string; fetchMethod: string }) => {
    try {
      if (editingAccount) {
        await accountApi.update(editingAccount.id, values);
        message.success('更新成功');
      } else {
        await accountApi.create(values);
        message.success('创建成功，请点击"查询文章"按钮加载文章列表');
      }
      setModalVisible(false);
      form.resetFields();
      loadAccounts();
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const handleFetchByUrl = async (values: { url: string; accountId?: number; categoryId?: number }) => {
    setUrlFetching(true);
    try {
      message.loading({ content: '正在抓取文章...', key: 'fetchUrl', duration: 0 });
      const result = await accountApi.fetchByUrl(values);
      if (result.isNew) {
        message.success({ content: '文章抓取成功', key: 'fetchUrl' });
      } else {
        message.info({ content: '文章已存在', key: 'fetchUrl' });
      }
      setUrlModalVisible(false);
      urlForm.resetFields();
      loadAccounts(); // 刷新列表
    } catch (error: any) {
      message.error({ content: error.message || '抓取失败，请检查链接是否正确', key: 'fetchUrl' });
    } finally {
      setUrlFetching(false);
    }
  };

  const columns = [
    {
      title: '公众号',
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
      title: '抓取方式',
      dataIndex: 'fetchMethod',
      key: 'fetchMethod',
      width: 120,
      render: (method: string) => {
        const methodMap: Record<string, { text: string; color: string }> = {
          rss: { text: 'RSS订阅', color: 'blue' },
          crawl: { text: '网页爬虫', color: 'green' },
          api: { text: 'API接口', color: 'purple' },
        };
        const info = methodMap[method] || { text: method, color: 'default' };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '文章数',
      key: 'articles',
      width: 120,
      render: (_: any, record: WechatAccount) => (
        <Space direction="vertical" size={0}>
          <Text style={{ color: 'var(--text-primary)' }}>总数: {record.articleCount}</Text>
          <Text style={{ color: 'var(--primary-color)' }}>未读: {record.unreadCount}</Text>
        </Space>
      ),
    },
    {
      title: '最后更新',
      dataIndex: 'lastFetchTime',
      key: 'lastFetchTime',
      width: 180,
      render: (time: Date) => (
        <span style={{ color: 'var(--text-primary)' }}>
          {time ? new Date(time).toLocaleString('zh-CN') : '从未抓取'}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      render: (_: any, record: WechatAccount) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<SearchOutlined />}
            loading={fetching === record.id}
            onClick={() => handleFetch(record.id, record.name)}
          >
            查询文章
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个公众号吗？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="accounts-container">
      <div className="accounts-header">
        <Title level={2} style={{ color: 'var(--text-primary)', margin: 0 }}>公众号列表</Title>
        <Space>
          <Button
            type="default"
            icon={<LinkOutlined />}
            onClick={() => setUrlModalVisible(true)}
          >
            根据链接抓取
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            添加公众号
          </Button>
        </Space>
      </div>

      <Card className="accounts-card">
        {accounts.length === 0 ? (
          <Empty
            description={<span style={{ color: 'var(--text-secondary)' }}>还没有添加公众号</span>}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              添加第一个公众号
            </Button>
          </Empty>
        ) : (
          <Table
            columns={columns}
            dataSource={accounts}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 个公众号`,
            }}
          />
        )}
      </Card>

      <Modal
        title={editingAccount ? '编辑公众号' : '添加公众号'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setSearchInputValue('');
          setSearchResults([]);
          setShowSearchResults(false);
        }}
        onOk={() => form.submit()}
        width={520}
        okText="确定"
        cancelText="取消"
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="公众号名称"
            rules={[{ required: true, message: '请输入公众号名称' }]}
            extra='输入公众号名称后，可以点击搜索图标搜索公众号，或直接点击"查询文章"按钮加载文章'
          >
            <Input.Group compact style={{ display: 'flex' }}>
              <Input
                placeholder="请输入公众号名称，例如：Vue中文社区"
                size="large"
                style={{ flex: 1 }}
                value={searchInputValue}
                onFocus={() => {
                  if (searchResults.length > 0) {
                    setShowSearchResults(true);
                  }
                }}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchInputValue(value);
                  // 同步到表单
                  form.setFieldsValue({ name: value });
                  if (!value) {
                    setSearchResults([]);
                    setShowSearchResults(false);
                  }
                }}
              />
              <Button
                size="large"
                icon={<SearchOutlined />}
                loading={searching}
                onClick={async () => {
                  // 优先使用输入框的值，如果没有则从表单获取
                  const name = searchInputValue || form.getFieldValue('name') || '';
                  if (!name || name.trim() === '') {
                    message.warning('请先输入公众号名称');
                    return;
                  }
                  setSearching(true);
                  try {
                    // 注意：request 拦截器已经处理了响应，返回的是 data 字段
                    const response = await request.get('/accounts/search', {
                      params: { query: name.trim() },
                    });
                    if (response && response.list && response.list.length > 0) {
                      setSearchResults(response.list);
                      setShowSearchResults(true);
                      message.success(`找到 ${response.list.length} 个相关公众号`);
                    } else {
                      setSearchResults([]);
                      setShowSearchResults(false);
                      message.info('未找到相关公众号');
                    }
                  } catch (error: any) {
                    const errorMsg = error.response?.data?.message || error.message || '搜索失败';
                    message.error(errorMsg);
                    setSearchResults([]);
                    setShowSearchResults(false);
                  } finally {
                    setSearching(false);
                  }
                }}
              >
                搜索
              </Button>
            </Input.Group>
            {showSearchResults && searchResults.length > 0 && (
              <div
                style={{
                  marginTop: 8,
                  border: '1px solid var(--border-color)',
                  borderRadius: 8,
                  background: 'var(--bg-primary)',
                  maxHeight: 200,
                  overflowY: 'auto',
                }}
              >
                {searchResults.map((item: any, index: number) => (
                  <div
                    key={index}
                    onClick={() => {
                      const selectedName = item.nickname || item.name;
                      setSearchInputValue(selectedName);
                      form.setFieldsValue({ name: selectedName });
                      setShowSearchResults(false);
                    }}
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      borderBottom: index < searchResults.length - 1 ? '1px solid var(--border-color)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--bg-secondary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--bg-primary)';
                    }}
                  >
                    {item.headimg && (
                      <img
                        src={item.headimg}
                        alt={item.nickname}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 8,
                          objectFit: 'cover',
                        }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>
                        {item.nickname || item.name}
                      </div>
                      {item.alias && (
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                          {item.alias}
                        </div>
                      )}
                    </div>
                    <CheckOutlined style={{ color: 'var(--primary-color)' }} />
                  </div>
                ))}
              </div>
            )}
          </Form.Item>

          <Form.Item
            name="fetchMethod"
            label="抓取方式"
            rules={[{ required: true, message: '请选择抓取方式' }]}
            extra="选择获取文章的方式"
          >
            <Select size="large">
              <Select.Option value="rss">RSS订阅（如果公众号支持）</Select.Option>
              <Select.Option value="crawl">网页爬虫（通过搜索公众号获取文章）</Select.Option>
              <Select.Option value="api">API接口（需要配置API密钥）</Select.Option>
            </Select>
          </Form.Item>

          <div
            className="feasibility-notice"
            style={{
              marginTop: 16,
              padding: 16,
              background: 'var(--bg-tertiary)',
              borderRadius: 8,
              fontSize: 13,
              lineHeight: 1.6,
              border: '1px solid var(--border-color)',
            }}
          >
            <div
              style={{
                fontWeight: 600,
                marginBottom: 8,
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>⚠️</span>
              <span>可行性说明</span>
            </div>
            <div style={{ marginBottom: 6, color: 'var(--text-secondary)' }}>
              • RSS订阅：仅适用于支持RSS的公众号（较少）
            </div>
            <div style={{ marginBottom: 6, color: 'var(--text-secondary)' }}>
              • 网页爬虫：通过搜狗微信搜索等第三方平台，可能不稳定
            </div>
            <div style={{ marginBottom: 10, color: 'var(--text-secondary)' }}>
              • API接口：需要微信公众平台认证，个人用户难以获取
            </div>
            <div
              style={{
                color: 'var(--primary-color)',
                fontWeight: 500,
                paddingTop: 8,
                borderTop: '1px solid var(--border-color)',
              }}
            >
              建议：优先尝试RSS，其次使用网页爬虫方式
            </div>
          </div>
        </Form>
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
            extra="请输入微信公众号文章的完整链接，例如：https://mp.weixin.qq.com/s/xxx"
          >
            <Input.TextArea
              rows={3}
              placeholder="https://mp.weixin.qq.com/s/..."
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="accountId"
            label="关联公众号（可选）"
            extra="如果选择公众号，文章将关联到该公众号"
          >
            <Select
              placeholder="选择公众号（可选）"
              allowClear
              size="large"
            >
              {accounts.map((account) => (
                <Select.Option key={account.id} value={account.id}>
                  {account.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <div
            className="url-fetch-notice"
            style={{
              marginTop: 16,
              padding: 16,
              background: 'var(--bg-tertiary)',
              borderRadius: 8,
              fontSize: 13,
              lineHeight: 1.6,
              border: '1px solid var(--border-color)',
            }}
          >
            <div
              style={{
                fontWeight: 600,
                marginBottom: 8,
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>ℹ️</span>
              <span>功能说明</span>
            </div>
            <div style={{ marginBottom: 6, color: 'var(--text-secondary)' }}>
              • 支持直接输入微信公众号文章链接进行抓取
            </div>
            <div style={{ marginBottom: 6, color: 'var(--text-secondary)' }}>
              • 自动提取文章标题、作者、摘要、封面图、正文内容等信息
            </div>
            <div style={{ marginBottom: 10, color: 'var(--text-secondary)' }}>
              • 如果文章已存在，将提示并跳过保存
            </div>
          </div>
        </Form>
      </Modal>
    </div>
  );
}

