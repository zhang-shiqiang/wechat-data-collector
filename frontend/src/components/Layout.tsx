import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Layout as AntLayout,
  Menu,
  Avatar,
  Dropdown,
  Space,
  Typography,
  Button,
  Badge,
} from 'antd';
import {
  DashboardOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  WechatOutlined,
  SunOutlined,
  MoonOutlined,
  FolderOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import './Layout.css';

const { Header, Sider, Content } = AntLayout;
const { Text } = Typography;

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '仪表盘',
    },
    {
      key: '/categories',
      icon: <FolderOutlined />,
      label: '分类管理',
    },
    {
      key: '/content',
      icon: <AppstoreOutlined />,
      label: '内容管理',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      logout();
      navigate('/login');
    } else if (key === 'profile') {
      // TODO: 跳转到个人资料页面
    } else {
      navigate(key);
    }
  };

  return (
    <AntLayout className="app-layout">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={260}
        collapsedWidth={80}
        className="app-sider"
      >
        <div className="logo">
          <div className="logo-icon">
            <WechatOutlined />
          </div>
          {!collapsed && (
            <div className="logo-content">
              <Text strong className="logo-text">
                微信公众号阅读器
              </Text>
              <Text className="logo-subtitle">WeChat Reader</Text>
            </div>
          )}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          className="app-menu"
        />
        {!collapsed && (
          <div className="sider-footer">
            <Text className="sider-footer-text">v1.0.0</Text>
          </div>
        )}
      </Sider>
      <AntLayout className={`app-main-layout ${collapsed ? 'collapsed' : ''}`}>
        <Header className="app-header">
          <div className="header-left">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="trigger"
            />
            <div className="header-breadcrumb">
              <Text className="header-title">
                {menuItems.find(item => item.key === location.pathname)?.label || '仪表盘'}
              </Text>
            </div>
          </div>
          <div className="header-right">
            <Button
              type="text"
              icon={theme === 'light' ? <MoonOutlined /> : <SunOutlined />}
              className="header-action-btn"
              onClick={toggleTheme}
              title={theme === 'light' ? '切换到暗色模式' : '切换到亮色模式'}
            />
            <Badge count={0} showZero={false}>
              <Button
                type="text"
                icon={<BellOutlined />}
                className="header-action-btn"
              />
            </Badge>
            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: handleMenuClick,
              }}
              placement="bottomRight"
            >
              <Space className="user-info" style={{ cursor: 'pointer' }}>
                <Avatar 
                  size="default"
                  icon={<UserOutlined />}
                  className="user-avatar"
                />
                <div className="user-details">
                  <Text strong className="user-name">
                    {user?.nickname || user?.username}
                  </Text>
                  <Text type="secondary" className="user-role">
                    {user?.role === 'admin' ? '管理员' : '普通用户'}
                  </Text>
                </div>
              </Space>
            </Dropdown>
          </div>
        </Header>
        <Content className="app-content">
          <div className="content-wrapper">
            {children}
          </div>
        </Content>
      </AntLayout>
    </AntLayout>
  );
}

