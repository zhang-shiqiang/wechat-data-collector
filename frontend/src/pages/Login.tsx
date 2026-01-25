import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Form, Input, Button, Card, message, Typography, Divider } from 'antd';
import { UserOutlined, LockOutlined, WechatOutlined, SafetyOutlined } from '@ant-design/icons';
import { authApi } from '../api/auth';
import { useAuthStore } from '../stores/authStore';
import WechatLogin from '../components/WechatLogin';
import './Login.css';

const { Title, Text } = Typography;

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser, setToken } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [wechatLoginVisible, setWechatLoginVisible] = useState(false);

  // 检查是否有微信登录回调
  useEffect(() => {
    const token = searchParams.get('token');
    const wechat = searchParams.get('wechat');
    const error = searchParams.get('error');

    if (error) {
      message.error(decodeURIComponent(error));
      // 清除URL参数
      navigate('/login', { replace: true });
    } else if (token && wechat === '1') {
      // 微信登录成功
      setToken(token);
      // 获取用户信息（authApi 返回的已经是 data）
      authApi.getProfile().then((userData: any) => {
        if (userData) {
          setUser(userData);
        }
      }).catch(() => {
        // 如果获取用户信息失败，仍然可以登录（因为已经设置了token和isAuthenticated）
      });
      message.success('微信登录成功');
      navigate('/dashboard');
    }
  }, [searchParams, navigate, setToken, setUser]);

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      // authApi.login 返回的已经是 data，不需要再访问 .data
      const userData = await authApi.login(values);
      setUser(userData);
      // TODO: 实现JWT后使用真实token，目前使用用户ID作为mock token
      setToken(`mock-token-${userData?.id || Date.now()}`);
      message.success('登录成功');
      navigate('/dashboard');
    } catch (error: any) {
      message.error(error.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="login-background-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
      </div>
      
      <div className="login-content">
        <div className="login-brand">
          <div className="login-brand-icon">
            <WechatOutlined />
          </div>
          <Title level={1} className="login-brand-title">
            微信公众号管理阅读器
          </Title>
          <Text className="login-brand-subtitle">
            统一管理，高效阅读
          </Text>
        </div>

        <Card className="login-card" bordered={false}>
          <div className="login-header">
            <Title level={3} className="login-title">
              欢迎回来
            </Title>
            <Text type="secondary" className="login-subtitle">
              登录您的账户以继续使用
            </Text>
          </div>

          <Form
            name="login"
            onFinish={onFinish}
            autoComplete="off"
            size="large"
            layout="vertical"
            className="login-form"
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input
                prefix={<UserOutlined className="input-icon" />}
                placeholder="用户名"
                className="login-input"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined className="input-icon" />}
                placeholder="密码"
                className="login-input"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                className="login-button"
                icon={<SafetyOutlined />}
              >
                登录
              </Button>
            </Form.Item>

            <Divider plain>
              <Text type="secondary" className="login-divider-text">
                或
              </Text>
            </Divider>

            <Form.Item>
              <Button
                type="default"
                block
                className="wechat-login-button"
                icon={<WechatOutlined />}
                onClick={() => setWechatLoginVisible(true)}
              >
                微信扫码登录
              </Button>
            </Form.Item>

            <div className="login-footer">
              <Text type="secondary">
                还没有账户？
              </Text>
              <Link to="/register" className="login-link">
                立即注册
              </Link>
            </div>
          </Form>
        </Card>

        <div className="login-features">
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

      <WechatLogin
        visible={wechatLoginVisible}
        onCancel={() => setWechatLoginVisible(false)}
        onSuccess={(token) => {
          setToken(token);
          message.success('微信登录成功');
          navigate('/dashboard');
        }}
      />
    </div>
  );
}

