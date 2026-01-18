import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, message, Typography, Divider } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, WechatOutlined, SafetyOutlined } from '@ant-design/icons';
import { authApi } from '../api/auth';
import { useAuthStore } from '../stores/authStore';
import './Register.css';

const { Title, Text } = Typography;

export default function Register() {
  const navigate = useNavigate();
  const { setUser, setToken } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: {
    username: string;
    password: string;
    email?: string;
    nickname?: string;
    confirm?: string;
  }) => {
    setLoading(true);
    try {
      // 移除 confirm 字段，只发送后端需要的字段
      const { confirm, ...registerData } = values;
      const data = await authApi.register(registerData);
      setUser(data);
      setToken('mock-token'); // TODO: 实现JWT后使用真实token
      message.success('注册成功');
      navigate('/dashboard');
    } catch (error: any) {
      message.error(error.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-background">
        <div className="register-background-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
      </div>
      
      <div className="register-content">
        <div className="register-brand">
          <div className="register-brand-icon">
            <WechatOutlined />
          </div>
          <Title level={1} className="register-brand-title">
            微信公众号管理阅读器
          </Title>
          <Text className="register-brand-subtitle">
            统一管理，高效阅读
          </Text>
        </div>

        <Card className="register-card" bordered={false}>
          <div className="register-header">
            <Title level={3} className="register-title">
              创建新账户
            </Title>
            <Text type="secondary" className="register-subtitle">
              注册账户以开始使用我们的服务
            </Text>
          </div>

          <Form
            name="register"
            onFinish={onFinish}
            autoComplete="off"
            size="large"
            layout="vertical"
            className="register-form"
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: '请输入用户名' },
                { min: 3, message: '用户名至少3个字符' },
              ]}
            >
              <Input
                prefix={<UserOutlined className="input-icon" />}
                placeholder="用户名"
                className="register-input"
              />
            </Form.Item>

            <Form.Item
              name="email"
              rules={[
                { type: 'email', message: '请输入有效的邮箱地址' },
              ]}
            >
              <Input
                prefix={<MailOutlined className="input-icon" />}
                placeholder="邮箱（可选）"
                className="register-input"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6个字符' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="input-icon" />}
                placeholder="密码"
                className="register-input"
              />
            </Form.Item>

            <Form.Item
              name="confirm"
              dependencies={['password']}
              rules={[
                { required: true, message: '请确认密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="input-icon" />}
                placeholder="确认密码"
                className="register-input"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                className="register-button"
                icon={<SafetyOutlined />}
              >
                注册
              </Button>
            </Form.Item>

            <Divider plain>
              <Text type="secondary" className="register-divider-text">
                或
              </Text>
            </Divider>

            <div className="register-footer">
              <Text type="secondary">
                已有账户？
              </Text>
              <Link to="/login" className="register-link">
                立即登录
              </Link>
            </div>
          </Form>
        </Card>

        <div className="register-features">
          <div className="feature-item">
            <div className="feature-icon">📚</div>
            <Text className="feature-text">统一管理</Text>
          </div>
          <div className="feature-item">
            <div className="feature-icon">⚡</div>
            <Text className="feature-text">高效阅读</Text>
          </div>
          <div className="feature-item">
            <div className="feature-icon">🎯</div>
            <Text className="feature-text">智能分类</Text>
          </div>
        </div>
      </div>
    </div>
  );
}

