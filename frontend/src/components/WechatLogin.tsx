import { useState, useEffect } from 'react';
import { Modal, QRCode, message, Typography, Spin } from 'antd';
import { WechatOutlined } from '@ant-design/icons';
import request from '../api/request';

const { Text } = Typography;

interface WechatLoginProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: (token: string) => void;
}

export default function WechatLogin({ visible, onCancel, onSuccess }: WechatLoginProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadQRCode();
      // 轮询检查登录状态
      const interval = setInterval(() => {
        checkLoginStatus();
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [visible]);

  const loadQRCode = async () => {
    setLoading(true);
    try {
      // 获取回调地址（后端地址）
      // 回调地址应该是在微信开放平台配置的授权回调域名下的完整URL
      // 例如：如果授权回调域名配置为 localhost:3000，则回调地址为 http://localhost:3000/api/wechat/callback
      const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
      const redirectUri = `${backendUrl}/api/wechat/callback`;
      const response = await request.get('/wechat/qrcode', {
        params: { redirectUri },
      });
      // request 拦截器已经提取了 data，所以直接使用
      setQrCodeUrl(response.qrCodeUrl);
    } catch (error: any) {
      console.error('获取二维码失败:', error);
      const errorMsg = error.message || '未知错误';
      message.error('获取二维码失败: ' + errorMsg);
      // 如果微信登录未配置，显示提示
      if (error.response?.status === 404 || errorMsg.includes('WECHAT') || errorMsg.includes('AppID')) {
        message.warning('微信登录功能需要配置微信开放平台 AppID 和 AppSecret，请参考 WECHAT_LOGIN_SETUP.md');
      }
    } finally {
      setLoading(false);
    }
  };

  const checkLoginStatus = async () => {
    // 检查URL参数中是否有token（微信回调后）
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const wechat = urlParams.get('wechat');

    if (token && wechat === '1') {
      onSuccess(token);
      onCancel();
      // 清除URL参数
      window.history.replaceState({}, '', window.location.pathname);
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <WechatOutlined style={{ fontSize: 20, color: '#07c160' }} />
          <span>微信扫码登录</span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={400}
      centered
    >
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        {loading ? (
          <Spin size="large" tip="正在生成二维码..." />
        ) : qrCodeUrl ? (
          <>
            <QRCode
              value={qrCodeUrl}
              size={200}
              errorLevel="M"
              style={{ marginBottom: 16 }}
            />
            <Text type="secondary" style={{ display: 'block', marginTop: 16 }}>
              使用微信扫一扫登录
            </Text>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
              扫码后请在手机上确认登录
            </Text>
          </>
        ) : (
          <div>
            <Text type="secondary">二维码加载失败</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
              请检查微信开放平台配置
            </Text>
          </div>
        )}
      </div>
    </Modal>
  );
}

