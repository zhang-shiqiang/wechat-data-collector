import { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Form,
  Input,
  message,
  Typography,
} from 'antd';
import {
  SaveOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import request from '../api/request';
import './Settings.css';

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function Settings() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadCookies();
  }, []);

  const loadCookies = async () => {
    try {
      const data = await request.get<{ cookies: string }>('/settings/wechat-cookies');
      // 如果返回了cookies（包括默认值），就显示在输入框中
      if (data && data.cookies) {
        form.setFieldsValue({ cookies: data.cookies });
      }
    } catch (error: any) {
      // 如果接口不存在或出错，不显示错误，让后端返回默认值
      console.error('加载cookies失败:', error);
    }
  };

  const handleSubmit = async (values: { cookies: string }) => {
    setLoading(true);
    try {
      await request.post('/settings/wechat-cookies', { cookies: values.cookies });
      message.success('更新成功');
    } catch (error: any) {
      message.error(error.message || '更新失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-container">
      <Card className="settings-card">
        <div className="settings-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
              <SettingOutlined style={{ marginRight: 8, fontSize: 20 }} />
              <Title level={2} style={{ color: 'var(--text-primary)', margin: 0 }}>
                公众号 Cookie 管理
              </Title>
            </div>
            <Text type="secondary" style={{ fontSize: 14, display: 'block', marginTop: 8 }}>
              设置用于搜索公众号的微信 Cookie，搜索公众号时会使用此 Cookie
            </Text>
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ marginTop: 24 }}
        >
          <Form.Item
            name="cookies"
            label={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span>微信 Cookie</span>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  htmlType="submit"
                  loading={loading}
                  size="large"
                >
                  更新
                </Button>
              </div>
            }
            rules={[{ required: true, message: '请输入微信 Cookie' }]}
          >
            <TextArea
              rows={8}
              placeholder="请输入微信 Cookie 字符串"
              style={{ fontFamily: 'monospace', fontSize: 12 }}
            />
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
