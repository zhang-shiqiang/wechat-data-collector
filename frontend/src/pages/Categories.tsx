import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Modal,
  Form,
  Input,
  message,
  Typography,
  Row,
  Col,
  Dropdown,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FolderOutlined,
  MoreOutlined,
  SearchOutlined,
  FileAddOutlined,
} from '@ant-design/icons';
import { categoryApi, Category, CreateCategoryParams } from '../api/category';
import './Categories.css';

const { Title, Text } = Typography;

export default function Categories() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await categoryApi.getList();
      setCategories(data as unknown as Category[]);
      setFilteredCategories(data as unknown as Category[]);
    } catch (error: any) {
      message.error(error.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  // 搜索分类
  const handleSearch = (value: string) => {
    setSearchText(value);
    if (!value || value.trim() === '') {
      setFilteredCategories(categories);
      return;
    }
    const filtered = categories.filter((category) =>
      category.name.toLowerCase().includes(value.toLowerCase().trim())
    );
    setFilteredCategories(filtered);
  };

  const handleCreate = () => {
    setEditingCategory(null);
    form.resetFields();
    form.setFieldsValue({
      sortOrder: 0, // 设置默认排序值为0
    });
    setModalVisible(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    form.setFieldsValue({
      name: category.name,
      parentId: category.parentId,
      sortOrder: category.sortOrder,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await categoryApi.delete(id);
      message.success('删除成功');
      loadCategories();
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  const handleSubmit = async (values: CreateCategoryParams) => {
    try {
      // 处理 sortOrder，确保是数字且 >= 0
      const submitValues: CreateCategoryParams = {
        ...values,
        sortOrder: values.sortOrder !== undefined && values.sortOrder !== null 
          ? Math.max(0, Number(values.sortOrder) || 0) 
          : 0,
      };

      if (editingCategory) {
        await categoryApi.update(editingCategory.id, submitValues);
        message.success('更新成功');
      } else {
        await categoryApi.create(submitValues);
        message.success('创建成功');
      }
      setModalVisible(false);
      form.resetFields();
      await loadCategories();
      // 如果正在搜索，重新应用搜索过滤
      if (searchText) {
        handleSearch(searchText);
      }
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  // 获取卡片背景颜色
  const getCardBackground = () => {
    return 'var(--bg-primary)';
  };

  // 获取卡片边框颜色
  const getCardBorderColor = () => {
    return 'var(--border-color)';
  };

  return (
    <div className="categories-container">
      <div className="categories-header">
        <Input
          placeholder="搜索分类名称"
          prefix={<SearchOutlined />}
          allowClear
          value={searchText}
          onChange={(e) => handleSearch(e.target.value)}
          style={{ maxWidth: 300 }}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
        >
          新建分类
        </Button>
      </div>

      {loading ? (
        <Card className="categories-card" loading={loading} />
      ) : filteredCategories.length === 0 ? (
        <div className="categories-empty-state">
          <div className="empty-state-content">
            <div className="empty-state-icon">
              <FolderOutlined />
            </div>
            <Title level={3} style={{ color: 'var(--text-primary)', marginTop: 24, marginBottom: 8 }}>
              {searchText ? '未找到匹配的分类' : '还没有创建分类'}
            </Title>
            <Text type="secondary" style={{ fontSize: 14, display: 'block', marginBottom: 32 }}>
              {searchText
                ? `没有找到包含"${searchText}"的分类，请尝试其他关键词`
                : '创建分类可以帮助您更好地组织和管理公众号与文章'}
            </Text>
            {!searchText && (
              <Button type="primary" size="large" icon={<PlusOutlined />} onClick={handleCreate}>
                创建第一个分类
              </Button>
            )}
          </div>
        </div>
      ) : (
        <Row gutter={[16, 16]} className="categories-grid">
          {filteredCategories.map((category) => {
            const menuItems = [
              {
                key: 'edit',
                label: '编辑',
                icon: <EditOutlined />,
                onClick: (e: any) => {
                  e?.domEvent?.stopPropagation();
                  handleEdit(category);
                },
              },
              {
                key: 'delete',
                label: '删除',
                icon: <DeleteOutlined />,
                danger: true,
                onClick: (e: any) => {
                  e?.domEvent?.stopPropagation();
                  Modal.confirm({
                    title: '确定要删除这个分类吗？',
                    content: '删除后，该分类下的公众号和文章将移至未分类',
                    okText: '确定',
                    cancelText: '取消',
                    onOk: () => handleDelete(category.id),
                  });
                },
              },
            ];

            return (
              <Col key={category.id} xs={24} sm={12} md={8} lg={5} xl={5}>
                <Card
                  className="category-card"
                  style={{
                    background: getCardBackground(),
                    borderColor: getCardBorderColor(),
                    borderWidth: 1,
                    height: '100%',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                  }}
                  hoverable
                  onClick={() => {
                    navigate(`/content?categoryId=${category.id}`);
                  }}
                >
                  <div className="category-card-content">
                    <div className="category-header">
                      <div className="category-action-button" onClick={(e) => e.stopPropagation()}>
                        <Dropdown
                          menu={{ items: menuItems }}
                          trigger={['click']}
                          placement="bottomRight"
                          getPopupContainer={(triggerNode) => {
                            const container = triggerNode.closest('.category-card') || document.body;
                            return container as HTMLElement;
                          }}
                        >
                          <Button
                            type="text"
                            icon={<MoreOutlined />}
                            className="category-more-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                            }}
                            onMouseDown={(e) => {
                              e.stopPropagation();
                            }}
                          />
                        </Dropdown>
                      </div>
                      <div className="category-icon-wrapper">
                        <FolderOutlined className="category-icon-default" />
                      </div>
                      <Text strong className="category-name" style={{ color: 'var(--text-primary)' }}>
                        {category.name}
                      </Text>
                    </div>
                    <div className="category-stats">
                      <div className="category-stat-item">
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          公众号
                        </Text>
                        <Text strong style={{ color: 'var(--text-primary)', fontSize: 18 }}>
                          {category.accountCount || 0}
                        </Text>
                      </div>
                      <div className="category-stat-divider" />
                      <div className="category-stat-item">
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          文章
                        </Text>
                        <Text strong style={{ color: 'var(--text-primary)', fontSize: 18 }}>
                          {category.articleCount || 0}
                        </Text>
                      </div>
                    </div>
                    <div className="category-today-stats">
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        今日更新文章
                      </Text>
                      <Text strong style={{ color: 'var(--primary-color)', fontSize: 14 }}>
                        {category.todayArticleCount || 0}
                      </Text>
                    </div>
                  </div>
                </Card>
              </Col>
            );
          })}
          {/* 新增分类卡片 */}
          <Col key="add-category" xs={24} sm={12} md={8} lg={5} xl={5}>
            <Card
              className="category-card category-add-card"
              style={{
                background: 'var(--bg-primary)',
                borderColor: 'var(--border-color)',
                borderWidth: 1,
                borderStyle: 'dashed',
                height: '100%',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
              }}
              hoverable
              onClick={handleCreate}
            >
              <div className="category-card-content category-add-content">
                <div className="category-add-icon">
                  <FileAddOutlined />
                </div>
                <Text type="secondary" style={{ fontSize: 14, textAlign: 'center' }}>
                  新增分类
                </Text>
              </div>
            </Card>
          </Col>
        </Row>
      )}

      <Modal
        title={editingCategory ? '编辑分类' : '新建分类'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={600}
        className="category-modal"
        styles={{
          content: {
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
          },
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="分类名称"
            rules={[{ required: true, message: '请输入分类名称' }]}
          >
            <Input placeholder="请输入分类名称" size="large" />
          </Form.Item>

          <Form.Item
            name="sortOrder"
            label="排序"
            rules={[
              { type: 'number', min: 0, message: '排序值必须大于等于0' },
            ]}
            initialValue={0}
            getValueFromEvent={(e) => {
              const value = e.target.value;
              return value === '' ? 0 : Number(value);
            }}
            normalize={(value) => {
              if (value === '' || value === null || value === undefined) {
                return 0;
              }
              const num = Number(value);
              return isNaN(num) ? 0 : Math.max(0, num);
            }}
          >
            <Input
              type="number"
              min={0}
              placeholder="排序值，数字越小越靠前（默认：0）"
              size="large"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

